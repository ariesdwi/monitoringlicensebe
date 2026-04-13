import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HistoryService } from '../history/history.service';
import { CreateAiImpactDto } from './dto/create-ai-impact.dto';

@Injectable()
export class AiImpactService {
  constructor(
    private prisma: PrismaService,
    private history: HistoryService,
  ) {}

  async findAll() {
    return this.prisma.aiImpact.findMany({
      include: { team: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSummary() {
    const all = await this.prisma.aiImpact.findMany({ include: { team: true } });

    if (all.length === 0) {
      return {
        totalReports: 0,
        avgProductivityGain: 0,
        totalManDaysSaved: 0,
        avgCoverage: 0,
        avgRating: '-',
        byTeam: [],
      };
    }

    // Calculate overall productivity gain
    let totalDaysWithAI = 0;
    let totalDaysWithoutAI = 0;
    let totalManDaysSaved = 0;
    let totalCoverage = 0;
    const ratingCounts: Record<string, number> = {};

    for (const r of all) {
      totalDaysWithAI += r.daysWithAI;
      totalDaysWithoutAI += r.daysWithoutAI;
      totalManDaysSaved += (r.daysWithoutAI - r.daysWithAI) * r.manCount;
      totalCoverage += r.sqCoverage;
      ratingCounts[r.sqRating] = (ratingCounts[r.sqRating] || 0) + 1;
    }

    const avgProductivityGain = totalDaysWithoutAI > 0
      ? Math.round(((totalDaysWithoutAI - totalDaysWithAI) / totalDaysWithoutAI) * 100)
      : 0;

    const avgCoverage = Math.round((totalCoverage / all.length) * 10) / 10;

    // Most common rating
    const avgRating = Object.entries(ratingCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    // Per-team breakdown
    const teamMap = new Map<number, { teamName: string; tlName: string; reports: number; savings: number; coverage: number }>();
    for (const r of all) {
      const existing = teamMap.get(r.teamId) || {
        teamName: r.team.name,
        tlName: r.tlName,
        reports: 0,
        savings: 0,
        coverage: 0,
      };
      existing.reports++;
      existing.savings += (r.daysWithoutAI - r.daysWithAI);
      existing.coverage += r.sqCoverage;
      teamMap.set(r.teamId, existing);
    }

    const byTeam = Array.from(teamMap.entries()).map(([teamId, data]) => ({
      teamId,
      teamName: data.teamName,
      tlName: data.tlName,
      reports: data.reports,
      avgSavingsDays: Math.round((data.savings / data.reports) * 10) / 10,
      avgCoverage: Math.round((data.coverage / data.reports) * 10) / 10,
    }));

    return {
      totalReports: all.length,
      avgProductivityGain,
      totalManDaysSaved: Math.round(totalManDaysSaved * 10) / 10,
      avgCoverage,
      avgRating,
      byTeam,
    };
  }

  async create(dto: CreateAiImpactDto, userObj: any) {
    if (userObj.role !== 'TL') {
      throw new BadRequestException('Only TL can submit AI Impact reports');
    }

    // Find TL's team
    const teams = await this.prisma.team.findMany();
    const userFirstName = userObj.name.split(' ')[0];
    const userTeam = teams.find(t => t.tlName.includes(userFirstName));

    if (!userTeam) {
      throw new BadRequestException('Team not found for TL');
    }

    const report = await this.prisma.aiImpact.create({
      data: {
        teamId: userTeam.id,
        tlName: userTeam.tlName,
        squad: dto.squad,
        aplikasi: dto.aplikasi,
        aiTool: dto.aiTool ?? 'Gemini',
        period: dto.period,
        manCount: dto.manCount,
        daysWithAI: dto.daysWithAI,
        daysWithoutAI: dto.daysWithoutAI,
        sqBugs: dto.sqBugs ?? 0,
        sqVulnerabilities: dto.sqVulnerabilities ?? 0,
        sqCodeSmells: dto.sqCodeSmells ?? 0,
        sqCoverage: dto.sqCoverage ?? 0,
        sqDuplications: dto.sqDuplications ?? 0,
        sqRating: dto.sqRating ?? 'A',
        notes: dto.notes,
      },
    });

    await this.history.logAction(
      userObj.name,
      userObj.role,
      'IMPACT',
      dto.squad,
      `AI Impact report submitted: ${dto.period} — ${dto.manCount} man, ${dto.daysWithAI}d with AI vs ${dto.daysWithoutAI}d without`,
    );

    return report;
  }

  async update(id: number, dto: Partial<CreateAiImpactDto>, userObj: any) {
    if (userObj.role !== 'TL' && userObj.role !== 'ADMIN') {
      throw new BadRequestException('Only TL or Admin can update reports');
    }

    const existing = await this.prisma.aiImpact.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Report not found');

    if (userObj.role === 'TL') {
      const userFirstName = userObj.name.split(' ')[0];
      if (!existing.tlName.includes(userFirstName) && existing.tlName !== userObj.name) {
        throw new BadRequestException('You can only update your own team report');
      }
    }

    return this.prisma.aiImpact.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: number, userObj: any) {
    if (userObj.role !== 'ADMIN' && userObj.role !== 'TL') {
      throw new BadRequestException('Only Admin or TL can delete reports');
    }

    const existing = await this.prisma.aiImpact.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Report not found');

    if (userObj.role === 'TL') {
      const userFirstName = userObj.name.split(' ')[0];
      if (!existing.tlName.includes(userFirstName) && existing.tlName !== userObj.name) {
        throw new BadRequestException('You can only delete your own team report');
      }
    }

    await this.prisma.aiImpact.delete({ where: { id } });
    await this.history.logAction(userObj.name, userObj.role, 'DELETE', existing.squad, `${userObj.role} menghapus AI Impact report`);
    return { success: true };
  }
}
