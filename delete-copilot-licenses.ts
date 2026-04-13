import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function deleteCopilotLicenses() {
  console.log('🗑️  Delete Copilot Licenses Script\n');

  // 1. Count Copilot licenses
  const copilotCount = await prisma.license.count({
    where: { aiTool: 'Copilot' },
  });

  console.log(`📊 Found ${copilotCount} Copilot licenses to delete`);

  if (copilotCount === 0) {
    console.log('✅ No Copilot licenses found - nothing to delete');
    await prisma.$disconnect();
    return;
  }

  // 2. Get all Copilot licenses untuk backup
  const copilotLicenses = await prisma.license.findMany({
    where: { aiTool: 'Copilot' },
    include: { team: true },
  });

  // 3. Create backup file
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(
    backupDir,
    `copilot-licenses-backup-${timestamp}.json`,
  );

  fs.writeFileSync(backupFile, JSON.stringify(copilotLicenses, null, 2));
  console.log(`💾 Backup created: ${backupFile}`);

  // 4. Ask for confirmation (simple check)
  console.log('\n⚠️  WARNING: Operation tidak bisa di-undo!');
  console.log(`   Akan menghapus ${copilotCount} licenses`);
  console.log('   Backup sudah dibuat di:', backupFile);

  // 5. Delete Copilot licenses
  console.log('\n⏳ Deleting Copilot licenses...');

  const deleteResult = await prisma.license.deleteMany({
    where: { aiTool: 'Copilot' },
  });

  console.log(`✅ Deleted ${deleteResult.count} licenses`);

  // 6. Verify
  const remainingCopilot = await prisma.license.count({
    where: { aiTool: 'Copilot' },
  });

  const totalRemaining = await prisma.license.count();

  console.log('\n📋 Verification:');
  console.log(`   Remaining Copilot licenses: ${remainingCopilot}`);
  console.log(`   Total licenses: ${totalRemaining}`);

  // 7. Get remaining breakdown
  const breakdown = await prisma.license.groupBy({
    by: ['aiTool'],
    _count: true,
  });

  console.log('\n📊 License breakdown:');
  breakdown.forEach((item) => {
    console.log(`   ${item.aiTool}: ${item._count}`);
  });

  console.log('\n✅ Done! Backup file:');
  console.log(`   ${backupFile}`);
  console.log('\n💡 Jika ingin restore, gunakan backup file ini');

  await prisma.$disconnect();
}

deleteCopilotLicenses().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
