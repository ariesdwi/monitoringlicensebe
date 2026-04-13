import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 DELETING ALL DATA: Cleaning up the entire database...');

  // Deleting records from all tables
  const deleteActivity = prisma.activity.deleteMany({});
  const deleteHistory = prisma.history.deleteMany({});
  const deleteRequest = prisma.request.deleteMany({});
  const deleteTeamAiToolQuota = prisma.teamAiToolQuota.deleteMany({});
  const deleteAiImpact = prisma.aiImpact.deleteMany({});
  const deleteLicense = prisma.license.deleteMany({});
  const deleteTeamApp = prisma.teamApp.deleteMany({});
  const deleteUser = prisma.user.deleteMany({});
  const deleteTeam = prisma.team.deleteMany({});
  const deleteAiTool = prisma.aiTool.deleteMany({});

  // Use a transaction to ensure everything is deleted
  await prisma.$transaction([
    deleteActivity,
    deleteHistory,
    deleteRequest,
    deleteTeamAiToolQuota,
    deleteAiImpact,
    deleteLicense,
    deleteTeamApp,
    deleteUser,
    deleteTeam,
    deleteAiTool
  ]);

  console.log('✅ All data has been successfully cleared.');
}

main()
  .catch((e) => {
    console.error('❌ Error during reset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
