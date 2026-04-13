import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.requestsService.findAll(req.user);
  }

  @Roles('TL')
  @Post()
  create(@Body() createRequestDto: CreateRequestDto, @Request() req: any) {
    return this.requestsService.create(createRequestDto, req.user);
  }

  @Roles('ADMIN')
  @Patch(':id/approve')
  approve(@Param('id') id: string, @Request() req: any) {
    return this.requestsService.approve(+id, req.user);
  }

  @Roles('ADMIN')
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Request() req: any) {
    return this.requestsService.reject(+id, req.user);
  }
}
