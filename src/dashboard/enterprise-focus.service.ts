import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PrismaService } from '../prisma/prisma.service';

// ---------------------------------------------------------
// GitHub API Types
// ---------------------------------------------------------

interface ConsumedLicensesResponse {
  total_seats_purchased: number;
  total_seats_consumed: number;
  users: Array<{
    github_com_login: string;
    github_com_name: string;
    license_type: string;
    github_com_enterprise_roles: string[];
    github_com_two_factor_auth: boolean;
    ghe_license_active: boolean;
  }>;
}

interface CopilotSeatsResponse {
  total_seats: number;
  seats: Array<{
    created_at: string;
    assignee: {
      login: string;
      id: number;
      avatar_url: string;
    };
    last_activity_at: string | null;
    last_activity_editor: string | null;
    last_authenticated_at: string | null;
    plan_type: string;
  }>;
}

interface AuditLogEntry {
  action: string;
  actor?: string;
  user?: string;
  created_at: number;
  data?: any;
}

interface CopilotUsageResponse {
  // We'll define as we see the response structure if it works
  [key: string]: any;
}

// ---------------------------------------------------------
// Component Result Types
// ---------------------------------------------------------

export interface LicenseStatusResult {
  totalSeatsPurchased: number;
  totalSeatsConsumed: number;
  usagePercentage: number;
  status: 'OVER_LIMIT' | 'NEAR_FULL' | 'COMFORTABLE' | 'NORMAL';
  users: any[];
}

export interface CopilotSeatsResult {
  totalSeats: number;
  seats: any[];
}

export interface ProductivityResult {
  summary: {
    productive: number;
    moderate: number;
    wasteful: number;
  };
  editorBreakdown: any[];
}

// ---------------------------------------------------------
// Recommendation Types
// ---------------------------------------------------------

export type RecommendationType =
  | 'revoke'
  | 'review'
  | 'low_productivity'
  | 'sync';
export type SeverityLevel = 'high' | 'medium' | 'low';
export type IssueCode =
  | 'NEVER_ACTIVE'
  | 'INACTIVE_90_PLUS'
  | 'INACTIVE_30_89'
  | 'LOW_USAGE_15_29'
  | 'LOW_BILLING_USAGE'
  | 'NO_BILLING_DATA'
  | 'SEAT_MISMATCH';

export interface RecommendationItem {
  // --- User info ---
  user: {
    email: string;
    name: string;
    githubLogin: string;
  };

  // --- Activity snapshot ---
  activity: {
    lastActivityAt: string | null;
    lastActivityEditor: string | null;
    editorParsed: string | null; // e.g. "VS Code 1.114.0"
    copilotExtension: string | null; // e.g. "copilot-chat v0.42.3"
    lastAuthenticatedAt: string | null;
    seatCreatedAt: string | null;
    daysSinceActivity: number | null;
    daysSinceLogin: number | null;
    daysSinceSeatCreated: number | null;
  };

  // --- Issue detected ---
  issue: {
    code: IssueCode;
    label: string; // short badge label e.g. "Revoke", "Review"
    badgeColor: 'red' | 'yellow' | 'green' | 'gray';
    description: string; // detailed explanation
  };

  // --- Recommended action ---
  recommendation: {
    type: RecommendationType;
    label: string; // action text
    description: string; // longer explanation
  };

  severity: SeverityLevel;
  potentialSavingsUsd: number;
  potentialSavingsLabel: string; // "$19/bulan" or "-"
}

export interface RecommendationSummary {
  totalSeats: number;
  totalFlagged: number;
  healthySeats: number;
  wastagePercent: number;

  bySeverity: {
    high: number;
    medium: number;
    low: number;
  };

  byType: {
    revoke: { count: number; savingsUsd: number };
    review: { count: number; savingsUsd: number };
    low_productivity: { count: number };
    sync: { count: number };
  };

  totalPotentialSavingsUsd: number;
  totalPotentialSavingsLabel: string;
}

export interface ActionRecommendationsResponse {
  recommendations: RecommendationItem[];
  summary: RecommendationSummary;
  generatedAt: string;
}

// ---------------------------------------------------------
// Main Service
// ---------------------------------------------------------

@Injectable()
export class EnterpriseFocusService {
  private api: AxiosInstance;
  private enterprise: string;
  private readonly logger = new Logger(EnterpriseFocusService.name);
  private organizationId: number = 0; // Sentinel for initialization

