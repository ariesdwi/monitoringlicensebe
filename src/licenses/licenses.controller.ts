import { Controller, Get, Patch, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateLicenseDto } from './dto/create-license.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Roles('ADMIN')
  @Post()
  create(@Body() createLicenseDto: CreateLicenseDto, @Request() req: any) {
    return this.licensesService.create(createLicenseDto, req.user);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.licensesService.findAll(req.user);
  }

  @Roles('CISO')
  @Patch(':id/create-account')
  createAccount(@Param('id') id: string, @Request() req: any) {
    return this.licensesService.createAccount(+id, req.user);
  }

  @Roles('IGA')
  @Patch(':id/invite-group')
  inviteGroup(@Param('id') id: string, @Request() req: any) {
    return this.licensesService.inviteGroup(+id, req.user);
  }

  @Roles('ADMIN')
  @Patch(':id/assign')
  assign(@Param('id') id: string, @Body('userName') userName: string, @Request() req: any) {
    return this.licensesService.assign(+id, req.user, userName);
  }

  @Roles('TL')
  @Patch(':id/confirm-usage')
  confirmUsage(@Param('id') id: string, @Request() req: any) {
    return this.licensesService.confirmUsage(+id, req.user);
  }

  @Roles('CISO')
  @Patch(':id/revoke')
  revoke(@Param('id') id: string, @Request() req: any) {
    return this.licensesService.revoke(+id, req.user);
  }

  @Roles('ADMIN')
  @Patch(':id/edit')
  edit(@Param('id') id: string, @Body() updateData: any, @Request() req: any) {
    return this.licensesService.edit(+id, req.user, updateData);
  }

  @Roles('ADMIN')
  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.licensesService.delete(+id, req.user);
  }
}
