import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AiImpactService } from './ai-impact.service';
import { CreateAiImpactDto } from './dto/create-ai-impact.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai-impact')
export class AiImpactController {
  constructor(private readonly aiImpactService: AiImpactService) {}

  @Get()
  findAll() {
    return this.aiImpactService.findAll();
  }

  @Get('summary')
  getSummary() {
    return this.aiImpactService.getSummary();
  }

  @Roles('TL')
  @Post()
  create(@Body() dto: CreateAiImpactDto, @Request() req: any) {
    return this.aiImpactService.create(dto, req.user);
  }

  @Roles('ADMIN', 'TL')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateAiImpactDto>, @Request() req: any) {
    return this.aiImpactService.update(+id, dto, req.user);
  }

  @Roles('ADMIN', 'TL')
  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.aiImpactService.delete(+id, req.user);
  }
}
