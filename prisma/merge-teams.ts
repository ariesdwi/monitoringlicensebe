import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Merging duplicate teams for Wondo and Dicky Firmansyah...');

  // Merge Wondo (Team 17 -> Team 14)
  console.log('Merging Team 17 to Team 14 (Wondo)');
  await prisma.license.updateMany({ where: { teamId: 17 }, data: { teamId: 14 } });
  await prisma.teamApp.deleteMany({ where: { teamId: 17 } });
  await prisma.user.deleteMany({ where: { teamId: 17 } }); // cleanup mistakenly created user if any
  await prisma.team.delete({ where: { id: 17 } });

  // Merge Dicky Firmansyah (Team 18 -> Team 10)
  console.log('Merging Team 18 to Team 10 (Dicky Firmansyah)');
  await prisma.license.updateMany({ where: { teamId: 18 }, data: { teamId: 10 } });
  await prisma.teamApp.deleteMany({ where: { teamId: 18 } });
  await prisma.user.deleteMany({ where: { teamId: 18 } }); // cleanup mistakenly created user if any
  await prisma.team.delete({ where: { id: 18 } });

  // Update max quotas automatically to avoid UI confusion
  await prisma.team.update({
    where: { id: 14 },
    data: { maxQuota: 30 }
  });
  await prisma.team.update({
    where: { id: 10 },
    data: { maxQuota: 30 }
  });

  console.log('✅ Teams merged successfully!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
