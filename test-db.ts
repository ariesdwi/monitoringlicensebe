import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tools = await prisma.aiTool.findMany();
  console.log("Tools:", tools);
  const lic = await prisma.license.groupBy({ by: ['aiTool'], _count: true });
  console.log("Licenses group by aiTool:", lic);
}
main().finally(() => prisma.$disconnect());
