import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding AI Impact report for Hafidz Cahyo...');

  const team = await prisma.team.findFirst({
    where: { tlName: 'Hafidz Cahyo' }
  });

  if (!team) {
    console.error('❌ Team for Hafidz Cahyo not found!');
    return;
  }

  // Sample data for Hafidz's team (DGR MTP)
  const impactData = [
    {
      teamId: team.id,
      tlName: 'Hafidz Cahyo',
      squad: 'Jaipur',
      aplikasi: 'BRIMo',
      aiTool: 'Gemini',
      period: 'March 2026',
      manCount: 5,
      daysWithAI: 12,
      daysWithoutAI: 18,
      sqBugs: 2,
      sqVulnerabilities: 0,
      sqCodeSmells: 15,
      sqCoverage: 84.5,
      sqDuplications: 2.1,
      sqRating: 'A',
      notes: 'Significant improvement in unit test coverage with Gemini.'
    },
    {
      teamId: team.id,
      tlName: 'Hafidz Cahyo',
      squad: 'Dubai',
      aplikasi: 'BRIMo',
      aiTool: 'Copilot',
      period: 'March 2026',
      manCount: 3,
      daysWithAI: 10,
      daysWithoutAI: 14,
      sqBugs: 1,
      sqVulnerabilities: 1,
      sqCodeSmells: 10,
      sqCoverage: 78.2,
      sqDuplications: 1.5,
      sqRating: 'B',
      notes: 'Faster boilerplate generation.'
    }
  ];

  for (const data of impactData) {
    await prisma.aiImpact.create({ data });
  }

  console.log('✨ AI Impact report seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
