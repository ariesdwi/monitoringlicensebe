import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { EnterpriseFocusService } from './src/dashboard/enterprise-focus.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const service = app.get(EnterpriseFocusService);
  
  console.log('Fetching member activity (Tabel 1)...');
  const data = await service.getMemberActivity();
  
  console.log(`Berhasil mengambil ${data.length} member.`);
  console.log('Sample Data:');
  console.dir(data.slice(0, 3), { depth: null });
  
  await app.close();
}
bootstrap().catch(console.error);
