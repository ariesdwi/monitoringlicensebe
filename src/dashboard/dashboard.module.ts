import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { EnterpriseFocusService } from './enterprise-focus.service';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [
    HistoryModule,
    MulterModule.register({}),
  ],
  controllers: [DashboardController],
  providers: [DashboardService, EnterpriseFocusService],
})
export class DashboardModule {}
