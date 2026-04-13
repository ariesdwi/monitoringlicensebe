import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AiToolsService } from './ai-tools.service';
import { CreateAiToolDto } from './dto/create-ai-tool.dto';
import { UpdateAiToolDto } from './dto/update-ai-tool.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai-tools')
export class AiToolsController {
  constructor(private readonly aiToolsService: AiToolsService) {}

  @Roles('ADMIN')
  @Post()
  create(@Body() createAiToolDto: CreateAiToolDto, @Request() req: any) {
    return this.aiToolsService.create(createAiToolDto, req.user);
  }

  @Get()
  findAll() {
    return this.aiToolsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiToolsService.findOne(+id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAiToolDto: UpdateAiToolDto, @Request() req: any) {
    return this.aiToolsService.update(+id, updateAiToolDto, req.user);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.aiToolsService.remove(+id, req.user);
  }
}

