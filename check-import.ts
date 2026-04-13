import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const count = await prisma.gitHubMember.count();
  const org = await prisma.gitHubOrganization.count();
  const members = await prisma.gitHubMember.findMany({ take: 5 });

  console.log('GitHub Members: ', count);
  console.log('GitHub Organizations:', org);
  console.log('\nMembers:');
  members.forEach((m) => {
    console.log(
      `  - ${m.githubLogin} (${m.role}) - Copilot: ${m.hasCopilotLicense}`,
    );
  });
}

check().finally(() => prisma.$disconnect());
