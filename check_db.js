const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const quotas = await prisma.teamAiToolQuota.findMany({
    include: { team: true }
  });
  console.log('--- Team AI Tool Quotas ---');
  quotas.forEach(q => {
    console.log(`${q.team.tlName}: ${q.aiTool} = ${q.maxQuota}`);
  });

  const licenses = await prisma.license.groupBy({
    by: ['tlName', 'aiTool', 'status'],
    _count: true
  });
  console.log('\n--- License Summary ---');
  licenses.forEach(l => {
    console.log(`${l.tlName} | ${l.aiTool} | ${l.status}: ${l._count}`);
  });
}

check().finally(() => prisma.$disconnect());
