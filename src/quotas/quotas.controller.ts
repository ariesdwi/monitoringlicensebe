import { Controller, Get, UseGuards, Patch, Param, Body, Request } from '@nestjs/common';
import { QuotasService } from './quotas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('quotas')
export class QuotasController {
  constructor(private readonly quotasService: QuotasService) {}

  @Get()
  getQuotas(@Request() req: any) {
    return this.quotasService.getQuotas(req.user);
  }

  @Patch(':id')
  updateQuota(@Param('id') id: string, @Body('maxQuota') maxQuota: number) {
    return this.quotasService.updateQuota(+id, maxQuota);
  }

  @Patch(':id/allocate')
  allocateToolQuota(
    @Param('id') id: string,
    @Body('aiTool') aiTool: string,
    @Body('maxQuota') maxQuota: number
  ) {
    return this.quotasService.allocateToolQuota(+id, aiTool, maxQuota);
  }
}
