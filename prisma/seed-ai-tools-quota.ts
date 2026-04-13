import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Update Gemini
  await prisma.aiTool.upsert({
    where: { name: 'Gemini' },
    update: { totalQuota: 40 },
    create: { name: 'Gemini', totalQuota: 40 }
  });

  // Update Copilot
  await prisma.aiTool.upsert({
    where: { name: 'Copilot' },
    update: { totalQuota: 50 },
    create: { name: 'Copilot', totalQuota: 50 }
  });

  console.log('Successfully seeded AI tools quotas');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
