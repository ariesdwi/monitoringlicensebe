import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HistoryService } from '../history/history.service';
import { CreateLicenseDto } from './dto/create-license.dto';

@Injectable()
export class LicensesService {
  constructor(
    private prisma: PrismaService,
    private history: HistoryService,
  ) {}

  async create(createLicenseDto: CreateLicenseDto, userObj: any) {
    if (userObj.role !== 'ADMIN') throw new BadRequestException('Only Admin can create license manually');
    
    const team = await this.prisma.team.findUnique({ where: { id: createLicenseDto.teamId } });
    if (!team) throw new NotFoundException('Team not found');

    const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());

    const license = await this.prisma.license.create({
      data: {
        userName: createLicenseDto.userName,
        email: createLicenseDto.email,
        userType: createLicenseDto.userType,
        departemen: createLicenseDto.departemen,
        aplikasi: createLicenseDto.aplikasi,
        squad: createLicenseDto.squad,
        teamId: createLicenseDto.teamId,
        tlName: team.tlName,
        status: createLicenseDto.status || 'AVAILABLE',
        date,
      }
    });

    await this.history.logAction(userObj.name, userObj.role, 'CREATE', license.userName, 'Admin menambahkan lisensi secara manual');
    return license;
  }

  async findAll(userObj: any) {
    if (userObj.role === 'TL') {
      const where: any = {};
      if (userObj.teamId) {
        where.teamId = userObj.teamId;
      } else {
        where.tlName = { contains: userObj.name.split(' ')[0] };
      }
      return this.prisma.license.findMany({
        where,
        include: { team: true }
      });
    }
    return this.prisma.license.findMany({
      include: { team: true }
    });
  }

  async createAccount(id: number, userObj: any) {
    if (userObj.role !== 'CISO') throw new BadRequestException('Only CISO can create account');
    const license = await this.prisma.license.findUnique({ where: { id } });
    if (!license) throw new NotFoundException();
    if (license.status !== 'SUBMITTED_TO_CISO') throw new BadRequestException('Invalid status transition');

    const updated = await this.prisma.license.update({
      where: { id },
      data: { status: 'PENDING_IGA' }
    });
    await this.history.logAction(userObj.name, userObj.role, 'CREATE', license.userName, `Akun ${license.aplikasi} dibuat di console`);
    return updated;
  }

  async inviteGroup(id: number, userObj: any) {
    if (userObj.role !== 'IGA') throw new BadRequestException('Only IGA can invite group');
    const license = await this.prisma.license.findUnique({ where: { id } });
    if (!license) throw new NotFoundException();
    if (license.status !== 'PENDING_IGA') throw new BadRequestException('Invalid status transition');

    const updated = await this.prisma.license.update({
      where: { id },
      data: { status: 'ACCOUNT_CREATED' }
    });
    await this.history.logAction(userObj.name, userObj.role, 'INVITE', license.userName, `User diundang ke Identity Group`);
    return updated;
  }

  async assign(id: number, userObj: any, newUserName?: string) {
    if (userObj.role !== 'ADMIN') throw new BadRequestException('Only Admin can assign');
    const license = await this.prisma.license.findUnique({ where: { id } });
    if (!license) throw new NotFoundException();
    if (license.status !== 'ACCOUNT_CREATED' && license.status !== 'AVAILABLE') throw new BadRequestException('Invalid status transition');

    let dataToUpdate: any = { status: 'ASSIGNED_TO_USER' };
    let actionLog = 'Lisensi dikirim ke user';
    
    if (license.status === 'AVAILABLE' && newUserName) {
      dataToUpdate.userName = newUserName;
      dataToUpdate.email = newUserName.split(' ')[0].toLowerCase() + '@corp.id';
      actionLog = `Lisensi direassign ke ${newUserName}`;
    }

    const updated = await this.prisma.license.update({
      where: { id },
      data: dataToUpdate
    });
    await this.history.logAction(userObj.name, userObj.role, 'ASSIGN', updated.userName, actionLog);
    return updated;
  }

  async confirmUsage(id: number, userObj: any) {
    if (userObj.role !== 'TL') throw new BadRequestException('Only TL can confirm');
    const license = await this.prisma.license.findUnique({ where: { id } });
    if (!license) throw new NotFoundException();
    if (license.status !== 'ASSIGNED_TO_USER') throw new BadRequestException('Invalid status transition');

    const updated = await this.prisma.license.update({
      where: { id },
      data: { status: 'DONE' }
    });
    await this.history.logAction(userObj.name, userObj.role, 'CONFIRM', license.userName, 'User login terverifikasi → DONE');
    return updated;
  }

  async revoke(id: number, userObj: any) {
    if (userObj.role !== 'CISO') throw new BadRequestException('Only CISO can revoke');
    const license = await this.prisma.license.findUnique({ where: { id } });
    if (!license) throw new NotFoundException();
    if (license.status === 'REVOKED' || license.status === 'AVAILABLE') throw new BadRequestException('Invalid status');

    const updated = await this.prisma.license.update({
      where: { id },
      data: { status: 'AVAILABLE' }
    });
    await this.history.logAction(userObj.name, userObj.role, 'REVOKE', license.userName, 'User resign — lisensi dicabut');
    return updated;
  }

  async edit(id: number, userObj: any, updateData: any) {
    if (userObj.role !== 'ADMIN') throw new BadRequestException('Only Admin can edit license');
    const license = await this.prisma.license.findUnique({ where: { id } });
    if (!license) throw new NotFoundException('License not found');

    const updated = await this.prisma.license.update({
      where: { id },
      data: updateData
    });

    await this.history.logAction(userObj.name, userObj.role, 'EDIT', updated.userName, 'Admin mengubah detail lisensi');
    return updated;
  }

  async delete(id: number, userObj: any) {
    if (userObj.role !== 'ADMIN') throw new BadRequestException('Only Admin can delete license');
    const license = await this.prisma.license.findUnique({ where: { id } });
    if (!license) throw new NotFoundException('License not found');

    await this.prisma.license.delete({ where: { id } });
    await this.history.logAction(userObj.name, userObj.role, 'DELETE', license.userName, 'Admin menghapus lisensi');
    return { success: true };
  }
}
