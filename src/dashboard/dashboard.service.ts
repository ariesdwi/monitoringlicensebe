import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(roleView: string, userObj: any) {
    if (roleView === 'admin') {
      const total = await this.prisma.license.count();
      const done = await this.prisma.license.count({ where: { status: 'DONE' } });
      const pending = await this.prisma.license.count({ where: { status: { in: ['PENDING', 'SUBMITTED_TO_CISO', 'PENDING_IGA', 'ACCOUNT_CREATED', 'ASSIGNED_TO_USER'] } } });
      const revoked = await this.prisma.license.count({ where: { status: { in: ['REVOKED', 'AVAILABLE'] } } });

      return [
        { label: 'Total Lisensi',  value: total.toString(), sub: 'aktif dalam sistem',      delta: `+${total}`, up: true,  cls: 'glow-green' },
        { label: 'Status DONE',    value: done.toString(),  sub: 'terverifikasi digunakan', delta: `+${done}`,  up: true,  cls: 'glow-teal' },
        { label: 'Idle / Pending', value: pending.toString(), sub: 'menunggu aksi',         delta: pending > 0 ? `${pending}` : '0', up: false, cls: 'glow-orange' },
        { label: 'Siap Sedia',     value: revoked.toString(), sub: 'siap ditugaskan',       delta: revoked > 0 ? `${revoked}` : '0', up: true, cls: 'glow-blue' },
      ];
    }

    if (roleView === 'tl') {
      const allTeams = await this.prisma.team.findMany({ include: { apps: true } });
      const userFirstName = userObj.name.split(' ')[0];
      const userTeam = allTeams.find(t => t.tlName.includes(userFirstName));

      const used = userTeam ? await this.prisma.license.count({
        where: { teamId: userTeam.id, status: { notIn: ['REVOKED', 'AVAILABLE'] } }
      }) : 0;
      const max = userTeam?.maxQuota || 10;
      const done = userTeam ? await this.prisma.license.count({
        where: { teamId: userTeam.id, status: 'DONE' }
      }) : 0;
      const pendingReqs = userTeam ? await this.prisma.request.count({
        where: { teamId: userTeam.id }
      }) : 0;

      // Aplikasi dinamis dari TeamApp
      const appNames = userTeam?.apps?.map(v => v.aplikasi) || [];
      const appLabel = appNames.join(', ') || '-';

      return [
        { label: 'Kuota Terpakai',    value: `${used}/${max}`, sub: userTeam ? `${userTeam.name} — ${userTeam.tlName}` : 'No Team', delta: `+${used}`, up: true,  cls: 'glow-green' },
        { label: 'Status DONE',       value: done.toString(),    sub: 'user aktif terverifikasi',    delta: `+${done}`, up: true,  cls: 'glow-teal' },
        { label: 'Menunggu Approve',  value: pendingReqs.toString(), sub: 'request pending',             delta: '',   up: true,  cls: 'glow-orange' },
        { label: 'Aplikasi',          value: appNames.length.toString(), sub: appLabel,              delta: '',   up: true,  cls: 'glow-green' },
      ];
    }

    if (roleView === 'ciso') {
      const pendingAccs = await this.prisma.license.count({ where: { status: 'SUBMITTED_TO_CISO' } });
      const revoked = await this.prisma.license.count({ where: { status: 'AVAILABLE' } });
      const accountsCreated = await this.prisma.license.count({
        where: { status: { in: ['PENDING_IGA', 'ACCOUNT_CREATED', 'ASSIGNED_TO_USER', 'DONE'] } }
      });
      const apps = await this.prisma.teamApp.findMany({ distinct: ['aplikasi'], select: { aplikasi: true } });
      const appLabel = apps.map(d => d.aplikasi).join(' · ');

      return [
        { label: 'Antrian Akun',     value: pendingAccs.toString(), sub: 'perlu dibuat',     delta: '',   up: true,  cls: 'glow-orange' },
        { label: 'Revoke Bulan Ini', value: revoked.toString(), sub: 'akun dicabut',     delta: revoked > 0 ? `+${revoked}` : '0', up: false, cls: 'glow-red' },
        { label: 'Akun Dibuat',      value: accountsCreated.toString(), sub: 'total bulan ini',  delta: `+${accountsCreated}`, up: true,  cls: 'glow-green' },
        { label: 'Aplikasi Dikelola',value: apps.length.toString(), sub: appLabel,  delta: '',   up: true,  cls: 'glow-teal' },
      ];
    }

    if (roleView === 'iga') {
      const pendingGroups = await this.prisma.license.count({ where: { status: 'PENDING_IGA' } });
      const invited = await this.prisma.license.count({
        where: { status: { in: ['ACCOUNT_CREATED', 'ASSIGNED_TO_USER', 'DONE'] } }
      });
      const apps = await this.prisma.teamApp.findMany({ distinct: ['aplikasi'], select: { aplikasi: true } });

      return [
        { label: 'Antrian Group',    value: pendingGroups.toString(), sub: 'perlu di-invite',  delta: '',   up: true,  cls: 'glow-orange' },
        { label: 'Berhasil Invite',  value: invited.toString(), sub: 'total bulan ini',  delta: `+${invited}`, up: true,  cls: 'glow-green' },
        { label: 'Idle / Error',     value: '0', sub: 'gagal invite',     delta: '',   up: true,  cls: 'glow-red' },
        { label: 'Active Sync',      value: apps.length.toString(), sub: 'sistem terhubung', delta: '',   up: true,  cls: 'glow-teal' },
      ];
    }

    if (roleView === 'idm') {
      const totalReq = await this.prisma.request.count();
      const inProgress = await this.prisma.license.count({
        where: { status: { in: ['SUBMITTED_TO_CISO', 'PENDING_IGA'] } }
      });
      const done = await this.prisma.license.count({ where: { status: 'DONE' } });
      const overall = await this.prisma.license.count({ where: { status: { notIn: ['REVOKED', 'AVAILABLE'] } } });

      return [
        { label: 'Total Permintaan', value: totalReq.toString(), sub: 'request aktif', delta: '', up: true, cls: 'glow-purple' },
        { label: 'Prospek Provisioning', value: inProgress.toString(), sub: 'menunggu CISO/IGA', delta: inProgress > 0 ? `${inProgress}` : '0', up: true, cls: 'glow-orange' },
        { label: 'Lisensi Selesai (DONE)', value: done.toString(), sub: 'telah didistribusikan', delta: `+${done}`, up: true, cls: 'glow-teal' },
        { label: 'Total Lisensi Aktif', value: overall.toString(), sub: 'keseluruhan departemen', delta: `+${overall}`, up: true, cls: 'glow-green' },
      ];
    }

    return [];
  }
}
