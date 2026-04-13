import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Membersihkan data...');

  // Wipe data - foreign key constraints handles related deletes (sometimes), 
  // but let's delete manually to be safe
  await prisma.activity.deleteMany({});
  await prisma.history.deleteMany({});
  await prisma.request.deleteMany({});
  await prisma.license.deleteMany({});
  await prisma.teamApp.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.team.deleteMany({});

  console.log('✅ Data lama dihapus.\n');

  const password = await bcrypt.hash('bri@1234', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);
  const cisoPassword = await bcrypt.hash('ciso123', 10);
  const igaPassword = await bcrypt.hash('iga123', 10);

  // ─────────────────────────────────────────────────────────
  // ADMIN & SYSTEM ACCOUNTS
  // ─────────────────────────────────────────────────────────
  await prisma.user.createMany({
    data: [
      { email: 'admin@corp.id', password: adminPassword, name: 'Ahmad Reza', role: 'ADMIN', initials: 'AD', title: 'Admin · TPE' },
      { email: 'ciso@corp.id', password: cisoPassword, name: 'Sari Dewi', role: 'CISO', initials: 'CS', title: 'CISO' },
      { email: 'iga@corp.id', password: igaPassword, name: 'Budi Santoso', role: 'IGA', initials: 'IG', title: 'IGA Team' },
    ]
  });

  // ─────────────────────────────────────────────────────────
  // BUAT 7 TEAM (1 per TL)
  // Format nama: [Departemen] [Fungsi]
  // ─────────────────────────────────────────────────────────
  console.log('🏢 Membuat 7 tim...');

  const t1 = await prisma.team.create({ data: { name: 'DWP QRP', tlName: 'Surya Barokah',     maxQuota: 10 } });
  const t2 = await prisma.team.create({ data: { name: 'DWP QLP', tlName: 'Dicky Firmansyah',  maxQuota: 10 } });
  const t3 = await prisma.team.create({ data: { name: 'DGR MTP', tlName: 'Hafidz Cahyo',      maxQuota: 10 } });
  const t4 = await prisma.team.create({ data: { name: 'COP OTP', tlName: 'Rendy M',           maxQuota: 8  } });
  const t5 = await prisma.team.create({ data: { name: 'COP ODP', tlName: 'Adityo Andrianto',  maxQuota: 8  } });
  const t6 = await prisma.team.create({ data: { name: 'ESP MPD', tlName: 'Wondo',             maxQuota: 7  } });
  const t7 = await prisma.team.create({ data: { name: 'ESP CFD', tlName: 'M Fariz Mafazi',    maxQuota: 8  } });

  // Departemen & Aplikasi per tim
  await prisma.teamApp.createMany({
    data: [
      { teamId: t1.id, departemen: 'DWP', aplikasi: 'Qlola'   },
      { teamId: t2.id, departemen: 'DWP', aplikasi: 'Qlola'   },
      { teamId: t3.id, departemen: 'DGR', aplikasi: 'BRIMo'   },
      { teamId: t4.id, departemen: 'COP', aplikasi: 'NDS'     },
      { teamId: t5.id, departemen: 'COP', aplikasi: 'NDS'     },
      { teamId: t6.id, departemen: 'ESP', aplikasi: 'Brispot' },
      { teamId: t7.id, departemen: 'ESP', aplikasi: 'Brispot' },
    ],
  });

  console.log('✅ 7 Tim & Aplikasi berhasil dibuat.\n');

  // ─────────────────────────────────────────────────────────
  // BUAT 7 TL USER
  // ─────────────────────────────────────────────────────────
  console.log('👤 Membuat 7 akun TL...');

  await prisma.user.createMany({
    data: [
      { email: 'surya.barokah@corp.id',    password, name: 'Surya Barokah',    role: 'TL', initials: 'SB', title: 'TL · DWP QRP · Qlola',    teamId: t1.id },
      { email: 'dicky.firmansyah@corp.id', password, name: 'Dicky Firmansyah', role: 'TL', initials: 'DF', title: 'TL · DWP QLP · Qlola',    teamId: t2.id },
      { email: 'hafidz.cahyo@corp.id',     password, name: 'Hafidz Cahyo',     role: 'TL', initials: 'HC', title: 'TL · DGR MTP · BRIMo',    teamId: t3.id },
      { email: 'rendy.m@corp.id',          password, name: 'Rendy M',          role: 'TL', initials: 'RM', title: 'TL · COP OTP · NDS',      teamId: t4.id },
      { email: 'adityo.andrianto@corp.id', password, name: 'Adityo Andrianto', role: 'TL', initials: 'AA', title: 'TL · COP ODP · NDS',      teamId: t5.id },
      { email: 'wondo@corp.id',            password, name: 'Wondo',            role: 'TL', initials: 'WO', title: 'TL · ESP MPD · Brispot',   teamId: t6.id },
      { email: 'fariz.mafazi@corp.id',     password, name: 'M Fariz Mafazi',   role: 'TL', initials: 'FM', title: 'TL · ESP CFD · Brispot',   teamId: t7.id },
    ],
  });

  // ─────────────────────────────────────────────────────────
  // BUAT LISENSI
  // ─────────────────────────────────────────────────────────
  const date = '2 Apr 2026';

  console.log('📄 Membuat 35 lisensi dengan field Departemen, Aplikasi, dan Squad...\n');

  await prisma.license.createMany({ data: [
    // DWP QRP
    { userName: 'Bayu Aditya',                    email: '344629@hq.bri.co.id',    departemen: 'DWP', aplikasi: 'Qlola', squad: 'Roxanne', tlName: 'Surya Barokah',    teamId: t1.id, status: 'DONE', date },
    { userName: 'Indah Cikal Al Gyfari Okthaviany', email: '361989@hq.bri.co.id',  departemen: 'DWP', aplikasi: 'Qlola', squad: 'Roxanne', tlName: 'Surya Barokah',    teamId: t1.id, status: 'DONE', date },
    { userName: 'Hasbulloh Qohar',                email: '90186802@bbri.id',       departemen: 'DWP', aplikasi: 'Qlola', squad: 'Roxanne', tlName: 'Surya Barokah',    teamId: t1.id, status: 'DONE', date },
    { userName: "Azzy D'vyastia Kesuma",          email: '90181271@bbri.id',       departemen: 'DWP', aplikasi: 'Qlola', squad: 'Roxanne', tlName: 'Surya Barokah',    teamId: t1.id, status: 'DONE', date },
    { userName: 'Muhammad Rizki Ramdhani',        email: '90186012@hq.bri.co.id',  departemen: 'DWP', aplikasi: 'Qlola', squad: 'Roxanne', tlName: 'Surya Barokah',    teamId: t1.id, status: 'DONE', date },

    // DWP QLP
    { userName: 'Steven Nugroho',            email: '00396351@hq.bri.co.id', departemen: 'DWP', aplikasi: 'Qlola', squad: 'SWAT-DIABLO', tlName: 'Dicky Firmansyah', teamId: t2.id, status: 'DONE', date },
    { userName: 'Melanie Safira Vebriana',   email: '00337924@hq.bri.co.id', departemen: 'DWP', aplikasi: 'Qlola', squad: 'SWAT',        tlName: 'Dicky Firmansyah', teamId: t2.id, status: 'DONE', date },
    { userName: 'Ishak Febrianto',           email: '00345845@hq.bri.co.id', departemen: 'DWP', aplikasi: 'Qlola', squad: 'Diablo',      tlName: 'Dicky Firmansyah', teamId: t2.id, status: 'DONE', date },
    { userName: 'Zenandi Barkah Tariadi',    email: '90186548@hq.bri.co.id', departemen: 'DWP', aplikasi: 'Qlola', squad: 'Diablo',      tlName: 'Dicky Firmansyah', teamId: t2.id, status: 'DONE', date },
    { userName: 'Vernon Joseph Yeremia Tamba', email: '90181028@hq.bri.co.id', departemen: 'DWP', aplikasi: 'Qlola', squad: 'Diablo',      tlName: 'Dicky Firmansyah', teamId: t2.id, status: 'DONE', date },

    // DGR MTP
    { userName: 'Nugroho Priambodo',   email: '00351356@hq.bri.co.id', departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Jaipur',   tlName: 'Hafidz Cahyo', teamId: t3.id, status: 'DONE',             date },
    { userName: 'Giovanni Tjahyamulia', email: '90186062@bbri.id',     departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Jaipur',   tlName: 'Hafidz Cahyo', teamId: t3.id, status: 'ASSIGNED_TO_USER', date },
    { userName: 'Mohammad Rafa Adila', email: '70000989@bbri.id',      departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Jaipur',   tlName: 'Hafidz Cahyo', teamId: t3.id, status: 'DONE',             date },
    { userName: 'Dian Lazuardi',       email: '70002703@bbri.id',      departemen: 'DGR', aplikasi: 'BRIMo', squad: 'SWIPE',    tlName: 'Hafidz Cahyo', teamId: t3.id, status: 'DONE',             date },
    { userName: 'Ilham Abdurrahman',   email: '70001917@bbri.id',      departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Dubai',    tlName: 'Hafidz Cahyo', teamId: t3.id, status: 'DONE',             date },
    { userName: 'Bagas Pardana',       email: '70002815@bbri.id',      departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Honolulu', tlName: 'Hafidz Cahyo', teamId: t3.id, status: 'DONE',             date },
    { userName: 'Muhamad Ridwan',        email: '1872010505940013', departemen: 'DGR', aplikasi: 'BRIMo', squad: 'MTP', tlName: 'Hafidz Cahyo', teamId: t3.id, status: 'DONE', date },
    { userName: 'Rangga Arsy Prawira',   email: '3276061109020001', departemen: 'DGR', aplikasi: 'BRIMo', squad: 'MTP', tlName: 'Hafidz Cahyo', teamId: t3.id, status: 'DONE', date },
    { userName: 'Farhan Wildan Nugraha', email: '271060209030004',  departemen: 'DGR', aplikasi: 'BRIMo', squad: 'MTP', tlName: 'Hafidz Cahyo', teamId: t3.id, status: 'DONE', date },

    // COP OTP
    { userName: 'Rindang Tavip Supriyanto',   email: '00345855@hq.bri.co.id', departemen: 'COP', aplikasi: 'NDS', squad: 'Iron Man', tlName: 'Rendy M', teamId: t4.id, status: 'DONE', date },
    { userName: 'Leonard Deniel Damanik',     email: '90185470@hq.bri.co.id', departemen: 'COP', aplikasi: 'NDS', squad: 'Iron Man', tlName: 'Rendy M', teamId: t4.id, status: 'DONE', date },
    { userName: 'Nur Rizki',                  email: '90185541@hq.bri.co.id', departemen: 'COP', aplikasi: 'NDS', squad: 'Iron Man', tlName: 'Rendy M', teamId: t4.id, status: 'DONE', date },
    { userName: 'Muhammad Mahatma Arrayyan',  email: '90180712@hq.bri.co.id', departemen: 'COP', aplikasi: 'NDS', squad: 'Iron Man', tlName: 'Rendy M', teamId: t4.id, status: 'DONE', date },
    { userName: 'Rheina Tamara',              email: '90180650@hq.bri.co.id', departemen: 'COP', aplikasi: 'NDS', squad: 'Iron Man', tlName: 'Rendy M', teamId: t4.id, status: 'DONE', date },

    // COP ODP
    { userName: 'Varuna Dewi',                    email: '90181282@hq.bri.co.id', departemen: 'COP', aplikasi: 'NDS', squad: 'Dr Strange', tlName: 'Adityo Andrianto', teamId: t5.id, status: 'DONE', date },
    { userName: 'Kevin Fernanda Putra',           email: '90181723@hq.bri.co.id', departemen: 'COP', aplikasi: 'NDS', squad: 'Dr Strange', tlName: 'Adityo Andrianto', teamId: t5.id, status: 'DONE', date },
    { userName: 'Raihan Insan Kamil',             email: '90186151@hq.bri.co.id', departemen: 'COP', aplikasi: 'NDS', squad: 'Dr Strange', tlName: 'Adityo Andrianto', teamId: t5.id, status: 'DONE', date },
    { userName: 'Muhammad Raihan Nur Rizqi Amin', email: '90185463@hq.bri.co.id', departemen: 'COP', aplikasi: 'NDS', squad: 'Dr Strange', tlName: 'Adityo Andrianto', teamId: t5.id, status: 'DONE', date },
    { userName: 'Aprillia Nur Azizah',            email: '90168762@hq.bri.co.id', departemen: 'COP', aplikasi: 'NDS', squad: 'Dr Strange', tlName: 'Adityo Andrianto', teamId: t5.id, status: 'DONE', date },

    // ESP MPD
    { userName: 'Azka Zulham Amongsaufa', email: '90171864@hq.bri.co.id', departemen: 'ESP', aplikasi: 'Brispot', squad: 'Mikro 2', tlName: 'Wondo', teamId: t6.id, status: 'DONE', date },
    { userName: 'Farhan Agung Maulana',   email: '90175615@hq.bri.co.id', departemen: 'ESP', aplikasi: 'Brispot', squad: 'Mikro 2', tlName: 'Wondo', teamId: t6.id, status: 'DONE', date },
    { userName: 'Muhammad Kevin Rozal',   email: '00361922@hq.bri.co.id', departemen: 'ESP', aplikasi: 'Brispot', squad: 'Mikro 2', tlName: 'Wondo', teamId: t6.id, status: 'DONE', date },
    { userName: 'Rohman Beny Riyanto',    email: '90186784@hq.bri.co.id', departemen: 'ESP', aplikasi: 'Brispot', squad: 'Mikro 2', tlName: 'Wondo', teamId: t6.id, status: 'DONE', date },

    // ESP CFD
    { userName: 'Gita Arifatun Nisa',         email: '00326574@hq.bri.co.id',      departemen: 'ESP', aplikasi: 'Brispot', squad: 'LAS',       tlName: 'M Fariz Mafazi', teamId: t7.id, status: 'DONE', date },
    { userName: 'Muhammad Mukhtarul Lathief', email: '90168778@hq.bri.co.id',      departemen: 'ESP', aplikasi: 'Brispot', squad: 'LAS',       tlName: 'M Fariz Mafazi', teamId: t7.id, status: 'DONE', date },
    { userName: 'Nur Najmi Sania',            email: '00332885@hq.bri.co.id',      departemen: 'ESP', aplikasi: 'Brispot', squad: 'Funding 2', tlName: 'M Fariz Mafazi', teamId: t7.id, status: 'DONE', date },
    { userName: 'Ali Fatur Rohmah',           email: '90168791@hq.bri.co.id',      departemen: 'ESP', aplikasi: 'Brispot', squad: 'Funding 2', tlName: 'M Fariz Mafazi', teamId: t7.id, status: 'DONE', date },
    { userName: 'Jiwo Kristi',                email: '3171072910010000@bbri.id',   departemen: 'ESP', aplikasi: 'Brispot', squad: 'Funding 2', tlName: 'M Fariz Mafazi', teamId: t7.id, status: 'DONE', date },
  ]});

  console.log('✅ 35 Lisensi beserta Squad berhasil di-generate.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
