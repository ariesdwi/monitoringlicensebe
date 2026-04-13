import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { EnterpriseFocusService } from './src/dashboard/enterprise-focus.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const service = app.get(EnterpriseFocusService);
  
  console.log('Fetching copilot usage (Tabel 2)...');
  const data = await service.getCopilotUsagePerUser();
  
  console.log(`Berhasil mengambil ${data.length} seat usage.`);
  console.log('Sample detail data per user:');
  console.dir(data.slice(0, 1), { depth: null });
  
  await app.close();
}
bootstrap().catch(console.error);
