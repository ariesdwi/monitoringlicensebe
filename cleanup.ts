import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.aiTool.deleteMany({
    where: {
      name: { in: ['GEMINI', 'COPILOT'] }
    }
  });
  console.log("Deleted uppercase duplicate AI Tools.");
}
main().finally(() => prisma.$disconnect());
