import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Query,
  Request,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { createWorker } from 'tesseract.js';
import { DashboardService } from './dashboard.service';
import { HistoryService } from '../history/history.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { EnterpriseFocusService } from './enterprise-focus.service';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly historyService: HistoryService,
    private readonly enterpriseFocusService: EnterpriseFocusService,
  ) {}

  @Get('metrics/:view')
  getMetrics(@Param('view') view: string, @Request() req: any) {
    return this.dashboardService.getMetrics(view, req.user);
  }

  @Get('activities')
  getActivities() {
    return this.historyService.getRecentActivities();
  }

  /**
   * Enterprise Focus Endpoints - GitHub Copilot License Tracking
   */

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('enterprise-focus/license-status')
  async getEnterpriseLicenseStatus() {
    return this.enterpriseFocusService.getLicenseStatus();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('enterprise-focus/seats')
  async getEnterpriseCopilotSeats() {
    return this.enterpriseFocusService.getCopilotSeats();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('enterprise-focus/productivity')
  async getEnterpriseProductivity() {
    return this.enterpriseFocusService.getProductivity();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('enterprise-focus/audit-log')
  async getEnterpriseAuditLog(
    @Query('page') page?: number,
    @Query('per_page') per_page?: number,
    @Query('phrase') phrase?: string,
  ) {
    return this.enterpriseFocusService.getAuditLog({
      page: page || 1,
      per_page: per_page || 50,
      phrase,
    });
  }

  /**
   * Tabel 1: Member & Aktivitas License
   * Combined view of member activity and copilot seat status
   */
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('enterprise-focus/member-activity')
  async getMemberActivity() {
    return this.enterpriseFocusService.getMemberActivity();
  }

  /**
   * Tabel 2: Copilot Usage per User (Alternative)
   * Editor, login frequency, license tenure, productivity
   */
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('enterprise-focus/copilot-usage')
  async getCopilotUsagePerUser() {
    return this.enterpriseFocusService.getCopilotUsagePerUser();
  }

  /**
   * Tabel 3: Rekomendasi Aksi
   * Flagged users with wasteful seats and suggested actions
   */
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('enterprise-focus/recommendations')
  async getActionRecommendations() {
    return this.enterpriseFocusService.getActionRecommendations();
  }

  /**
   * Aggregate Org-Level Copilot Metrics (Suggestions, Accepted, AcceptanceRate)
   * Data comes from GitHub /copilot/metrics API — only available at org/enterprise level
   */
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('enterprise-focus/org-metrics')
  async getOrgCopilotMetrics() {
    return this.enterpriseFocusService.getOrgCopilotMetrics();
  }

  /**
   * 🔄 Sync Endpoints
   */

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('enterprise-focus/sync/all')
  async syncAllData() {
    await this.enterpriseFocusService.syncAll();
    return {
      success: true,
      message: '✅ Synchronization completed successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Billing Usage Detail (per date, product, SKU)
   * From /enterprises/{slug}/settings/billing/usage
   */
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('enterprise-focus/billing-usage')
  async getBillingUsage(
    @Query('month') month?: string,
    @Query('product') product?: string,
  ) {
    return this.enterpriseFocusService.getBillingUsage({ month, product });
  }

  /**
   * Billing Usage Summary (aggregated per product/SKU)
   * From /enterprises/{slug}/settings/billing/usage/summary
   */
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('enterprise-focus/billing-usage-summary')
  async getBillingUsageSummary(@Query('month') month?: string) {
    return this.enterpriseFocusService.getBillingUsageSummary({ month });
  }

  /**
   * Sync billing data only
   */
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('enterprise-focus/sync/billing')
  async syncBillingData() {
    await this.enterpriseFocusService.syncBillingUsage();
    await this.enterpriseFocusService.syncBillingUsageSummary();
    return {
      success: true,
      message: '✅ Billing data synced successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET  /dashboard/enterprise-focus/user-billing
   * Kembalikan per-user billing usage dari DB (manual import)
   */
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('enterprise-focus/user-billing')
  async getUserBillingUsage(@Query('month') month?: string) {
    return this.enterpriseFocusService.getUserBillingUsage({ month });
  }

  /**
   * POST /dashboard/enterprise-focus/user-billing/import-csv
   * Accept CSV text body → parse → save to DB
   * Body: { csvText: string, month?: string }
   */
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('enterprise-focus/user-billing/import-csv')
  async importUserBillingCsv(
    @Body('csvText') csvText: string,
    @Body('month') month?: string,
    @Request() req?: any,
  ) {
    if (!csvText || !csvText.trim()) {
      throw new BadRequestException(
        'No CSV text provided. Send { "csvText": "User,Included requests,..." }',
      );
    }

    const result = await this.enterpriseFocusService.importUserBillingFromCsv({
      csvText,
      month,
      importedBy: req?.user?.email ?? req?.user?.username,
    });

    return {
      success: true,
      month: month || new Date().toISOString().slice(0, 7),
      ...result,
    };
  }

  /**
   * POST /dashboard/enterprise-focus/user-billing/import-image
   * Upload gambar → OCR → parse tabel → simpan ke DB
   * Field multipart: "image" (file), "month" (string, opsional)
   */
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('enterprise-focus/user-billing/import-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async importUserBillingImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('month') month?: string,
    @Request() req?: any,
  ) {
    if (!file) {
      throw new BadRequestException(
        'No image file provided. Use field name "image".',
      );
    }

    // 1. OCR image dengan Tesseract.js
    const worker = await createWorker('eng');
    let ocrText: string;
    try {
      const { data } = await worker.recognize(file.buffer);
      ocrText = data.text;
    } finally {
      await worker.terminate();
    }

    // 2. Parse hasil OCR dan simpan ke DB
    const result = await this.enterpriseFocusService.importUserBillingFromOcr({
      ocrText,
      month,
      importedBy: req?.user?.email ?? req?.user?.username,
    });

    return {
      success: true,
      month: month || new Date().toISOString().slice(0, 7),
      ocrPreview: ocrText.slice(0, 500),
      ...result,
    };
  }
}
