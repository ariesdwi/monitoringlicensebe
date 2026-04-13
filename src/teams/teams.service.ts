import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async createTeam(data: {
    teamName: string;
    tlName: string;
    email: string;
    departemen: string;
    aplikasi: string;
    maxQuota: number;
  }) {
    const password = await bcrypt.hash('bri@1234', 10);
    const nameParts = data.tlName.split(' ');
    const initials = (nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : '')).toUpperCase();

    const team = await this.prisma.team.create({
      data: {
        name: data.teamName,
        tlName: data.tlName,
        maxQuota: data.maxQuota,
        users: {
          create: {
            email: data.email,
            password: password,
            name: data.tlName,
            role: 'TL',
            initials: initials,
            title: `TL · ${data.teamName}`,
          }
        },
        apps: {
          create: {
            departemen: data.departemen,
            aplikasi: data.aplikasi
          }
        }
      }
    });

    return team;
  }
}
