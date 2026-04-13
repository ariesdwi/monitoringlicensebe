import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 DATA CLEANSING: Membersihkan seluruh data lama...');

  await prisma.activity.deleteMany({});
  await prisma.history.deleteMany({});
  await prisma.request.deleteMany({});
  await prisma.teamAiToolQuota.deleteMany({});
  await prisma.aiImpact.deleteMany({});
  await prisma.license.deleteMany({});
  await prisma.teamApp.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.aiTool.deleteMany({});

  console.log('✅ Data lama dihapus.\n');

  const password = await bcrypt.hash('bri@1234', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // ─────────────────────────────────────────────────────────
  // ADMIN & SYSTEM ACCOUNTS
  // ─────────────────────────────────────────────────────────
  await prisma.user.createMany({
    data: [
      { email: 'admin@corp.id', password: adminPassword, name: 'Ahmad Reza', role: 'ADMIN', initials: 'AD', title: 'Admin · TPE' },
      { email: 'ciso@corp.id', password: password, name: 'Sari Dewi', role: 'CISO', initials: 'CS', title: 'CISO' },
      { email: 'iga@corp.id', password: password, name: 'Budi Santoso', role: 'IGA', initials: 'IG', title: 'IGA Team' },
    ]
  });

  // ─────────────────────────────────────────────────────────
  // AI TOOLS CONFIG (STANDARDIZED)
  // ─────────────────────────────────────────────────────────
  console.log('⚙ Konfigurasi AI Tools (Gemini 40, Copilot 50)...');
  await prisma.aiTool.createMany({
    data: [
      { name: 'Gemini', totalQuota: 40 },
      { name: 'Copilot', totalQuota: 50 },
    ]
  });

  // ─────────────────────────────────────────────────────────
  // BUAT 8 TEAM (CLEANSED)
  // ─────────────────────────────────────────────────────────
  console.log('🏢 Membuat 8 tim standar...');

  const t1 = await prisma.team.create({ data: { name: 'DWP QRP', tlName: 'Surya Barokah',     maxQuota: 10 } });
  const t2 = await prisma.team.create({ data: { name: 'DWP QLP', tlName: 'Dicky Firmansyah',  maxQuota: 20 } });
  const t3 = await prisma.team.create({ data: { name: 'DGR MTP', tlName: 'Hafidz Cahyo',      maxQuota: 20 } });
  const t4 = await prisma.team.create({ data: { name: 'COP OTP', tlName: 'Rendy M',           maxQuota: 10 } });
  const t5 = await prisma.team.create({ data: { name: 'COP ODP', tlName: 'Adityo Andrianto',  maxQuota: 25 } });
  const t6 = await prisma.team.create({ data: { name: 'ESP MPD', tlName: 'Wondo',             maxQuota: 20 } });
  const t7 = await prisma.team.create({ data: { name: 'ESP CFD', tlName: 'M Fariz Mafazi',    maxQuota: 12 } });
  const t8 = await prisma.team.create({ data: { name: 'DGR Merchant', tlName: 'Fahrul Rozie', maxQuota: 10 } });

  // ─────────────────────────────────────────────────────────
  // ALOKASI QUOTA PER TOOL (CLEANSED)
  // ─────────────────────────────────────────────────────────
  console.log('📊 Alokasi Kuota Spesifik (Dicky & Adityo: Gemini 5, Copilot 10)...');
  await prisma.teamAiToolQuota.createMany({
    data: [
      { teamId: t2.id, aiTool: 'Gemini', maxQuota: 5 },
      { teamId: t2.id, aiTool: 'Copilot', maxQuota: 10 },
      { teamId: t5.id, aiTool: 'Gemini', maxQuota: 5 },
      { teamId: t5.id, aiTool: 'Copilot', maxQuota: 15 }, // Adjusted for 25 total
    ]
  });

  // TL User Accounts
  await prisma.user.createMany({
    data: [
      { email: 'surya.barokah@corp.id',    password, name: 'Surya Barokah',    role: 'TL', initials: 'SB', title: 'TL · DWP QRP',    teamId: t1.id },
      { email: 'dicky.firmansyah@corp.id', password, name: 'Dicky Firmansyah', role: 'TL', initials: 'DF', title: 'TL · DWP QLP',    teamId: t2.id },
      { email: 'hafidz.cahyo@corp.id',     password, name: 'Hafidz Cahyo',     role: 'TL', initials: 'HC', title: 'TL · DGR MTP',    teamId: t3.id },
      { email: 'rendy.m@corp.id',          password, name: 'Rendy M',          role: 'TL', initials: 'RM', title: 'TL · COP OTP',    teamId: t4.id },
      { email: 'adityo.andrianto@corp.id', password, name: 'Adityo Andrianto', role: 'TL', initials: 'AA', title: 'TL · COP ODP',    teamId: t5.id },
      { email: 'wondo@corp.id',            password, name: 'Wondo',            role: 'TL', initials: 'WO', title: 'TL · ESP MPD',    teamId: t6.id },
      { email: 'fariz.mafazi@corp.id',     password, name: 'M Fariz Mafazi',   role: 'TL', initials: 'FM', title: 'TL · ESP CFD',    teamId: t7.id },
      { email: 'fahrul.rozie@corp.id',     password, name: 'Fahrul Rozie',     role: 'TL', initials: 'FR', title: 'TL · DGR Merchant', teamId: t8.id },
    ],
  });

  // App Names Standard
  await prisma.teamApp.createMany({
    data: [
      { teamId: t1.id, departemen: 'DWP', aplikasi: 'Qlola' },
      { teamId: t2.id, departemen: 'DWP', aplikasi: 'Qlola' },
      { teamId: t3.id, departemen: 'DGR', aplikasi: 'BRIMo' },
      { teamId: t4.id, departemen: 'COP', aplikasi: 'NDS' },
      { teamId: t5.id, departemen: 'COP', aplikasi: 'NDS' },
      { teamId: t6.id, departemen: 'ESP', aplikasi: 'Brispot' },
      { teamId: t7.id, departemen: 'ESP', aplikasi: 'Brispot' },
      { teamId: t8.id, departemen: 'DGR', aplikasi: 'Merchant' },
    ]
  });

  // ─────────────────────────────────────────────────────────
  // CLEANSING FUNCTIONS
  // ─────────────────────────────────────────────────────────
  const date = '2 Apr 2026';
  
  const cleanseLicense = (l: any) => {
    // 1. Normalize TL Names
    if (l.tlName === 'Aditya Andrianto') l.tlName = 'Adityo Andrianto';
    if (l.tlName === 'Muh I Yusrifa') l.tlName = 'Hafidz Cahyo';
    if (l.tlName === 'Fendy Gusta') l.tlName = 'Fahrul Rozie';

    // 2. Map to Team ID
    const tm: Record<string, number> = {
      'Surya Barokah': t1.id,
      'Dicky Firmansyah': t2.id,
      'Hafidz Cahyo': t3.id,
      'Rendy M': t4.id,
      'Adityo Andrianto': t5.id,
      'Wondo': t6.id,
      'M Fariz Mafazi': t7.id,
      'Fahrul Rozie': t8.id
    };
    l.teamId = tm[l.tlName] || t1.id;

    // 3. Clean Names
    const isReserved = l.userName.toUpperCase().includes('RESERVED');
    if (isReserved) {
      l.userName = 'RESERVED SLOT';
      l.status = 'AVAILABLE';
      if (!l.email || l.email.includes('reserved') || l.email === '') {
         l.email = `reserved.${Math.random().toString(36).substring(7)}@corp.id`;
      }
    } else {
      l.status = l.status || 'DONE';
    }

    // 4. Auto-email
    if (!l.email || l.email.trim() === '') {
      l.email = l.userName.toLowerCase().replace(/[^a-z0-9]/g, '.') + '@corp.id';
    }

    // 5. Standard Applications
    if (l.aiTool === 'Copilot' || l.aplikasi === 'Copilot AI') {
      l.aplikasi = 'Copilot';
      l.aiTool = 'Copilot';
    } else {
      l.aiTool = l.aiTool || 'Gemini';
    }

    return l;
  };

  // ─────────────────────────────────────────────────────────
  // LISENSI DATA (INPUT ARRAYS)
  // ─────────────────────────────────────────────────────────
  console.log('📄 Processing & Cleansing Licenses...');

  const rawGemini = [
    // Base 35
    { userName: 'Bayu Aditya', email: '344629@hq.bri.co.id', departemen: 'DWP', aplikasi: 'Qlola', squad: 'Roxanne', tlName: 'Surya Barokah' },
    { userName: 'Indah Cikal Al Gyfari Okthaviany', email: '361989@hq.bri.co.id', departemen: 'DWP', aplikasi: 'Qlola', squad: 'Roxanne', tlName: 'Surya Barokah' },
    { userName: 'Hasbulloh Qohar', email: '90186802@bbri.id', departemen: 'DWP', aplikasi: 'Qlola', squad: 'Roxanne', tlName: 'Surya Barokah' },
    { userName: "Azzy D'vyastia Kesuma", email: '90181271@bbri.id', departemen: 'DWP', aplikasi: 'Qlola', squad: 'Roxanne', tlName: 'Surya Barokah' },
    { userName: 'Muhammad Rizki Ramdhani', email: '90186012@hq.bri.co.id', departemen: 'DWP', aplikasi: 'Qlola', squad: 'Roxanne', tlName: 'Surya Barokah' },

    { userName: 'Steven Nugroho', email: '00396351@hq.bri.co.id', departemen: 'DWP', aplikasi: 'Qlola', squad: 'SWAT-DIABLO', tlName: 'Dicky Firmansyah' },
    { userName: 'Melanie Safira Vebriana', email: '00337924@hq.bri.co.id', departemen: 'DWP', aplikasi: 'Qlola', squad: 'SWAT', tlName: 'Dicky Firmansyah' },
    { userName: 'Ishak Febrianto', email: '00345845@hq.bri.co.id', departemen: 'DWP', aplikasi: 'Qlola', squad: 'Diablo', tlName: 'Dicky Firmansyah' },
    { userName: 'Zenandi Barkah Tariadi', email: '90186548@hq.bri.co.id', departemen: 'DWP', aplikasi: 'Qlola', squad: 'Diablo', tlName: 'Dicky Firmansyah' },
    { userName: 'Vernon Joseph Yeremia Tamba', email: '90181028@hq.bri.co.id', departemen: 'DWP', aplikasi: 'Qlola', squad: 'Diablo', tlName: 'Dicky Firmansyah' },

    { userName: 'Nugroho Priambodo', email: '00351356@hq.bri.co.id', departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Jaipur', tlName: 'Hafidz Cahyo' },
    { userName: 'Giovanni Tjahyamulia', email: '90186062@bbri.id', departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Jaipur', tlName: 'Hafidz Cahyo', status: 'ASSIGNED_TO_USER' },
    { userName: 'Mohammad Rafa Adila', email: '70000989@bbri.id', departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Jaipur', tlName: 'Hafidz Cahyo' },
    { userName: 'Dian Lazuardi', email: '70002703@bbri.id', departemen: 'DGR', aplikasi: 'BRIMo', squad: 'SWIPE', tlName: 'Hafidz Cahyo' },
    { userName: 'Ilham Abdurrahman', email: '70001917@bbri.id', departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Dubai', tlName: 'Hafidz Cahyo' },
    { userName: 'Bagas Pardana', email: '70002815@bbri.id', departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Honolulu', tlName: 'Hafidz Cahyo' },
    { userName: 'Muhamad Ridwan', email: '1872010505940013@bbri.id', departemen: 'DGR', aplikasi: 'BRIMo', squad: 'MTP', tlName: 'Hafidz Cahyo' },
    { userName: 'Rangga Arsy Prawira', email: '3276061109020001@bbri.id', departemen: 'DGR', aplikasi: 'BRIMo', squad: 'MTP', tlName: 'Hafidz Cahyo' },
    { userName: 'Farhan Wildan Nugraha', email: '271060209030004@bbri.id', departemen: 'DGR', aplikasi: 'BRIMo', squad: 'MTP', tlName: 'Hafidz Cahyo' },

    { userName: 'Varuna Dewi', email: '90181282@hq.bri.co.id', departemen: 'COP', aplikasi: 'NDS', squad: 'Dr Strange', tlName: 'Adityo Andrianto' },
    { userName: 'Kevin Fernanda Putra', email: '90181723@hq.bri.co.id', departemen: 'COP', aplikasi: 'NDS', squad: 'Dr Strange', tlName: 'Adityo Andrianto' },
    { userName: 'Raihan Insan Kamil', email: '90186151@hq.bri.co.id', departemen: 'COP', aplikasi: 'NDS', squad: 'Dr Strange', tlName: 'Adityo Andrianto' },
    { userName: 'Muhammad Raihan Nur Rizqi Amin', email: '90185463@hq.bri.co.id', departemen: 'COP', aplikasi: 'NDS', squad: 'Dr Strange', tlName: 'Adityo Andrianto' },
    { userName: 'Aprillia Nur Azizah', email: '90168762@hq.bri.co.id', departemen: 'COP', aplikasi: 'NDS', squad: 'Dr Strange', tlName: 'Adityo Andrianto' },

    { userName: 'Azka Zulham Amongsaufa', email: '90171864@hq.bri.co.id', departemen: 'ESP', aplikasi: 'Brispot', squad: 'Mikro 2', tlName: 'Wondo' },
    { userName: 'Farhan Agung Maulana', email: '90175615@hq.bri.co.id', departemen: 'ESP', aplikasi: 'Brispot', squad: 'Mikro 2', tlName: 'Wondo' },
    { userName: 'Muhammad Kevin Rozal', email: '00361922@hq.bri.co.id', departemen: 'ESP', aplikasi: 'Brispot', squad: 'Mikro 2', tlName: 'Wondo' },
    { userName: 'Rohman Beny Riyanto', email: '90186784@hq.bri.co.id', departemen: 'ESP', aplikasi: 'Brispot', squad: 'Mikro 2', tlName: 'Wondo' },
    { userName: 'Rizwan F.', email: '90181234@hq.bri.co.id', departemen: 'ESP', aplikasi: 'Brispot', squad: 'Mikro 2', tlName: 'Wondo' },

    { userName: 'Gita Arifatun Nisa', email: '00326574@hq.bri.co.id', departemen: 'ESP', aplikasi: 'Brispot', squad: 'LAS', tlName: 'M Fariz Mafazi' },
    { userName: 'Muhammad Mukhtarul Lathief', email: '90168778@hq.bri.co.id', departemen: 'ESP', aplikasi: 'Brispot', squad: 'LAS', tlName: 'M Fariz Mafazi' },
    { userName: 'Nur Najmi Sania', email: '00332885@hq.bri.co.id', departemen: 'ESP', aplikasi: 'Brispot', squad: 'Funding 2', tlName: 'M Fariz Mafazi' },
    { userName: 'Ali Fatur Rohmah', email: '90168791@hq.bri.co.id', departemen: 'ESP', aplikasi: 'Brispot', squad: 'Funding 2', tlName: 'M Fariz Mafazi' },
    { userName: 'Jiwo Kristi', email: '3171072910010000@bbri.id', departemen: 'ESP', aplikasi: 'Brispot', squad: 'Funding 2', tlName: 'M Fariz Mafazi' },

    { userName: 'Muhammad Fadhly Noor Rizqi', email: '3171072910010000@bbri.id', departemen: 'DGR', aplikasi: 'Merchant', squad: 'MCP Azzuri', tlName: 'Fahrul Rozie' },
    { userName: 'Fikri Halim Chaniago', email: '1871012702990000@bbri.id', departemen: 'DGR', aplikasi: 'Merchant', squad: 'MCP Azzuri', tlName: 'Fahrul Rozie' },
  ];

  const rawCopilot = [
    "Rindang Tavip Supriyanto\t00345855@hq.bri.co.id\tRendy M\tCOP\tNDS\tIron Man",
    "Leonard Deniel Damanik\t90185470@hq.bri.co.id\tRendy M\tCOP\tNDS\tIron Man",
    "Nur Rizki\t90185541@hq.bri.co.id\tRendy M\tCOP\tNDS\tIron Man",
    "Muhammad Mahatma Arrayyan\t90180712@hq.bri.co.id\tRendy M\tCOP\tNDS\tIron Man",
    "Rheina Tamara\t90180650@hq.bri.co.id\tRendy M\tCOP\tNDS\tIron Man",
    "Alfian Fadhil Labib\talfian.fadhil.labib@copr.bri.co.id\tAditya Andrianto\tCOP\tODP\tTHANOS",
    "Muhamad Dwi Arifianto\tmuh.dwi.arifianto@gmail.com\tAditya Andrianto\tCOP\tODP\tTHANOS",
    "Diaz Ramadhani Mahendra Djuanda\tdiazdjuanda@gmail.com\tAditya Andrianto\tCOP\tODP\tTHANOS",
    "Ibrahim Syah Qardhawi\tibrahim.syah.q@gmail.com\tAditya Andrianto\tCOP\tODP\tTHANOS",
    "Handaru Dwiki Yuntara\thandarudwiki04@gmail.com\tAditya Andrianto\tCOP\tODP\tGROOT",
    "Muhammad FIkri Najib\trifik91@gmail.com\tAditya Andrianto\tCOP\tODP\tGROOT",
    "Mochamad Rizky Purnama\tmochamadrizkypurnama@gmail.com\tAditya Andrianto\tCOP\tODP\tGROOT",
    "Thareq Kemal Habibie\tthareq.kemal24@gmail.com\tAditya Andrianto\tCOP\tODP\tGROOT",
    "Akbar Rahmana\takbar.rahmana@gmail.com\tAditya Andrianto\tCOP\tODP\tGROOT",
    "Muhammad Hamdani\thamdanimuhammad12@gmail.com\tAditya Andrianto\tCOP\tODP\tGROOT",
    "William Rahman (SAD)\t\tWondo\tESP\tLCP-MPD\tMIKRO1",
    "Andika Erwansyah (BE)\t\tWondo\tESP\tLCP-MPD\tMIKRO1",
    "Sohibun Nawawi (Mobile)\t\tWondo\tESP\tLCP-MPD\tMIKRO1",
    "Lalu Ahdiyat (BE)\t\tWondo\tESP\tLCP-MPD\tMIKRO1",
    "M. Fizar Alfath (Web)\t\tWondo\tESP\tLCP-MPD\tMIKRO1",
    "A. A. Gde Agung Aditya\t\tWondo\tESP\tLCP-MPD\tBRIGUNA-KONSUMER 2",
    "Putu Mas Anggita Putra\t\tWondo\tESP\tLCP-MPD\tBRIGUNA-KONSUMER 2",
    "Anggi Mitra Pernando\t\tWondo\tESP\tLCP-MPD\tBRIGUNA-KONSUMER 2",
    "Muhamad Rafli Nur Ikhsan\t\tWondo\tESP\tLCP-MPD\tKONSUMER 2",
    "RESERVED ESP\t\tWondo\tESP\tLCP-MPD\tRESERVED ESP",
    "Agung Nurjaya Megantara\t\tDicky Firmansyah\tDWP\tQLP1\tVICTOR",
    "Eric Frandika\t\tDicky Firmansyah\tDWP\tQLP1\tVICTOR",
    "Pascal Pribadi Akhmad Panatagama\t\tDicky Firmansyah\tDWP\tQLP1\tVICTOR",
    "Gabriel Raymond Dimpudus\t\tDicky Firmansyah\tDWP\tQLP1\tVICTOR",
    "Muhammad Fahmi Rasyid\t\tDicky Firmansyah\tDWP\tQLP1\tVICTOR",
    "Calviano Nathanael\t\tDicky Firmansyah\tDWP\tQLP1\tVICTOR",
    "Fendy Asnanda Yusuf\t\tDicky Firmansyah\tDWP\tQLP1\tVICTOR",
    "Muhammad Irfan\t\tDicky Firmansyah\tDWP\tQLP1\tASH",
    "Nindya Savirahandayani\t\tDicky Firmansyah\tDWP\tQLP1\tASH",
    "Fajar Setiawan\t\tDicky Firmansyah\tDWP\tQLP1\tASH",
    "Abdur Rachman Wahed\t\tMuh I Yusrifa\tDGR\tMBP\tKYOTO-NS",
    "Faisal Bahri\t\tMuh I Yusrifa\tDGR\tMBP\tKYOTO-NS",
    "Muhammad Alwan\t\tMuh I Yusrifa\tDGR\tMBP\tKYOTO-NS",
    "Mochammad Arie Aldiansyah\t\tMuh I Yusrifa\tDGR\tMBP\tKYOTO-NS",
    "Erzy Pratama Fadryan\t\tMuh I Yusrifa\tDGR\tMBP\t",
    "RESERVED MBP 1\t\tMuh I Yusrifa\tDGR\tMBP\tRESERVED MBP",
    "RESERVED MBP 2\t\tMuh I Yusrifa\tDGR\tMBP\tRESERVED MBP",
    "RESERVED MBP 3\t\tMuh I Yusrifa\tDGR\tMBP\tRESERVED MBP",
    "RESERVED MBP 4\t\tMuh I Yusrifa\tDGR\tMBP\tRESERVED MBP",
    "RESERVED MBP 5\t\tMuh I Yusrifa\tDGR\tMBP\tMBP",
    "Dzulfiqar Ali A\t\tFendy Gusta\tMDD\tOAP\t",
    "Mohammad Syahrian Adil A B\t\tFendy Gusta\tMDD\tOAP\t",
    "Muchamad Coirul Anwar\t\tFendy Gusta\tMDD\tOAP\t",
    "Nina Aulia Saputro\t\tFendy Gusta\tMDD\tOAP\tRESERVED OAP",
    "Dimas Aditya Maulana Fajri\t\tFendy Gusta\tMDD\tOAP\tRESERVED OAP"
  ];

  const processedLicenses: any[] = [];

  // Data Gemini
  rawGemini.forEach(l => {
    processedLicenses.push(cleanseLicense({ ...l, aiTool: 'Gemini', date }));
  });

  // Data Copilot
  rawCopilot.forEach(raw => {
    const parts = raw.split('\t');
    processedLicenses.push(cleanseLicense({
      userName: parts[0],
      email: parts[1],
      tlName: parts[2],
      departemen: parts[3],
      aplikasi: parts[4],
      squad: parts[5],
      aiTool: 'Copilot',
      date
    }));
  });

  await prisma.license.createMany({ data: processedLicenses });

  console.log(`✨ CLEANSING SELESAI: ${processedLicenses.length} lisensi telah distandarisasi.`);
  console.log('🎉 Database Rapi & Siap Digunakan!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
