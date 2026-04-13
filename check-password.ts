import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@corp.id' },
  });

  console.log('User found:', user?.email, user?.name);
  console.log('Stored hash:', user?.password);

  // Try to verify with both possible passwords
  const testPassword = 'admin123';
  const correctMatch = await bcrypt.compare(testPassword, user?.password || '');
  console.log(
    `\nTesting password '${testPassword}': ${correctMatch ? '✅ MATCH' : '❌ NO MATCH'}`,
  );

  // Also try the password from seed
  const seedPassword = 'admin123';
  const seedMatch = await bcrypt.compare(seedPassword, user?.password || '');
  console.log(
    `Testing password '${seedPassword}': ${seedMatch ? '✅ MATCH' : '❌ NO MATCH'}`,
  );

  // Create a fresh hash to compare
  const freshHash = await bcrypt.hash('admin123', 10);
  console.log('\nFresh hash for "admin123":', freshHash);
  console.log(
    'Do they match?',
    user?.password === freshHash ? '✅ YES' : '❌ NO',
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
