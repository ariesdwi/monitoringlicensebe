import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HistoryService {
  constructor(private prisma: PrismaService) {}

  async logAction(actor: string, role: string, action: string, target: string, note: string) {
    const time = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date()).replace('.', ':');

    await this.prisma.history.create({
      data: {
        time,
        actor,
        role: this.formatRole(role),
        action,
        target,
        note,
      },
    });

    // Also add to Activities optionally
    await this.addActivity(action, actor, role, target, note);
  }

  private formatRole(role: string): string {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'TL': return 'TL';
      case 'CISO': return 'CISO';
      case 'IGA': return 'IGA';
      default: return role;
    }
  }

  private async addActivity(action: string, actor: string, role: string, target: string, note: string) {
    const time = 'Baru saja';
    let icon = 'ℹ️';
    let cls = 'ai-gray';
    let text = `<strong>${actor}</strong> melakukan aksi ${action} pada ${target}`;

    if (action === 'APPROVE') {
      icon = '✓';
      cls = 'ai-green';
      text = `<strong>Admin</strong> menyetujui request <strong>${target}</strong>`;
    } else if (action === 'CREATE') {
      icon = '⚡';
      cls = 'ai-purple';
      text = `<strong>CISO</strong> membuat akun untuk <strong>${target}</strong>`;
    } else if (action === 'INVITE') {
      icon = '👥';
      cls = 'ai-blue';
      text = `<strong>IGA</strong> menginvite grup untuk <strong>${target}</strong>`;
    } else if (action === 'ASSIGN') {
      icon = '✓';
      cls = 'ai-green';
      text = `<strong>Admin</strong> mereassign lisensi untuk <strong>${target}</strong>`;
    } else if (action === 'CONFIRM') {
      icon = '✓';
      cls = 'ai-teal';
      text = `<strong>${actor}</strong> mengonfirmasi usage <strong>${target}</strong> → DONE`;
    } else if (action === 'REVOKE') {
      icon = '✕';
      cls = 'ai-red';
      text = `<strong>CISO</strong> merevoke lisensi <strong>${target}</strong>`;
    } else if (action === 'REQUEST') {
      icon = '⟳';
      cls = 'ai-orange';
      text = `<strong>${actor}</strong> mengajukan request untuk <strong>${target}</strong>`;
    }

    await this.prisma.activity.create({
      data: {
        icon,
        cls,
        text,
        time,
      },
    });
  }

  async getAllHistory() {
    return this.prisma.history.findMany({
      orderBy: { id: 'desc' },
    });
  }

  async getRecentActivities() {
    return this.prisma.activity.findMany({
      orderBy: { id: 'desc' },
      take: 5,
    });
  }
}
