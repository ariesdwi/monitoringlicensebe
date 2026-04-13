import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HistoryService } from '../history/history.service';
import { CreateRequestDto } from './dto/create-request.dto';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private history: HistoryService,
  ) {}

  async findAll(userObj: any) {
    console.log(`🔍 [RequestsService] findAll for user: ${userObj?.name} (Role: ${userObj?.role}, TeamId: ${userObj?.teamId})`);
    
    // Support both uppercase and lowercase 'TL'
    const isTL = userObj?.role?.toUpperCase() === 'TL';

    if (isTL) {
      const where: any = {};
      
      if (userObj.teamId) {
        where.teamId = Number(userObj.teamId);
      } else {
        // Fallback: Filter by TL Name part if teamId is missing
        const firstName = userObj.name?.split(' ')[0] || '';
        where.tlName = { contains: firstName };
        console.log(`⚠ [RequestsService] No teamId in token, falling back to tlName contains: "${firstName}"`);
      }

      const results = await this.prisma.request.findMany({
        where,
        include: { team: true }
      });
      console.log(`✅ [RequestsService] Found ${results.length} requests for TL ${userObj.name}`);
      return results;
    }

    // Admins see all
    return this.prisma.request.findMany({
      include: { team: true }
    });
  }

  async create(createRequestDto: CreateRequestDto, userObj: any) {
    if (userObj.role !== 'TL') {
      throw new BadRequestException('Only TL can create requests');
    }

    const team = await this.prisma.team.findFirst({
      where: { tlName: userObj.name } // Matches mock data TL's full name to team.tlName, wait, in mock data TL = 'Farhan', but full name is 'Farhan Haq'. Wait, in seed we set tlName to 'Farhan' and name to 'Farhan Haq'. 
    });

    if (!team) {
       // Search by initials or mapping. Since in standard seed it was Farhan to Farhan Haq. Let's just find the team where users include this user or tlName matches firstName
       const currentTeam = await this.prisma.team.findFirst({
         where: { tlName: { endsWith: '' } } // fallback, see query below
       });
    }

    const teams = await this.prisma.team.findMany();
    // naive match for demo purposes based on firstName
    const userFirstName = userObj.name.split(' ')[0];
    const userTeam = teams.find(t => t.tlName.includes(userFirstName));

    if (!userTeam) {
      throw new BadRequestException('Team not found for TL');
    }

    // Checking Tool-Specific Quota
    const aiToolName = createRequestDto.aiTool;
    const toolQuota = await this.prisma.teamAiToolQuota.findUnique({
      where: {
        teamId_aiTool: {
          teamId: userTeam.id,
          aiTool: aiToolName,
        }
      }
    });

    const activeToolLicensesCount = await this.prisma.license.count({
      where: {
        teamId: userTeam.id,
        aiTool: aiToolName,
        status: { notIn: ['REVOKED', 'AVAILABLE'] }
      }
    });

    const pendingToolRequestsCount = await this.prisma.request.count({
      where: { 
        teamId: userTeam.id,
        aiTool: aiToolName
      }
    });

    const currentUsage = activeToolLicensesCount + pendingToolRequestsCount;
    const allowedQuota = toolQuota ? toolQuota.maxQuota : userTeam.maxQuota;

    if (currentUsage >= allowedQuota) {
      throw new BadRequestException(`Request denied: Team quota for ${aiToolName} exceeded (${currentUsage}/${allowedQuota})!`);
    }

    const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());

    const request = await this.prisma.request.create({
      data: {
        userName: createRequestDto.userName,
        email: createRequestDto.email,
        userType: createRequestDto.userType,
        tlName: userTeam.tlName,
        teamId: userTeam.id,
        departemen: createRequestDto.departemen,
        aplikasi: createRequestDto.aplikasi,
        squad: createRequestDto.squad,
        aiTool: aiToolName,
        date,
        reason: createRequestDto.reason,
      }
    });

    await this.history.logAction(userObj.name, userObj.role, 'REQUEST', createRequestDto.userName, `Request baru aplikasi ${createRequestDto.aplikasi} (Squad ${createRequestDto.squad})`);
    return request;
  }

  async approve(id: number, userObj: any) {
    const req = await this.prisma.request.findUnique({ where: { id } });
    if (!req) throw new NotFoundException();

    const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());

    // Create License with status SUBMITTED_TO_CISO (vendor field = departemen code)
    const license = await this.prisma.license.create({
      data: {
        userName: req.userName,
        email: req.email || req.userName.split(' ')[0].toLowerCase() + '@corp.id', // Fallback for old requests
        userType: req.userType,
        departemen: req.departemen,
        aplikasi: req.aplikasi,
        squad: req.squad,
        tlName: req.tlName,
        teamId: req.teamId,
        aiTool: req.aiTool,
        status: 'SUBMITTED_TO_CISO',
        date,
      }
    });

    await this.prisma.request.delete({ where: { id } });
    await this.history.logAction(userObj.name, userObj.role, 'APPROVE', req.userName, 'Kuota tersedia, diteruskan ke CISO');
    
    return license;
  }

  async reject(id: number, userObj: any) {
    const req = await this.prisma.request.findUnique({ where: { id } });
    if (!req) throw new NotFoundException();

    await this.prisma.request.delete({ where: { id } });
    await this.history.logAction(userObj.name, userObj.role, 'REJECT', req.userName, 'Request ditolak Admin');
    return { success: true };
  }
}
