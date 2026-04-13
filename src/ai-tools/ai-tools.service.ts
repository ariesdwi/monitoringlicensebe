import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HistoryService } from '../history/history.service';
import { CreateAiToolDto } from './dto/create-ai-tool.dto';
import { UpdateAiToolDto } from './dto/update-ai-tool.dto';

@Injectable()
export class AiToolsService {
  constructor(
    private prisma: PrismaService,
    private history: HistoryService,
  ) {}

  async create(createAiToolDto: CreateAiToolDto, userObj: any) {
    if (userObj.role !== 'ADMIN') throw new BadRequestException('Only Admin can add AI Tools');

    const tool = await this.prisma.aiTool.create({
      data: {
        name: createAiToolDto.name,
        totalQuota: createAiToolDto.totalQuota || 0,
      }
    });

    await this.history.logAction(userObj.name, userObj.role, 'CREATE', tool.name, 'Admin menambahkan AI Tool baru');
    return tool;
  }

  async findAll() {
    const tools = await this.prisma.aiTool.findMany({
      orderBy: { name: 'asc' }
    });

    return Promise.all(tools.map(async tool => {
      const usedQuota = await this.prisma.license.count({
        where: {
          aiTool: tool.name,
          status: {
            notIn: ['REVOKED', 'AVAILABLE']
          }
        }
      });
      return {
        ...tool,
        usedQuota
      };
    }));
  }

  async findOne(id: number) {
    const tool = await this.prisma.aiTool.findUnique({ where: { id } });
    if (!tool) throw new NotFoundException('AI Tool not found');
    return tool;
  }

  async update(id: number, updateAiToolDto: UpdateAiToolDto, userObj: any) {
    if (userObj.role !== 'ADMIN') throw new BadRequestException('Only Admin can edit AI Tools');

    const data: any = {};
    if (updateAiToolDto.name !== undefined) data.name = updateAiToolDto.name;
    if (updateAiToolDto.totalQuota !== undefined) data.totalQuota = updateAiToolDto.totalQuota;

    const tool = await this.prisma.aiTool.update({
      where: { id },
      data,
    });

    await this.history.logAction(userObj.name, userObj.role, 'EDIT', tool.name, 'Admin mengubah AI Tool');
    return tool;
  }

  async remove(id: number, userObj: any) {
    if (userObj.role !== 'ADMIN') throw new BadRequestException('Only Admin can delete AI Tools');

    const tool = await this.prisma.aiTool.findUnique({ where: { id } });
    if (!tool) throw new NotFoundException('AI Tool not found');

    await this.prisma.aiTool.delete({ where: { id } });
    await this.history.logAction(userObj.name, userObj.role, 'DELETE', tool.name, 'Admin menghapus AI Tool');
    return { success: true };
  }
}

