import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HistoryModule } from './history/history.module';
import { QuotasModule } from './quotas/quotas.module';
import { RequestsModule } from './requests/requests.module';
import { LicensesModule } from './licenses/licenses.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TeamsModule } from './teams/teams.module';
import { AiImpactModule } from './ai-impact/ai-impact.module';
import { AiToolsModule } from './ai-tools/ai-tools.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HistoryModule,
    QuotasModule,
    RequestsModule,
    LicensesModule,
    DashboardModule,
    TeamsModule,
    AiImpactModule,
    AiToolsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

