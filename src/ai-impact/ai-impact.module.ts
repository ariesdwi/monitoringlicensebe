import { Module } from '@nestjs/common';
import { AiImpactController } from './ai-impact.controller';
import { AiImpactService } from './ai-impact.service';
import { PrismaModule } from '../prisma/prisma.module';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [PrismaModule, HistoryModule],
  controllers: [AiImpactController],
  providers: [AiImpactService],
  exports: [AiImpactService],
})
export class AiImpactModule {}
