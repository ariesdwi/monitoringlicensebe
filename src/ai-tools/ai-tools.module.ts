import { Module } from '@nestjs/common';
import { AiToolsService } from './ai-tools.service';
import { AiToolsController } from './ai-tools.controller';

@Module({
  controllers: [AiToolsController],
  providers: [AiToolsService],
})
export class AiToolsModule {}
