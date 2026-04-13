import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🏢 Menambahkan Tim DGR Merchant...');

  const password = await bcrypt.hash('bri@1234', 10);

  // Buat tim baru
  let team = await prisma.team.findFirst({ where: { tlName: 'Fahrul Rozie' } });
  
  if (!team) {
    team = await prisma.team.create({
      data: {
        name: 'DGR Merchant',
        tlName: 'Fahrul Rozie',
        maxQuota: 10,
      }
    });
    
    // Tambahkan asosiasi aplikasi
    await prisma.teamApp.create({
      data: { teamId: team.id, departemen: 'DGR', aplikasi: 'Merchant' }
    });

    // Tambahkan user TL
    await prisma.user.create({
      data: {
        email: 'fahrul.rozie@corp.id',
        password,
        name: 'Fahrul Rozie',
        role: 'TL',
        initials: 'FR',
        title: 'TL · DGR Merchant',
        teamId: team.id
      }
    });
    console.log(`✅ Tim dan TL Fahrul Rozie berhasil dibuat (Team ID: ${team.id}).`);
  } else {
    console.log(`✅ Tim untuk Fahrul Rozie sudah ada (Team ID: ${team.id}).`);
  }

  const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());

  // 2 lisensi baru
  const newLicenses = [
    {
      userName: 'Muhammad Fadhly Noor Rizqi',
      email: '3171072910010000@bbri.id',
      departemen: 'DGR',
      aplikasi: 'Merchant',
      squad: 'MCP Azzuri',
      tlName: 'Fahrul Rozie',
      teamId: team.id,
      status: 'DONE',
      date,
    },
    {
      userName: 'Fikri Halim Chaniago',
      email: '1871012702990000@bbri.id',
      departemen: 'DGR',
      aplikasi: 'Merchant',
      squad: 'MCP Azzuri',
      tlName: 'Fahrul Rozie',
      teamId: team.id,
      status: 'DONE',
      date,
    }
  ];

  const result = await prisma.license.createMany({ data: newLicenses });

  console.log(`\n🎉 Berhasil menambahkan ${result.count} lisensi baru untuk tim Fahrul Rozie:`);
  newLicenses.forEach((l, i) => {
    console.log(`  ${i + 1}. ${l.userName} (${l.email}) — Squad: ${l.squad} — Status: ${l.status}`);
  });

  const total = await prisma.license.count({ where: { teamId: team.id } });
  console.log(`\n📊 Total lisensi DGR Merchant (Fahrul Rozie) sekarang: ${total} / ${team.maxQuota}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
