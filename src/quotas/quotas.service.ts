import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuotasService {
  constructor(private prisma: PrismaService) {}

  async getQuotas(userObj: any) {
    const where: any = {};
    if (userObj.role === 'TL') {
      if (userObj.teamId) {
        where.id = userObj.teamId;
      } else {
        where.tlName = { contains: userObj.name.split(' ')[0] };
      }
    }
    
    const teams = await this.prisma.team.findMany({
      where,
      include: {
        licenses: true,
        quotas: true,
        _count: {
          select: {
            requests: true,
          }
        }
      }
    });

    return teams.map(team => {
      const toolCounts: Record<string, string> = {};
      const activeCounts: Record<string, number> = {};
      const inventoryCounts: Record<string, number> = {};

      team.licenses.forEach(l => {
        if (l.status === 'DONE' || l.status === 'ASSIGNED_TO_USER') {
          activeCounts[l.aiTool] = (activeCounts[l.aiTool] || 0) + 1;
        } else if (l.status === 'AVAILABLE') {
          inventoryCounts[l.aiTool] = (inventoryCounts[l.aiTool] || 0) + 1;
        }
      });

      const allTools = new Set([...Object.keys(activeCounts), ...Object.keys(inventoryCounts)]);
      const breakdownItems: string[] = [];
      
      allTools.forEach(tool => {
        const active = activeCounts[tool] || 0;
        const available = inventoryCounts[tool] || 0;
        if (active > 0 && available > 0) {
          breakdownItems.push(`${active} ${tool} (Active) + ${available} (Ready)`);
        } else if (active > 0) {
          breakdownItems.push(`${active} ${tool}`);
        } else if (available > 0) {
          breakdownItems.push(`${available} ${tool} (Ready)`);
        }
      });

      const usedCount = Object.values(activeCounts).reduce((a, b) => a + b, 0) + team._count.requests;

      return {
        id: team.id,
        tl: team.tlName,
        team: team.name,
        used: usedCount,
        max: team.maxQuota,
        breakdownLabel: breakdownItems.join(' · '),
        toolQuotas: team.quotas.map(q => ({ tool: q.aiTool, max: q.maxQuota }))
      };
    });
  }

  async allocateToolQuota(teamId: number, aiTool: string, maxQuota: number) {
    return this.prisma.teamAiToolQuota.upsert({
      where: {
        teamId_aiTool: { teamId, aiTool }
      },
      create: {
        teamId,
        aiTool,
        maxQuota
      },
      update: {
        maxQuota
      }
    });
  }

  async updateQuota(id: number, maxQuota: number) {
    const team = await this.prisma.team.update({
      where: { id },
      data: { maxQuota },
    });
    return { success: true, team };
  }
}
