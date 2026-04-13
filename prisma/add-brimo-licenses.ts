import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Cari team DGR MTP (Hafidz Cahyo)
  const team = await prisma.team.findFirst({
    where: { name: 'DGR MTP' },
  });

  if (!team) {
    throw new Error('Team DGR MTP tidak ditemukan!');
  }

  console.log(`✅ Team ditemukan: ${team.name} (id: ${team.id})`);

  const date = '2 Apr 2026';

  // 3 lisensi baru BRIMo untuk DGR MTP
  const newLicenses = [
    {
      userName: 'Muhamad Ridwan',
      email: '1872010505940013@bbri.id',
      departemen: 'DGR',
      aplikasi: 'BRIMo',
      squad: 'MTP',
      tlName: 'Hafidz Cahyo',
      teamId: team.id,
      status: 'DONE',
      date,
    },
    {
      userName: 'Rangga Arsy Prawira',
      email: '3276061109020001@bbri.id',
      departemen: 'DGR',
      aplikasi: 'BRIMo',
      squad: 'MTP',
      tlName: 'Hafidz Cahyo',
      teamId: team.id,
      status: 'DONE',
      date,
    },
    {
      userName: 'Farhan Wildan Nugraha',
      email: '271060209030004@bbri.id',
      departemen: 'DGR',
      aplikasi: 'BRIMo',
      squad: 'MTP',
      tlName: 'Hafidz Cahyo',
      teamId: team.id,
      status: 'DONE',
      date,
    },
  ];

  const result = await prisma.license.createMany({ data: newLicenses });

  console.log(`\n🎉 Berhasil menambahkan ${result.count} lisensi baru BRIMo:`);
  newLicenses.forEach((l, i) => {
    console.log(`  ${i + 1}. ${l.userName} (${l.email}) — Squad: ${l.squad} — Status: ${l.status}`);
  });

  // Tampilkan total lisensi DGR MTP sekarang
  const total = await prisma.license.count({ where: { teamId: team.id } });
  console.log(`\n📊 Total lisensi DGR MTP sekarang: ${total} / ${team.maxQuota}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
