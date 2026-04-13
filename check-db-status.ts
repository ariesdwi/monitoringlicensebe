import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 DATABASE STATUS CHECK\n');

  const users = await prisma.user.count();
  const licenses = await prisma.license.count();
  const teams = await prisma.team.count();
  const aiTools = await prisma.aiTool.count();
  const teamApps = await prisma.teamApp.count();
  const quotas = await prisma.teamAiToolQuota.count();
  const gitHubOrgs = await prisma.gitHubOrganization.count();
  const copilotSeats = await prisma.copilotSeatUsage.count();
  const gitHubMembers = await prisma.gitHubMember.count();

  console.log('✅ Data Summary:');
  console.log(`   Users: ${users}`);
  console.log(`   Teams: ${teams}`);
  console.log(`   AI Tools: ${aiTools}`);
  console.log(`   Team Apps: ${teamApps}`);
  console.log(`   Quotas: ${quotas}`);
  console.log(`   Licenses: ${licenses}`);
  console.log(`   GitHub Organizations: ${gitHubOrgs}`);
  console.log(`   Copilot Seats: ${copilotSeats}`);
  console.log(`   GitHub Members: ${gitHubMembers}\n`);

  if (licenses > 0) {
    const licensesByTool = await prisma.license.groupBy({
      by: ['aiTool'],
      _count: true,
    });
    console.log('📋 Licenses by Tool:');
    licensesByTool.forEach(({ aiTool, _count }) => {
      console.log(`   ${aiTool}: ${_count}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
