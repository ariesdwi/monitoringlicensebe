import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ Deleting all licenses...');
  const result = await prisma.license.deleteMany({});
  console.log(`✅ Deleted ${result.count} licenses.`);
  
  // Optionally clear requests and history if they are tied to those licenses
  // const requestResult = await prisma.request.deleteMany({});
  // console.log(`✅ Deleted ${requestResult.count} requests.`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