  constructor(private prisma: PrismaService) {
    const token = process.env.GITHUB_TOKEN;
    this.enterprise = process.env.GITHUB_ENTERPRISE_SLUG || 'bri';

    this.api = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      timeout: 15000,
    });
  }

  /**
   * Ensure GitHubOrganization record exists and is cached in this service
   */
  private async ensureOrganization(): Promise<number> {
    if (this.organizationId !== 0) return this.organizationId;

    const orgName = process.env.GITHUB_ORG || 'briapp';

    // Find a team to associate with (needed for upsert create path)
    const team = await this.prisma.team.findFirst({ orderBy: { id: 'asc' } });
    if (!team) {
      throw new Error('Database not seeded. Please run master_seed.ts first.');
    }

    // Use upsert to be safe against race conditions when multiple requests
    // arrive simultaneously before the in-memory cache (organizationId) is set.
    const org = await this.prisma.gitHubOrganization.upsert({
      where: { organizationName: orgName },
      update: {}, // nothing to update if already exists
      create: {
        organizationName: orgName,
        enterpriseSlug: this.enterprise,
        personalAccessToken: '[MANAGED]', // Actual token is in .env
        teamId: team.id,
        isActive: true,
      },
    });

    this.organizationId = org.id;
    return org.id;
  }

  // ---------------------------------------------------------
  // 🔄 SYNC METHODS
  // ---------------------------------------------------------

  /**
   * Sync from /enterprises/{slug}/consumed-licenses
   */
  async syncConsumedLicenses(): Promise<void> {
    this.logger.log('🔄 Syncing consumed licenses...');
    const orgId = await this.ensureOrganization();

    try {
      const response = await this.api.get<ConsumedLicensesResponse>(
        `/enterprises/${this.enterprise}/consumed-licenses`,
        { params: { per_page: 100 } },
      );

      const { total_seats_purchased, total_seats_consumed, users } =
        response.data;
      const month = this.getCurrentMonth();

      const usagePercentage =
        total_seats_purchased > 0
          ? (total_seats_consumed / total_seats_purchased) * 100
          : total_seats_consumed > 0
            ? 100
            : 0;

      // 1. Update overall usage stats
      await this.prisma.copilotSeatUsage.upsert({
        where: {
          organizationId_month: {
            organizationId: orgId,
            month,
          },
        },
        update: {
          totalSeatsPurchased: total_seats_purchased,
          totalSeatsConsumed: total_seats_consumed,
          usagePercentage,
          syncedAt: new Date(),
        },
        create: {
          organization: { connect: { id: orgId } },
          month,
          totalSeatsPurchased: total_seats_purchased,
          totalSeatsConsumed: total_seats_consumed,
          usagePercentage,
          syncedAt: new Date(),
        },
      });

      // 2. Clear then re-fill members info from this list
      // Note: We don't delete to avoid breaking audit log relations, but we upsert
      for (const user of users) {
        if (!user.github_com_login) continue;

        // Generate pseudo-id if not provided (hash of login)
        const pseudoId = this.hashCode(user.github_com_login);

        await this.prisma.gitHubMember.upsert({
          where: { githubId: pseudoId },
          update: {
            name: user.github_com_name,
            hasCopilotLicense: user.license_type === 'Enterprise',
            githubLicenseType: user.license_type,
            isActive: user.ghe_license_active,
            updatedAt: new Date(),
          },
          create: {
            organization: { connect: { id: orgId } },
            githubLogin: user.github_com_login,
            githubId: pseudoId,
            name: user.github_com_name,
            role: user.github_com_enterprise_roles?.[0] || 'member',
            hasCopilotLicense: user.license_type === 'Enterprise',
            githubLicenseType: user.license_type,
            isActive: user.ghe_license_active,
          },
        });
      }

      this.logger.log(
        `✅ Synced ${users.length} member statuses from consumed-licenses`,
      );
    } catch (error: any) {
      this.logger.error(`Error in syncConsumedLicenses: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync from /enterprises/{slug}/copilot/billing/seats
   */
  async syncCopilotSeats(): Promise<void> {
    this.logger.log('🔄 Syncing copilot/billing/seats...');
    const orgId = await this.ensureOrganization();

    try {
      const response = await this.api.get<CopilotSeatsResponse>(
        `/enterprises/${this.enterprise}/copilot/billing/seats`,
        { params: { per_page: 100 } },
      );

      const seats = response.data.seats || [];

      // Wipe old cached seat details for this org then bulk create
      await this.prisma.copilotSeatDetail.deleteMany({
        where: { organizationId: orgId },
      });

      // Pre-load member name map (by login) so we can store real names in seat detail
      const existingMembers = await this.prisma.gitHubMember.findMany({
        where: { organizationId: orgId },
        select: { githubLogin: true, name: true },
      });
      const existingMemberNameMap = new Map<string, string | null>();
      for (const m of existingMembers) {
        existingMemberNameMap.set(m.githubLogin, m.name);
      }

      const seatsToInsert = seats.map((seat) => ({
        organizationId: orgId,
        githubLogin: seat.assignee.login,
        githubId: seat.assignee.id,
        // Use real name from GitHubMember if available, fallback to login
        name:
          existingMemberNameMap.get(seat.assignee.login) || seat.assignee.login,
        lastActivityAt: seat.last_activity_at
          ? new Date(seat.last_activity_at)
          : null,
        lastActivityEditor: seat.last_activity_editor || null,
        lastAuthenticatedAt: seat.last_authenticated_at
          ? new Date(seat.last_authenticated_at)
          : null,
        seatCreatedAt: seat.created_at ? new Date(seat.created_at) : null,
        licenseType: seat.plan_type,
        syncedAt: new Date(),
      }));

      if (seatsToInsert.length > 0) {
        await this.prisma.copilotSeatDetail.createMany({
          data: seatsToInsert,
        });
      }

      this.logger.log(`✅ Synced ${seatsToInsert.length} copilot seats`);
    } catch (error: any) {
      this.logger.error(`Error in syncCopilotSeats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync from /enterprises/{slug}/audit-log
   */
  async syncAuditLogs(): Promise<void> {
    this.logger.log('🔄 Syncing audit logs...');
    const orgId = await this.ensureOrganization();

    try {
      // NOTE: GitHub audit log for Enterprise usually returns an array directly
      const response = await this.api.get<AuditLogEntry[]>(
        `/enterprises/${this.enterprise}/audit-log`,
        { params: { per_page: 100, include: 'all' } },
      );

      const logs = response.data || [];

      // We only keep the last 100 logs per org to avoid bloat
      for (const entry of logs.slice(0, 50)) {
        await this.prisma.gitHubAuditLog.create({
          data: {
            organization: { connect: { id: orgId } },
            action: entry.action,
            actor: entry.actor || entry.user || 'unknown',
            details: entry.data ? JSON.stringify(entry.data) : null,
            createdAt: new Date(entry.created_at),
          },
        });
      }

      this.logger.log(`✅ Synced ${logs.length} audit log entries`);
    } catch (error: any) {
      this.logger.error(`Error in syncAuditLogs: ${error.message}`);
      throw error;
    }
  }

  async syncCopilotUsage(): Promise<void> {
    this.logger.log('🔄 Syncing copilot usage metrics...');
    const orgId = await this.ensureOrganization();
    const orgName = process.env.GITHUB_ORG || 'briapp';
    const month = this.getCurrentMonth();

    // Try endpoints in order of preference:
    // 1. /orgs/{org}/copilot/usage           (Copilot Business org-level)
    // 2. /enterprises/{slug}/copilot/usage   (Copilot Enterprise)
    // 3. /orgs/{org}/copilot/metrics         (newer API, requires higher tier)
    // 4. /enterprises/{slug}/copilot/metrics (enterprise metrics)
    const endpointsToTry = [
      `/orgs/${orgName}/copilot/usage`,
      `/enterprises/${this.enterprise}/copilot/usage`,
      `/orgs/${orgName}/copilot/metrics`,
      `/enterprises/${this.enterprise}/copilot/metrics`,
    ];

    let response: any = null;
    let usedEndpoint = '';

    for (const endpoint of endpointsToTry) {
      try {
        response = await this.api.get(endpoint, {
          headers: { Accept: 'application/vnd.github+json' },
        });
        usedEndpoint = endpoint;
        this.logger.log(`✅ Successfully reached ${endpoint}`);
        break; // Stop on first success
      } catch (err: any) {
        const status = err.response?.status;
        const msg = err.response?.data?.message || err.message;
        this.logger.warn(`⚠️ ${endpoint} returned ${status}: ${msg}`);
        if (status !== 404 && status !== 403) {
          // Unexpected error — stop trying
          this.logger.error(
            `Error in syncCopilotUsage on ${endpoint}: ${err.message}`,
          );
          return;
        }
        // 404/403 → try next endpoint
      }
    }

    if (!response) {
      this.logger.warn(
        `⚠️ Semua endpoint Copilot usage/metrics tidak dapat diakses (404/403). ` +
          `Pastikan: (1) Org/Enterprise memiliki Copilot Business atau Enterprise, ` +
          `(2) Token memiliki scope 'manage_billing:copilot' atau 'copilot', ` +
          `(3) GITHUB_ORG=${orgName} dan GITHUB_ENTERPRISE_SLUG=${this.enterprise} sudah benar.`,
      );
      return;
    }

    // Parse response — /copilot/usage format uses total_suggestions_count,
    // while /copilot/metrics uses copilot_ide_code_completions wrapper
    const days: any[] = Array.isArray(response.data) ? response.data : [];
    this.logger.log(`Parsing ${days.length} days from ${usedEndpoint}...`);

    let totalSuggestions = 0;
    let totalAccepted = 0;
    let totalLinesSuggested = 0;
    let totalLinesAccepted = 0;

    for (const day of days) {
      if (usedEndpoint.includes('/copilot/usage')) {
        // Old usage API format
        totalSuggestions += day.total_suggestions_count ?? 0;
        totalAccepted += day.total_acceptances_count ?? 0;
        totalLinesSuggested += day.total_lines_suggested ?? 0;
        totalLinesAccepted += day.total_lines_accepted ?? 0;
      } else {
        // New metrics API format — nested under copilot_ide_code_completions
        const completions = day.copilot_ide_code_completions ?? {};
        totalSuggestions += completions.total_suggestions ?? 0;
        totalAccepted += completions.total_acceptances ?? 0;
      }
    }

    const acceptanceRate =
      totalSuggestions > 0
        ? parseFloat(((totalAccepted / totalSuggestions) * 100).toFixed(2))
        : 0;

    const totalActiveUsers = days.reduce(
      (max, d) => Math.max(max, d.total_active_users ?? 0),
      0,
    );

    this.logger.log(
      `📊 Aggregated from ${usedEndpoint}: suggestions=${totalSuggestions}, accepted=${totalAccepted}, ` +
        `rate=${acceptanceRate}%, peakActiveUsers=${totalActiveUsers}`,
    );

    await this.prisma.copilotSeatUsage.upsert({
      where: { organizationId_month: { organizationId: orgId, month } },
      update: {
        totalSuggestions,
        totalAccepted,
        acceptanceRate,
        totalActiveUsers,
        syncedAt: new Date(),
      },
      create: {
        organization: { connect: { id: orgId } },
        month,
        totalSuggestions,
        totalAccepted,
        acceptanceRate,
        totalActiveUsers,
        syncedAt: new Date(),
      },
    });

    this.logger.log(
      `✅ Saved: suggestions=${totalSuggestions}, accepted=${totalAccepted}, rate=${acceptanceRate}%, activeUsers=${totalActiveUsers}`,
    );
  }

  /**
   * Enrich GitHub Members with detailed profile data from /users/{username}
   * Fetches real name, email, account type, and creation date
   */

  async enrichGitHubMembers(): Promise<void> {
    this.logger.log('🔄 Enriching GitHub member details...');
    const orgId = await this.ensureOrganization();

    try {
      // Find members that might be missing details
      const membersToEnrich = await this.prisma.gitHubMember.findMany({
        where: {
          organizationId: orgId,
          OR: [{ email: null }, { githubCreatedAt: null }, { name: null }],
        },
        take: 50, // Limit batch size to respect rate limits
      });

      if (membersToEnrich.length === 0) {
        this.logger.log('✅ No members need enrichment.');
        return;
      }

      this.logger.log(
        `Fetching details for ${membersToEnrich.length} users...`,
      );
      for (const member of membersToEnrich) {
        try {
          const response = await this.api.get(`/users/${member.githubLogin}`);
          const data = response.data;

          await this.prisma.gitHubMember.update({
            where: { id: member.id },
            data: {
              name: data.name || member.name, // Only overwrite if API returns actual name
              email: data.email || member.email,
              accountType: data.type || 'User',
              githubCreatedAt: data.created_at
                ? new Date(data.created_at)
                : null,
              updatedAt: new Date(),
            },
          });

          // Small delay to prevent API secondary rate limits
          await new Promise((r) => setTimeout(r, 200));
        } catch (err: any) {
          this.logger.warn(
            `Failed to enrich user ${member.githubLogin}: ${err.message}`,
          );
        }
      }

      this.logger.log(`✅ Enriched ${membersToEnrich.length} member profiles.`);
    } catch (error: any) {
      this.logger.error(`Error in enrichGitHubMembers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync from /enterprises/{slug}/settings/billing/usage
   * Detailed billing usage per date, product, SKU, org, repo
   */
  async syncBillingUsage(): Promise<void> {
    this.logger.log('🔄 Syncing billing usage...');
    const orgId = await this.ensureOrganization();
    const now = new Date();

    try {
      const response = await this.api.get(
        `/enterprises/${this.enterprise}/settings/billing/usage`,
        {
          params: {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          },
        },
      );

      const usageItems: any[] = response.data?.usageItems || [];
      this.logger.log(`📊 Received ${usageItems.length} billing usage items`);

      for (const item of usageItems) {
        const date =
          item.date ||
          `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

        await this.prisma.gitHubBillingUsage.upsert({
          where: {
            organizationId_date_product_sku: {
              organizationId: orgId,
              date,
              product: item.product || 'Unknown',
              sku: item.sku || 'Unknown',
            },
          },
          update: {
            quantity: item.quantity ?? 0,
            unitType: item.unitType || null,
            pricePerUnit: item.pricePerUnit ?? 0,
            grossAmount: item.grossAmount ?? 0,
            discountAmount: item.discountAmount ?? 0,
            netAmount: item.netAmount ?? 0,
            organizationName: item.organizationName || null,
            repositoryName: item.repositoryName || null,
            syncedAt: new Date(),
          },
          create: {
            organization: { connect: { id: orgId } },
            date,
            product: item.product || 'Unknown',
            sku: item.sku || 'Unknown',
            quantity: item.quantity ?? 0,
            unitType: item.unitType || null,
            pricePerUnit: item.pricePerUnit ?? 0,
            grossAmount: item.grossAmount ?? 0,
            discountAmount: item.discountAmount ?? 0,
            netAmount: item.netAmount ?? 0,
            organizationName: item.organizationName || null,
            repositoryName: item.repositoryName || null,
            syncedAt: new Date(),
          },
        });
      }

      this.logger.log(`✅ Synced ${usageItems.length} billing usage items`);
    } catch (error: any) {
      const status = error.response?.status;
      const msg = error.response?.data?.message || error.message;
      this.logger.warn(
        `⚠️ billing/usage returned ${status}: ${msg}. Token mungkin butuh akses enterprise billing manager.`,
      );
    }
  }

  /**
   * Sync from /enterprises/{slug}/settings/billing/usage/summary
   * Aggregated billing summary per product/SKU
   */
  async syncBillingUsageSummary(): Promise<void> {
    this.logger.log('🔄 Syncing billing usage summary...');
    const orgId = await this.ensureOrganization();
    const month = this.getCurrentMonth();

    try {
      const now = new Date();
      const response = await this.api.get(
        `/enterprises/${this.enterprise}/settings/billing/usage/summary`,
        {
          params: {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          },
        },
      );

      const usageItems: any[] = response.data?.usageItems || [];
      this.logger.log(`📊 Received ${usageItems.length} billing summary items`);

      for (const item of usageItems) {
        await this.prisma.gitHubBillingUsageSummary.upsert({
          where: {
            organizationId_month_product_sku: {
              organizationId: orgId,
              month,
              product: item.product || 'Unknown',
              sku: item.sku || 'Unknown',
            },
          },
          update: {
            unitType: item.unitType || null,
            pricePerUnit: item.pricePerUnit ?? 0,
            grossQuantity: item.grossQuantity ?? 0,
            grossAmount: item.grossAmount ?? 0,
            discountQuantity: item.discountQuantity ?? 0,
            discountAmount: item.discountAmount ?? 0,
            netQuantity: item.netQuantity ?? 0,
            netAmount: item.netAmount ?? 0,
            syncedAt: new Date(),
          },
          create: {
            organization: { connect: { id: orgId } },
            month,
            product: item.product || 'Unknown',
            sku: item.sku || 'Unknown',
            unitType: item.unitType || null,
            pricePerUnit: item.pricePerUnit ?? 0,
            grossQuantity: item.grossQuantity ?? 0,
            grossAmount: item.grossAmount ?? 0,
            discountQuantity: item.discountQuantity ?? 0,
            discountAmount: item.discountAmount ?? 0,
            netQuantity: item.netQuantity ?? 0,
            netAmount: item.netAmount ?? 0,
            syncedAt: new Date(),
          },
        });
      }

      this.logger.log(`✅ Synced ${usageItems.length} billing summary items`);
    } catch (error: any) {
      const status = error.response?.status;
      const msg = error.response?.data?.message || error.message;
      this.logger.warn(
        `⚠️ billing/usage/summary returned ${status}: ${msg}. Token mungkin butuh akses enterprise billing manager.`,
      );
    }
  }

  async syncAll(): Promise<void> {
    const startTime = Date.now();

    // We run them serially for simplicity and to avoid rate limiting
    await this.syncConsumedLicenses();
    await this.syncCopilotSeats();
    await this.syncAuditLogs();
    await this.syncCopilotUsage();
    await this.enrichGitHubMembers();
    await this.syncBillingUsage();
    await this.syncBillingUsageSummary();

    this.logger.log(`🚀 Full sync completed in ${Date.now() - startTime}ms`);
  }

  // ---------------------------------------------------------
  // 📋 GETTER METHODS (Serving from DB cache)
  // ---------------------------------------------------------

  /**
   * Answer: License kepake atau tidak?
   */
  async getLicenseStatus(): Promise<LicenseStatusResult> {
    const orgId = await this.ensureOrganization();
    const month = this.getCurrentMonth();

    const usage = await this.prisma.copilotSeatUsage.findUnique({
      where: { organizationId_month: { organizationId: orgId, month } },
    });

    if (!usage) {
      throw new Error(`Data for ${month} not synced. Run sync first.`);
    }

    const members = await this.prisma.gitHubMember.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    return {
      totalSeatsPurchased: usage.totalSeatsPurchased,
      totalSeatsConsumed: usage.totalSeatsConsumed,
      usagePercentage: usage.usagePercentage,
      status:
        usage.usagePercentage > 100
          ? 'OVER_LIMIT'
          : usage.usagePercentage > 85
            ? 'NEAR_FULL'
            : usage.usagePercentage < 40
              ? 'COMFORTABLE'
              : 'NORMAL',
      users: members,
    };
  }

  /**
   * List all seats
   */
  async getCopilotSeats(): Promise<CopilotSeatsResult> {
    const orgId = await this.ensureOrganization();
    const seats = await this.prisma.copilotSeatDetail.findMany({
      where: { organizationId: orgId },
      orderBy: { lastActivityAt: 'desc' },
    });

    return {
      totalSeats: seats.length,
      seats,
    };
  }

  /**
   * Aggregate Copilot Metrics (Suggestions, Accepted, AcceptanceRate)
   * Sourced from /copilot/metrics GitHub API at org/enterprise level
   */
  async getOrgCopilotMetrics(): Promise<{
    totalSuggestions: number;
    totalAccepted: number;
    acceptanceRate: number;
    totalActiveUsers: number;
    month: string;
    dataAvailable: boolean;
  }> {
    const orgId = await this.ensureOrganization();
    const month = this.getCurrentMonth();

    const usage = await this.prisma.copilotSeatUsage.findUnique({
      where: { organizationId_month: { organizationId: orgId, month } },
    });

    if (!usage || usage.totalSuggestions === 0) {
      return {
        totalSuggestions: 0,
        totalAccepted: 0,
        acceptanceRate: 0,
        totalActiveUsers: 0,
        month,
        dataAvailable: false,
      };
    }

    return {
      totalSuggestions: usage.totalSuggestions,
      totalAccepted: usage.totalAccepted,
      acceptanceRate: usage.acceptanceRate,
      totalActiveUsers: usage.totalActiveUsers,
      month,
      dataAvailable: true,
    };
  }

  /**
   * Analysis: Productivity vs Wasted
   */
  async getProductivity(): Promise<ProductivityResult> {
    const orgId = await this.ensureOrganization();
    const seats = await this.prisma.copilotSeatDetail.findMany({
      where: { organizationId: orgId },
    });

    const now = new Date();
    const activityThresholdDays = 14;

    const summary = {
      productive: 0,
      moderate: 0,
      wasteful: 0,
    };

    seats.forEach((seat) => {
      if (!seat.lastActivityAt) {
        summary.wasteful++;
        return;
      }

      const diffDays =
        (now.getTime() - seat.lastActivityAt.getTime()) / (1000 * 3600 * 24);
      if (diffDays <= 3) summary.productive++;
      else if (diffDays <= activityThresholdDays) summary.moderate++;
      else summary.wasteful++;
    });

    return {
      summary,
      editorBreakdown: [], // Requires copilot/usage data
    };
  }

  async getAuditLog(params: {
    page: number;
    per_page: number;
    phrase?: string;
  }) {
    const orgId = await this.ensureOrganization();
    return this.prisma.gitHubAuditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: params.per_page,
      skip: (params.page - 1) * params.per_page,
    });
  }

  /**
   * Tabel 1: Member & Aktivitas License
   * Combines GitHubMember + CopilotSeatDetail for a unified view
   */
  async getMemberActivity(): Promise<any[]> {
    const orgId = await this.ensureOrganization();

    // Get all members
    const members = await this.prisma.gitHubMember.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: 'desc' },
    });

    // Get all seat details (indexed by login for fast lookup)
    const seatDetails = await this.prisma.copilotSeatDetail.findMany({
      where: { organizationId: orgId },
    });
    const seatMap = new Map<string, any>();
    for (const seat of seatDetails) {
      seatMap.set(seat.githubLogin, seat);
    }

    const now = new Date();

    return members.map((member) => {
      const seat = seatMap.get(member.githubLogin);
      const lastActivityAt = seat?.lastActivityAt || member.lastActivityAt;

      // Calculate days since last activity
      let daysSinceActivity: number | null = null;
      let lastActiveLabel = 'Belum pernah';
      if (lastActivityAt) {
        daysSinceActivity = Math.floor(
          (now.getTime() - new Date(lastActivityAt).getTime()) /
            (1000 * 3600 * 24),
        );
        if (daysSinceActivity === 0) lastActiveLabel = 'Hari ini';
        else if (daysSinceActivity === 1) lastActiveLabel = 'Kemarin';
        else if (daysSinceActivity <= 30)
          lastActiveLabel = `${daysSinceActivity} hari lalu`;
        else if (daysSinceActivity <= 90)
          lastActiveLabel = `${Math.floor(daysSinceActivity / 7)} minggu lalu`;
        else lastActiveLabel = `${daysSinceActivity}+ hari lalu`;
      }

      // Determine status
      let status: string;
      let statusColor: string;
      if (daysSinceActivity === null) {
        status = 'Mubazir';
        statusColor = 'red';
      } else if (daysSinceActivity <= 3) {
        status = 'Produktif';
        statusColor = 'green';
      } else if (daysSinceActivity <= 30) {
        status = 'Low Usage';
        statusColor = 'yellow';
      } else {
        status = 'Mubazir';
        statusColor = 'red';
      }

      // Suggested action
      let aksi: string;
      if (status === 'Produktif') aksi = '-';
      else if (status === 'Low Usage') aksi = '⚠️ Review';
      else aksi = '❌ Revoke';

      return {
        email: member.email || `${member.githubLogin}@unknown`,
        githubLogin: member.githubLogin,
        name: member.name,
        lastActiveLabel,
        lastActivityAt,
        daysSinceActivity,
        copilotSeat: seat ? '✅ Aktif' : '❌ Tidak',
        copilotSeatActive: !!seat,
        status,
        statusColor,
        aksi,
        githubLicenseType: member.githubLicenseType,
        githubId: member.githubId,
      };
    });
  }

  /**
   * Tabel 2: Copilot Usage per User (Alternative)
   * Derived from billing/seats + member data
   */
  async getCopilotUsagePerUser(): Promise<any[]> {
    const orgId = await this.ensureOrganization();
    const currentMonth = this.getCurrentMonth(); // "2026-04"

    const [seats, members, userBillingRows] = await Promise.all([
      this.prisma.copilotSeatDetail.findMany({
        where: { organizationId: orgId },
        orderBy: { lastActivityAt: 'desc' },
      }),
      this.prisma.gitHubMember.findMany({
        where: { organizationId: orgId },
      }),
      // Ambil real per-user billing dari import CSV/image
      this.prisma.copilotUserBillingUsage.findMany({
        where: { organizationId: orgId, month: currentMonth },
      }),
    ]);

    const memberMap = new Map<string, any>();
    for (const m of members) {
      memberMap.set(m.githubLogin, m);
    }

    // Build map of real user billing keyed by githubLogin
    const userBillingMap = new Map<string, (typeof userBillingRows)[number]>();
    for (const ub of userBillingRows) {
      userBillingMap.set(ub.githubLogin, ub);
    }

    const now = new Date();

    const hasRealBillingData = userBillingRows.length > 0;

    // 1. Pre-calculate data for each seat
    const parsedSeats = seats.map((seat) => {
      const member = memberMap.get(seat.githubLogin);
      const email = member?.email || `${seat.githubLogin}@unknown`;
      const editorRaw = seat.lastActivityEditor || '';
      const editorParsed = this.parseEditor(editorRaw);

      let licenseDays = 0;
      if (seat.seatCreatedAt) {
        licenseDays = Math.floor(
          (now.getTime() - new Date(seat.seatCreatedAt).getTime()) /
            (1000 * 3600 * 24),
        );
      }

      let daysSinceActivity: number | null = null;
      if (seat.lastActivityAt) {
        daysSinceActivity = Math.floor(
          (now.getTime() - new Date(seat.lastActivityAt).getTime()) /
            (1000 * 3600 * 24),
        );
      }

      let estimatedActiveDays = 0;
      if (daysSinceActivity !== null && licenseDays > 0) {
        // Approximate active days scaling
        if (daysSinceActivity <= 1)
          estimatedActiveDays = Math.min(
            licenseDays,
            Math.round(licenseDays * 0.85),
          );
        else if (daysSinceActivity <= 7)
          estimatedActiveDays = Math.min(
            licenseDays,
            Math.round(licenseDays * 0.6),
          );
        else if (daysSinceActivity <= 30)
          estimatedActiveDays = Math.min(
            licenseDays,
            Math.round(licenseDays * 0.3),
          );
        else
          estimatedActiveDays = Math.min(
            licenseDays,
            Math.round(licenseDays * 0.05),
          );
      }

      return {
        seat,
        member,
        email,
        editorRaw,
        editorParsed,
        licenseDays,
        daysSinceActivity,
        estimatedActiveDays,
      };
    });

    // 2. Construct final array — use REAL per-user billing from imported data
    const result: any[] = parsedSeats.map((ps) => {
      // 2a. Get real billing data first (needed for productivity calc)
      const realBilling = userBillingMap.get(ps.seat.githubLogin);

      let produktivitas: string;
      let produktivitasColor: string;

      if (realBilling) {
        // Use REAL billing data — usage ratio = includedRequests / max
        const maxReq = realBilling.includedRequestsMax || 1000;
        const usageRatio = realBilling.includedRequests / maxReq;
        if (usageRatio >= 0.4) {
          produktivitas = 'Tinggi';
          produktivitasColor = 'green';
        } else if (usageRatio >= 0.1) {
          produktivitas = 'Sedang';
          produktivitasColor = 'yellow';
        } else {
          produktivitas = 'Rendah';
          produktivitasColor = 'red';
        }
      } else {
        // No billing data — can't determine real productivity
        produktivitas = 'Belum Ada Data';
        produktivitasColor = 'gray';
      }

      const usageEfficiency = realBilling
        ? Math.round(
            (realBilling.includedRequests /
              (realBilling.includedRequestsMax || 1000)) *
              100,
          )
        : 0;

      let lastLoginLabel = 'Belum pernah';
      if (ps.seat.lastAuthenticatedAt) {
        const loginDays = Math.floor(
          (now.getTime() - new Date(ps.seat.lastAuthenticatedAt).getTime()) /
            (1000 * 3600 * 24),
        );
        if (loginDays === 0) lastLoginLabel = 'Hari ini';
        else if (loginDays === 1) lastLoginLabel = 'Kemarin';
        else lastLoginLabel = `${loginDays} hari lalu`;
      }
      const usageBreakdown = {
        includedRequests: realBilling?.includedRequests ?? 0,
        includedRequestsMax: realBilling?.includedRequestsMax ?? 1000,
        billedRequests: realBilling?.billedRequests ?? 0,
        grossAmount: realBilling?.grossAmount ?? 0,
        billedAmount: realBilling?.billedAmount ?? 0,
        hasRealData: !!realBilling,
        models: [] as any[],
      };

      return {
        email: ps.email,
        name: ps.member?.name || ps.seat.name,
        githubLogin: ps.seat.githubLogin,
        editor: ps.editorParsed.name,
        editorVersion: ps.editorParsed.version,
        copilotExtension: ps.editorParsed.copilotExt,
        editorRaw: ps.editorRaw,
        lastLoginLabel,
        lastAuthenticatedAt: ps.seat.lastAuthenticatedAt,
        lastActivityAt: ps.seat.lastActivityAt,
        daysSinceActivity: ps.daysSinceActivity,
        licenseDays: ps.licenseDays,
        estimatedActiveDays: ps.estimatedActiveDays,
        usageEfficiency,
        planType: ps.seat.licenseType || 'enterprise',
        produktivitas,
        produktivitasColor,
        hasRealBillingData: hasRealBillingData && !!realBilling,
        billing: {
          month: currentMonth,
          includedRequests: realBilling?.includedRequests ?? 0,
          includedRequestsMax: realBilling?.includedRequestsMax ?? 1000,
          billedRequests: realBilling?.billedRequests ?? 0,
          grossAmount: realBilling?.grossAmount ?? 0,
          billedAmount: realBilling?.billedAmount ?? 0,
          importedAt: realBilling?.importedAt ?? null,
        },
        usageBreakdown,
      };
    });

    // 4. Sort by grossAmount descending (users with real data first)
    result.sort(
      (a, b) =>
        (b.usageBreakdown?.grossAmount ?? 0) -
        (a.usageBreakdown?.grossAmount ?? 0),
    );

    return result;
  }

  /**
   * Parse editor string like "vscode/1.114.0/copilot-chat/0.42.3"
   */
  private parseEditor(raw: string): {
    name: string;
    version: string;
    copilotExt: string | null;
  } {
    if (!raw) return { name: '-', version: '-', copilotExt: null };

    const parts = raw.split('/');
    let name = parts[0] || '-';
    let version = parts[1] || '-';
    let copilotExt: string | null = null;

    // Friendly editor names
    const editorNames: Record<string, string> = {
      vscode: 'VS Code',
      visualstudio: 'Visual Studio',
      jetbrains: 'JetBrains',
      neovim: 'Neovim',
      vim: 'Vim',
      xcode: 'Xcode',
    };
    name = editorNames[name.toLowerCase()] || name;

    // Extract copilot extension info
    if (parts.length >= 4 && parts[2]?.includes('copilot')) {
      copilotExt = `${parts[2]} v${parts[3]}`;
    }

    return { name, version, copilotExt };
  }

  /**
   * Tabel 3: Rekomendasi Aksi
   * Identifies wasteful seats and suggests actions with potential savings
   */
  async getActionRecommendations(): Promise<ActionRecommendationsResponse> {
    const orgId = await this.ensureOrganization();

    const seats = await this.prisma.copilotSeatDetail.findMany({
      where: { organizationId: orgId },
    });

    const members = await this.prisma.gitHubMember.findMany({
      where: { organizationId: orgId },
    });

    // Build lookup maps
    const memberMapByLogin = new Map<string, any>();
    const memberMapById = new Map<number, any>();
    for (const m of members) {
      memberMapByLogin.set(m.githubLogin, m);
      memberMapById.set(m.githubId, m);
    }

    const COST_PER_SEAT = 19;
    const now = new Date();
    const recommendations: RecommendationItem[] = [];
    const seatedLogins = new Set<string>(seats.map((s) => s.githubLogin));

    // Load real billing data for smarter recommendations
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const billingRecords = await this.prisma.copilotUserBillingUsage.findMany({
      where: { organizationId: orgId, month: currentMonth },
    });
    const billingMap = new Map<string, (typeof billingRecords)[0]>();
    for (const b of billingRecords) {
      billingMap.set(b.githubLogin, b);
    }

    for (const seat of seats) {
      const member =
        memberMapByLogin.get(seat.githubLogin) ||
        memberMapById.get(seat.githubId);

      const email = member?.email || `${seat.githubLogin}@unknown`;
      const name = member?.name || seat.name || seat.githubLogin;

      // --- Compute activity metrics ---
      const realBilling = billingMap.get(seat.githubLogin);
      const daysSinceActivity = seat.lastActivityAt
        ? Math.floor(
            (now.getTime() - new Date(seat.lastActivityAt).getTime()) /
              86_400_000,
          )
        : null;

      const daysSinceLogin = seat.lastAuthenticatedAt
        ? Math.floor(
            (now.getTime() - new Date(seat.lastAuthenticatedAt).getTime()) /
              86_400_000,
          )
        : null;

      const daysSinceSeatCreated = seat.seatCreatedAt
        ? Math.floor(
            (now.getTime() - new Date(seat.seatCreatedAt).getTime()) /
              86_400_000,
          )
        : null;

      const editorRaw = seat.lastActivityEditor || '';
      const parsed = this.parseEditor(editorRaw);

      const baseUser = {
        email,
        name,
        githubLogin: seat.githubLogin,
      };

      const baseActivity = {
        lastActivityAt: seat.lastActivityAt?.toISOString() ?? null,
        lastActivityEditor: editorRaw || null,
        editorParsed:
          parsed.name !== '-' ? `${parsed.name} ${parsed.version}` : null,
        copilotExtension: parsed.copilotExt,
        lastAuthenticatedAt: seat.lastAuthenticatedAt?.toISOString() ?? null,
        seatCreatedAt: seat.seatCreatedAt?.toISOString() ?? null,
        daysSinceActivity,
        daysSinceLogin,
        daysSinceSeatCreated,
      };

      // --- Rule 1: Belum pernah aktif sama sekali ---
      // If user has real billing data with usage, they ARE active despite no activity timestamp
      const billingUsageRatio = realBilling
        ? realBilling.includedRequests /
          (realBilling.includedRequestsMax || 1000)
        : 0;
      const hasRealUsage = realBilling && billingUsageRatio >= 0.1;

      if (daysSinceActivity === null && !hasRealUsage) {
        recommendations.push({
          user: baseUser,
          activity: baseActivity,
          issue: {
            code: 'NEVER_ACTIVE',
            label: 'Revoke',
            badgeColor: 'red',
            description:
              'User memiliki seat Copilot tapi belum pernah menggunakannya sama sekali.',
          },
          recommendation: {
            type: 'revoke',
            label: 'Revoke seat',
            description:
              'Cabut seat agar tidak mubazir. Seat bisa dialokasikan ke user lain yang lebih produktif.',
          },
          severity: 'high',
          potentialSavingsUsd: COST_PER_SEAT,
          potentialSavingsLabel: `$${COST_PER_SEAT}/bulan`,
        });
        continue;
      }

      // --- Rule 2: Tidak aktif ≥90 hari (skip if real billing shows usage) ---
      if (
        daysSinceActivity !== null &&
        daysSinceActivity >= 90 &&
        !hasRealUsage
      ) {
        const lastDate = new Date(seat.lastActivityAt!).toLocaleDateString(
          'id-ID',
        );
        recommendations.push({
          user: baseUser,
          activity: baseActivity,
          issue: {
            code: 'INACTIVE_90_PLUS',
            label: 'Revoke',
            badgeColor: 'red',
            description: `Tidak aktif selama ${daysSinceActivity} hari. Terakhir aktif: ${lastDate}.`,
          },
          recommendation: {
            type: 'revoke',
            label: 'Revoke seat',
            description:
              'User sudah sangat lama tidak menggunakan Copilot. Cabut seat untuk menghemat biaya.',
          },
          severity: 'high',
          potentialSavingsUsd: COST_PER_SEAT,
          potentialSavingsLabel: `$${COST_PER_SEAT}/bulan`,
        });
        continue;
      }

      // --- Rule 3: Tidak aktif 30–89 hari (skip if real billing shows usage) ---
      if (
        daysSinceActivity !== null &&
        daysSinceActivity >= 30 &&
        !hasRealUsage
      ) {
        const lastDate = new Date(seat.lastActivityAt!).toLocaleDateString(
          'id-ID',
        );
        recommendations.push({
          user: baseUser,
          activity: baseActivity,
          issue: {
            code: 'INACTIVE_30_89',
            label: 'Review',
            badgeColor: 'yellow',
            description: `Tidak aktif selama ${daysSinceActivity} hari. Terakhir aktif: ${lastDate}.`,
          },
          recommendation: {
            type: 'review',
            label: 'Review & follow up',
            description:
              'Hubungi user untuk mengetahui alasan tidak aktif. Jika tidak ada rencana penggunaan, pertimbangkan revoke.',
          },
          severity: 'medium',
          potentialSavingsUsd: COST_PER_SEAT,
          potentialSavingsLabel: `$${COST_PER_SEAT}/bulan`,
        });
        continue;
      }

      // --- Rule 3.5: Low billing usage (<10% of quota) ---
      if (realBilling && billingUsageRatio < 0.1) {
        const usagePct = Math.round(billingUsageRatio * 100);
        recommendations.push({
          user: baseUser,
          activity: baseActivity,
          issue: {
            code: 'LOW_BILLING_USAGE',
            label: 'Rendah',
            badgeColor: 'yellow',
            description: `Penggunaan Copilot sangat rendah — hanya ${usagePct}% dari kuota (${realBilling.includedRequests.toFixed(0)}/${realBilling.includedRequestsMax} requests). Biaya $${realBilling.grossAmount.toFixed(2)}/bulan tidak optimal.`,
          },
          recommendation: {
            type: 'low_productivity',
            label: 'Monitoring & coaching',
            description:
              'Pantau aktivitas user dan berikan pelatihan agar penggunaan Copilot lebih optimal. Jika tetap rendah, pertimbangkan revoke.',
          },
          severity: 'medium',
          potentialSavingsUsd: 0,
          potentialSavingsLabel: '-',
        });
        continue;
      }

      // --- Rule 3.6: No billing data — flag for import ---
      if (!realBilling) {
        recommendations.push({
          user: baseUser,
          activity: baseActivity,
          issue: {
            code: 'NO_BILLING_DATA',
            label: 'No Data',
            badgeColor: 'gray',
            description: `User aktif (${daysSinceActivity !== null ? daysSinceActivity + ' hari lalu' : 'unknown'}) tapi belum ada data billing. Import CSV/Image untuk mengetahui penggunaan sebenarnya.`,
          },
          recommendation: {
            type: 'low_productivity',
            label: 'Import billing data',
            description:
              'Import data billing dari CSV/Image GitHub untuk mengetahui penggunaan request Copilot user ini.',
          },
          severity: 'low',
          potentialSavingsUsd: 0,
          potentialSavingsLabel: '-',
        });
        continue;
      }

      // --- Rule 3.7: Low activity 15–29 hari (fallback, no billing data) ---
      if (
        !realBilling &&
        daysSinceActivity !== null &&
        daysSinceActivity >= 15
      ) {
        const lastDate = new Date(seat.lastActivityAt!).toLocaleDateString(
          'id-ID',
        );
        recommendations.push({
          user: baseUser,
          activity: baseActivity,
          issue: {
            code: 'LOW_USAGE_15_29',
            label: 'Rendah',
            badgeColor: 'yellow',
            description: `Produktivitas rendah — tidak aktif ${daysSinceActivity} hari. Terakhir aktif: ${lastDate}. Penggunaan Copilot tidak konsisten.`,
          },
          recommendation: {
            type: 'low_productivity',
            label: 'Monitoring & coaching',
            description:
              'Pantau aktivitas user dan berikan pelatihan agar penggunaan Copilot lebih optimal.',
          },
          severity: 'medium',
          potentialSavingsUsd: 0,
          potentialSavingsLabel: '-',
        });
        continue;
      }
    }

    // --- Rule 5: Punya license tapi tidak ada seat record ---
    for (const member of members) {
      if (member.hasCopilotLicense && !seatedLogins.has(member.githubLogin)) {
        recommendations.push({
          user: {
            email: member.email || `${member.githubLogin}@unknown`,
            name: member.name || member.githubLogin,
            githubLogin: member.githubLogin,
          },
          activity: {
            lastActivityAt: null,
            lastActivityEditor: null,
            editorParsed: null,
            copilotExtension: null,
            lastAuthenticatedAt: null,
            seatCreatedAt: null,
            daysSinceActivity: null,
            daysSinceLogin: null,
            daysSinceSeatCreated: null,
          },
          issue: {
            code: 'SEAT_MISMATCH',
            label: 'Sync',
            badgeColor: 'yellow',
            description:
              'User tercatat memiliki lisensi Copilot di consumed-licenses namun tidak memiliki data seat.',
          },
          recommendation: {
            type: 'sync',
            label: 'Sync ulang data',
            description:
              'Jalankan sync ulang agar data seat dan license konsisten.',
          },
          severity: 'medium',
          potentialSavingsUsd: 0,
          potentialSavingsLabel: '-',
        });
      }
    }

    // Sort: high → medium → low
    const severityOrder: Record<string, number> = {
      high: 0,
      medium: 1,
      low: 2,
    };
    recommendations.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
    );

    // --- Build summary ---
    const revoke = recommendations.filter(
      (r) => r.recommendation.type === 'revoke',
    );
    const review = recommendations.filter(
      (r) => r.recommendation.type === 'review',
    );
    const lowProd = recommendations.filter(
      (r) => r.recommendation.type === 'low_productivity',
    );
    const sync = recommendations.filter(
      (r) => r.recommendation.type === 'sync',
    );

    const totalPotentialSavingsUsd = recommendations.reduce(
      (sum, r) => sum + r.potentialSavingsUsd,
      0,
    );

    const summary: RecommendationSummary = {
      totalSeats: seats.length,
      totalFlagged: recommendations.length,
      healthySeats: seats.length - recommendations.length,
      wastagePercent:
        seats.length > 0
          ? parseFloat(
              ((recommendations.length / seats.length) * 100).toFixed(1),
            )
          : 0,

      bySeverity: {
        high: recommendations.filter((r) => r.severity === 'high').length,
        medium: recommendations.filter((r) => r.severity === 'medium').length,
        low: recommendations.filter((r) => r.severity === 'low').length,
      },

      byType: {
        revoke: {
          count: revoke.length,
          savingsUsd: revoke.reduce((s, r) => s + r.potentialSavingsUsd, 0),
        },
        review: {
          count: review.length,
          savingsUsd: review.reduce((s, r) => s + r.potentialSavingsUsd, 0),
        },
        low_productivity: { count: lowProd.length },
        sync: { count: sync.length },
      },

      totalPotentialSavingsUsd,
      totalPotentialSavingsLabel: `$${totalPotentialSavingsUsd}/bulan`,
    };

    return {
      recommendations,
      summary,
      generatedAt: now.toISOString(),
    };
  }

  /**
   * Get billing usage detail (from DB cache)
   */
  async getBillingUsage(params?: { month?: string; product?: string }) {
    const orgId = await this.ensureOrganization();
    const now = new Date();
    const targetMonth = params?.month || this.getCurrentMonth();
    const datePrefix = targetMonth; // e.g. "2026-04"

    const where: any = {
      organizationId: orgId,
      date: { startsWith: datePrefix },
    };
    if (params?.product) {
      where.product = params.product;
    }

    const items = await this.prisma.gitHubBillingUsage.findMany({
      where,
      orderBy: [{ date: 'desc' }, { grossAmount: 'desc' }],
    });

    const totalGross = items.reduce((s: number, i) => s + i.grossAmount, 0);
    const totalNet = items.reduce((s: number, i) => s + i.netAmount, 0);
    const totalDiscount = items.reduce(
      (s: number, i) => s + i.discountAmount,
      0,
    );

    // Group by product
    const byProduct: Record<
      string,
      { items: number; grossAmount: number; netAmount: number }
    > = {};
    for (const item of items) {
      if (!byProduct[item.product]) {
        byProduct[item.product] = { items: 0, grossAmount: 0, netAmount: 0 };
      }
      byProduct[item.product].items++;
      byProduct[item.product].grossAmount += item.grossAmount;
      byProduct[item.product].netAmount += item.netAmount;
    }

    return {
      month: targetMonth,
      totalItems: items.length,
      totalGrossAmount: parseFloat(totalGross.toFixed(2)),
      totalNetAmount: parseFloat(totalNet.toFixed(2)),
      totalDiscountAmount: parseFloat(totalDiscount.toFixed(2)),
      byProduct,
      items,
    };
  }

  /**
   * Get billing usage summary (from DB cache)
   */
  async getBillingUsageSummary(params?: { month?: string }) {
    const orgId = await this.ensureOrganization();
    const targetMonth = params?.month || this.getCurrentMonth();

    const items = await this.prisma.gitHubBillingUsageSummary.findMany({
      where: {
        organizationId: orgId,
        month: targetMonth,
      },
      orderBy: { grossAmount: 'desc' },
    });

    const totalGross = items.reduce((s: number, i) => s + i.grossAmount, 0);
    const totalNet = items.reduce((s: number, i) => s + i.netAmount, 0);
    const totalDiscount = items.reduce(
      (s: number, i) => s + i.discountAmount,
      0,
    );

    return {
      month: targetMonth,
      totalProducts: items.length,
      totalGrossAmount: parseFloat(totalGross.toFixed(2)),
      totalNetAmount: parseFloat(totalNet.toFixed(2)),
      totalDiscountAmount: parseFloat(totalDiscount.toFixed(2)),
      items,
    };
  }

  // ---------------------------------------------------------
  // User Billing Usage (manual import via OCR)
  // ---------------------------------------------------------

  /**
   * Parse OCR text dari gambar billing GitHub Copilot per user.
   * Format kolom yang diharapkan:
   *   User | Included requests | Billed requests | Gross amount | Billed amount
   *
   * Baris header diabaikan secara otomatis.
   */
  private parseOcrBillingTable(ocrText: string): Array<{
    githubLogin: string;
    includedRequests: number;
    includedRequestsMax: number;
    billedRequests: number;
    grossAmount: number;
    billedAmount: number;
  }> {
    const results = [];

    // Normalise line endings dan pecah menjadi baris
    const lines = ocrText
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    // Regex: angka dengan format "123.45/1,000" atau bare "123"
    const includedReqPattern = /^([\d,]+(?:\.\d+)?)(?:\s*\/\s*[\d,]+)?$/;

    for (const line of lines) {
      // Skip header line
      if (/^user/i.test(line) || /included.*request/i.test(line)) continue;

      // Split by common delimiters (tab, multiple spaces, pipe, comma-between-fields)
      const cols = line
        .split(/\t|  +|\s*\|\s*/)
        .map((c) => c.trim())
        .filter(Boolean);

      if (cols.length < 3) continue;

      // Detect if first column is a row number (pure digits) — shift columns
      let offset = 0;
      if (/^\d+$/.test(cols[0].replace(/['"]/g, '')) && cols.length >= 4) {
        const maybeLogin = cols[1].replace(/['"]/g, '');
        if (/[a-zA-Z_]/.test(maybeLogin)) {
          offset = 1;
        }
      }

      // Kolom-0 = githubLogin
      const githubLogin = cols[offset].replace(/['"]/g, '');
      if (!githubLogin || githubLogin.length < 2) continue;
      if (/^\d+$/.test(githubLogin)) continue;

      // Kolom-1 = includedRequests e.g. "485.60/1,000" or just "485.60"
      const rawIncluded = cols[offset + 1].replace(/['"]/g, '');
      let includedRequests = 0;
      let includedRequestsMax = 1000;
      const slashParts = rawIncluded.split('/');
      includedRequests = parseFloat(slashParts[0].replace(/,/g, '')) || 0;
      if (slashParts[1]) {
        includedRequestsMax =
          parseInt(slashParts[1].replace(/,/g, ''), 10) || 1000;
      }

      // Kolom-2 = billedRequests
      const billedRequests =
        parseInt((cols[offset + 2] ?? '0').replace(/[,$'"]/g, ''), 10) || 0;

      // Kolom-3 = grossAmount ($19.42 atau 19.42)
      const grossAmount =
        parseFloat((cols[offset + 3] ?? '0').replace(/[$,'"]/g, '')) || 0;

      // Kolom-4 = billedAmount
      const billedAmount =
        parseFloat((cols[offset + 4] ?? '0').replace(/[$,'"]/g, '')) || 0;

      results.push({
        githubLogin,
        includedRequests,
        includedRequestsMax,
        billedRequests,
        grossAmount,
        billedAmount,
      });
    }

    return results;
  }

  /**
   * Parse CSV text (with proper quoted-field handling) into billing rows.
   */
  private parseCsvBillingData(csvText: string): Array<{
    githubLogin: string;
    includedRequests: number;
    includedRequestsMax: number;
    billedRequests: number;
    grossAmount: number;
    billedAmount: number;
  }> {
    const results: Array<{
      githubLogin: string;
      includedRequests: number;
      includedRequestsMax: number;
      billedRequests: number;
      grossAmount: number;
      billedAmount: number;
    }> = [];

    const lines = csvText
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      // Skip header
      if (/^user/i.test(line) || /included.*request/i.test(line)) continue;

      // Parse CSV fields respecting quoted values
      const cols: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          cols.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      cols.push(current.trim());

      if (cols.length < 3) continue;

      // Detect if first column is a row number (pure digits) — shift columns
      let offset = 0;
      if (/^\d+$/.test(cols[0].trim()) && cols.length >= 4) {
        // Check if cols[1] looks like a username (contains letters or underscore)
        const maybeLogin = cols[1].replace(/['"]/g, '').trim();
        if (/[a-zA-Z_]/.test(maybeLogin)) {
          offset = 1;
        }
      }

      const githubLogin = cols[offset].replace(/['"]/g, '').trim();
      if (!githubLogin || githubLogin.length < 2) continue;
      // Skip if githubLogin is still purely numeric (not a valid login)
      if (/^\d+$/.test(githubLogin)) continue;

      // Parse "485.60/1,000" → includedRequests=485.60, includedRequestsMax=1000
      const rawIncluded = cols[offset + 1].replace(/['"]/g, '').trim();
      let includedRequests = 0;
      let includedRequestsMax = 1000;
      const slashParts = rawIncluded.split('/');
      includedRequests = parseFloat(slashParts[0].replace(/,/g, '')) || 0;
      if (slashParts[1]) {
        includedRequestsMax =
          parseInt(slashParts[1].replace(/,/g, ''), 10) || 1000;
      }

      const billedRequests =
        parseInt((cols[offset + 2] ?? '0').replace(/[$,'"]/g, ''), 10) || 0;
      const grossAmount =
        parseFloat((cols[offset + 3] ?? '0').replace(/[$,'"]/g, '')) || 0;
      const billedAmount =
        parseFloat((cols[offset + 4] ?? '0').replace(/[$,'"]/g, '')) || 0;

      results.push({
        githubLogin,
        includedRequests,
        includedRequestsMax,
        billedRequests,
        grossAmount,
        billedAmount,
      });
    }

    return results;
  }

  /**
   * Import user billing dari CSV text.
   * CSV format: User,Included requests,Billed requests,Gross amount,Billed amount
   */
  async importUserBillingFromCsv(params: {
    csvText: string;
    month?: string;
    importedBy?: string;
  }): Promise<{ imported: number; skipped: number; rows: any[] }> {
    const orgId = await this.ensureOrganization();
    const targetMonth = params.month || this.getCurrentMonth();

    const rows = this.parseCsvBillingData(params.csvText);
    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      try {
        await this.prisma.copilotUserBillingUsage.upsert({
          where: {
            organizationId_githubLogin_month: {
              organizationId: orgId,
              githubLogin: row.githubLogin,
              month: targetMonth,
            },
          },
          update: {
            includedRequests: row.includedRequests,
            includedRequestsMax: row.includedRequestsMax,
            billedRequests: row.billedRequests,
            grossAmount: row.grossAmount,
            billedAmount: row.billedAmount,
            importedAt: new Date(),
            importedBy: params.importedBy ?? null,
            updatedAt: new Date(),
          },
          create: {
            organizationId: orgId,
            githubLogin: row.githubLogin,
            month: targetMonth,
            includedRequests: row.includedRequests,
            includedRequestsMax: row.includedRequestsMax,
            billedRequests: row.billedRequests,
            grossAmount: row.grossAmount,
            billedAmount: row.billedAmount,
            importedBy: params.importedBy ?? null,
          },
        });
        imported++;
      } catch (e) {
        this.logger.warn(
          `Skip CSV row ${row.githubLogin}: ${(e as Error).message}`,
        );
        skipped++;
      }
    }

    this.logger.log(
      `User billing CSV import: ${imported} imported, ${skipped} skipped (month=${targetMonth})`,
    );
    return { imported, skipped, rows };
  }

  /**
   * Import user billing dari hasil OCR gambar.
   * Dipanggil setelah OCR dilakukan di controller (via Tesseract.js).
   */
  async importUserBillingFromOcr(params: {
    ocrText: string;
    month?: string;
    importedBy?: string;
  }): Promise<{ imported: number; skipped: number; rows: any[] }> {
    const orgId = await this.ensureOrganization();
    const targetMonth = params.month || this.getCurrentMonth();

    const rows = this.parseOcrBillingTable(params.ocrText);
    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      try {
        await this.prisma.copilotUserBillingUsage.upsert({
          where: {
            organizationId_githubLogin_month: {
              organizationId: orgId,
              githubLogin: row.githubLogin,
              month: targetMonth,
            },
          },
          update: {
            includedRequests: row.includedRequests,
            includedRequestsMax: row.includedRequestsMax,
            billedRequests: row.billedRequests,
            grossAmount: row.grossAmount,
            billedAmount: row.billedAmount,
            importedAt: new Date(),
            importedBy: params.importedBy ?? null,
            updatedAt: new Date(),
          },
          create: {
            organizationId: orgId,
            githubLogin: row.githubLogin,
            month: targetMonth,
            includedRequests: row.includedRequests,
            includedRequestsMax: row.includedRequestsMax,
            billedRequests: row.billedRequests,
            grossAmount: row.grossAmount,
            billedAmount: row.billedAmount,
            importedBy: params.importedBy ?? null,
          },
        });
        imported++;
      } catch (e) {
        this.logger.warn(
          `Skip row ${row.githubLogin}: ${(e as Error).message}`,
        );
        skipped++;
      }
    }

    this.logger.log(
      `User billing import: ${imported} imported, ${skipped} skipped (month=${targetMonth})`,
    );
    return { imported, skipped, rows };
  }

  /**
   * Get user billing usage dari DB (per bulan).
   */
  async getUserBillingUsage(params?: { month?: string }) {
    const orgId = await this.ensureOrganization();
    const targetMonth = params?.month || this.getCurrentMonth();

    const rows = await this.prisma.copilotUserBillingUsage.findMany({
      where: { organizationId: orgId, month: targetMonth },
      orderBy: { grossAmount: 'desc' },
    });

    const totalGross = rows.reduce((s, r) => s + r.grossAmount, 0);
    const totalBilled = rows.reduce((s, r) => s + r.billedAmount, 0);
    const totalIncluded = rows.reduce((s, r) => s + r.includedRequests, 0);

    return {
      month: targetMonth,
      totalUsers: rows.length,
      totalIncludedRequests: parseFloat(totalIncluded.toFixed(2)),
      totalGrossAmount: parseFloat(totalGross.toFixed(2)),
      totalBilledAmount: parseFloat(totalBilled.toFixed(2)),
      rows,
    };
  }

  // ---------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private hashCode(s: string): number {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      const chr = s.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
