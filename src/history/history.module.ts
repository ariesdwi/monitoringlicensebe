import { Global, Module } from '@nestjs/common';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';

@Global()
@Module({
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
