import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeData() {
  console.log('📊 Analyzing License Data for Copilot...\n');

  // 1. Count total Copilot licenses
  const copilotCount = await prisma.license.count({
    where: { aiTool: 'Copilot' },
  });

  // 2. Count total licenses
  const totalCount = await prisma.license.count();

  // 3. Get breakdown by aiTool
  const byTool = await prisma.license.groupBy({
    by: ['aiTool'],
    _count: true,
  });

  // 4. Get breakdown by status
  const copilotByStatus = await prisma.license.groupBy({
    by: ['status'],
    where: { aiTool: 'Copilot' },
    _count: true,
  });

  // 5. Get sample Copilot licenses
  const sampleCopilot = await prisma.license.findMany({
    where: { aiTool: 'Copilot' },
    take: 5,
    include: { team: true },
  });

  console.log('=== BREAKDOWN BY AI TOOL ===');
  byTool.forEach((item) => {
    console.log(`${item.aiTool}: ${item._count} licenses`);
  });

  console.log('\n=== COPILOT LICENSES IN LICENSE TABLE ===');
  console.log(`Total Copilot in License table: ${copilotCount}`);
  console.log(`Total all licenses: ${totalCount}`);
  console.log(
    `Percentage of Copilot: ${((copilotCount / totalCount) * 100).toFixed(2)}%`,
  );

  console.log('\n=== COPILOT BY STATUS ===');
  copilotByStatus.forEach((item) => {
    console.log(`${item.status}: ${item._count}`);
  });

  if (sampleCopilot.length > 0) {
    console.log('\n=== SAMPLE COPILOT LICENSES ===');
    sampleCopilot.forEach((license) => {
      console.log(
        `- ${license.userName} (${license.email}) - Status: ${license.status} - Team: ${license.teamId}`,
      );
    });
  }

  console.log('\n=== RECOMMENDATIONS ===');
  if (copilotCount === 0) {
    console.log('✅ Tidak ada Copilot di License table');
    console.log(
      '👍 Setelah migration, GitHub API akan menjadi data sumber (source of truth)',
    );
  } else if (copilotCount > 0) {
    console.log(`⚠️  Ada ${copilotCount} Copilot licenses di License table`);
    console.log('\n📋 NEXT STEPS:');
    console.log(
      '1. Jalankan: npx prisma migrate dev --name add-github-tracking',
    );
    console.log(
      '2. Setup GitHub organization & run sync untuk populate GitHubMember',
    );
    console.log('3. Compare data antara License table dan GitHubMember');
    console.log('4. Pilih strategy:');
    console.log(
      '   Option A: Keep License table (untuk legacy support + GitHub data)',
    );
    console.log(
      '   Option B: Auto-sync - tulis script untuk sync GitHubMember → License',
    );
    console.log(
      '   Option C: Migrate ke GitHub-only (hapus Copilot dari License table)',
    );
    console.log('5. Setup monitoring untuk avoid double-recording');
  }

  await prisma.$disconnect();
}

analyzeData().catch(console.error);
