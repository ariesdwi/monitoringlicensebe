import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  createTeam(@Body() payload: {
    teamName: string;
    tlName: string;
    email: string;
    departemen: string;
    aplikasi: string;
    maxQuota: number;
  }) {
    return this.teamsService.createTeam(payload);
  }
}
