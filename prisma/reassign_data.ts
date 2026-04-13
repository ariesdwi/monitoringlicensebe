import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const rawData = `1	COP		Copilot	Aditya Andrianto	ODP	THANOS	337709	Alfian Fadhil Labib	alfian.fadhil.labib@copr.bri.co.id	Available
2	COP		Copilot	Aditya Andrianto	ODP	THANOS	90185465	Muhamad Dwi Arifianto	muh.dwi.arifianto@gmail.com	Available
3	COP		Copilot	Aditya Andrianto	ODP	THANOS	90183785	Diaz Ramadhani Mahendra Djuanda	diazdjuanda@gmail.com	Available
4	COP		Copilot	Aditya Andrianto	ODP	THANOS	90184338	Ibrahim Syah Qardhawi	ibrahim.syah.q@gmail.com	Available
5	COP		Copilot	Aditya Andrianto	ODP	GROOT	90183787	Handaru Dwiki Yuntara	handarudwiki04@gmail.com	Available
6	COP		Copilot	Aditya Andrianto	ODP	GROOT	90173889	Muhammad FIkri Najib	rifik91@gmail.com	Available
7	COP		Copilot	Aditya Andrianto	ODP	GROOT	90181399	Mochamad Rizky Purnama	mochamadrizkypurnama@gmail.com	Available
8	COP		Copilot	Aditya Andrianto	ODP	GROOT	90185462	Thareq Kemal Habibie	thareq.kemal24@gmail.com	Available
9	COP		Copilot	Aditya Andrianto	ODP	GROOT	90172804	Akbar Rahmana	akbar.rahmana@gmail.com	Available
10	COP		Copilot	Aditya Andrianto	ODP	GROOT	90185467	Muhammad Hamdani	hamdanimuhammad12@gmail.com	Available
11	ESP		Copilot	Wondo	LCP-MPD/MFP-KONSUMER	MIKRO1	310286	William Rahman (SAD)		Available
12	ESP		Copilot	Wondo	LCP-MPD/MFP-KONSUMER	MIKRO1	70000880	Andika Erwansyah (BE)		Available
13	ESP		Copilot	Wondo	LCP-MPD/MFP-KONSUMER	MIKRO1	90163184	Sohibun Nawawi (Mobile)		Available
14	ESP		Copilot	Wondo	LCP-MPD/MFP-KONSUMER	MIKRO1	70002325	Lalu Ahdiyat (BE)		Available
15	ESP		Copilot	Wondo	LCP-MPD/MFP-KONSUMER	MIKRO1	70000875	M. Fizar Alfath (Web)		Available
16	ESP		Copilot	Wondo	LCP-MPD/MFP-KONSUMER	BRIGUNA-KONSUMER 2	342938	A. A. Gde Agung Aditya		Available
17	ESP		Copilot	Wondo	LCP-MPD/MFP-KONSUMER	BRIGUNA-KONSUMER 2	70000490	Putu Mas Anggita Putra		Available
18	ESP		Copilot	Wondo	LCP-MPD/MFP-KONSUMER	BRIGUNA-KONSUMER 2	70000506	Anggi Mitra Pernando		Available
19	ESP		Copilot	Wondo	LCP-MPD/MFP-KONSUMER	KONSUMER 2	70002701	Muhamad Rafli Nur Ikhsan		Available
20	ESP		Copilot	Wondo	LCP-MPD/MFP-KONSUMER	RESERVED ESP	RESERVED ESP	RESERVED ESP	RESERVED ESP	Available
21	DWP		Copilot	Dicky Firmansyah	QLP1	VICTOR	273410	Agung Nurjaya Megantara		Available
22	DWP		Copilot	Dicky Firmansyah	QLP1	VICTOR	332949	Eric Frandika		Available
23	DWP		Copilot	Dicky Firmansyah	QLP1	VICTOR	90168787	Pascal Pribadi Akhmad Panatagama		Available
24	DWP		Copilot	Dicky Firmansyah	QLP1	VICTOR	90181312	Gabriel Raymond Dimpudus		Available
25	DWP		Copilot	Dicky Firmansyah	QLP1	VICTOR	90185662	Muhammad Fahmi Rasyid		Available
26	DWP		Copilot	Dicky Firmansyah	QLP1	VICTOR	90185929	Calviano Nathanael		Available
27	DWP		Copilot	Dicky Firmansyah	QLP1	VICTOR	90186020	Fendy Asnanda Yusuf		Available
28	DWP		Copilot	Dicky Firmansyah	QLP1	ASH	90168776	Muhammad Irfan		Available
29	DWP		Copilot	Dicky Firmansyah	QLP1	ASH	310287	Nindya Savirahandayani		Available
30	DWP		Copilot	Dicky Firmansyah	QLP1	ASH	3216060307970025	Fajar Setiawan		Available
31	DGR		Copilot	Muh I Yusrifa	MBP	KYOTO-NS	332892	Abdur Rachman Wahed		Available
32	DGR		Copilot	Muh I Yusrifa	MBP	KYOTO-NS	70000302	Faisal Bahri		Available
33	DGR		Copilot	Muh I Yusrifa	MBP	KYOTO-NS	70000305	Muhammad Alwan		Available
34	DGR		Copilot	Muh I Yusrifa	MBP	KYOTO-NS	70001384	Mochammad Arie Aldiansyah		Available
35	DGR		Copilot	Muh I Yusrifa	MBP		310324	Erzy Pratama Fadryan		Available
36	DGR		Copilot	Muh I Yusrifa	MBP	RESERVED MBP	RESERVED MBP	RESERVED MBP	RESERVED MBP	Available
37	DGR		Copilot	Muh I Yusrifa	MBP	RESERVED MBP	RESERVED MBP	RESERVED MBP	RESERVED MBP	Available
38	DGR		Copilot	Muh I Yusrifa	MBP	RESERVED MBP	RESERVED MBP	RESERVED MBP	RESERVED MBP	Available
39	DGR		Copilot	Muh I Yusrifa	MBP	RESERVED MBP	RESERVED MBP	RESERVED MBP	RESERVED MBP	Available
40	DGR		Copilot	Muh I Yusrifa	MBP	MBP	RESERVED MBP	RESERVED MBP	RESERVED MBP	Available
41	MDD		Copilot	Fendy Gusta	OAP		351353	Dzulfiqar Ali A		Available
42	MDD		Copilot	Fendy Gusta	OAP		294562	Mohammad Syahrian Adil A B		Available
43	MDD		Copilot	Fendy Gusta	OAP		70002796	Muchamad Coirul Anwar		Available
44	MDD		Copilot	Fendy Gusta	OAP	RESERVED OAP	345886	Nina Aulia Saputro	RESERVED OAP	Available
45	MDD		Copilot	Fendy Gusta	OAP	RESERVED OAP	RESERVED OAP	RESERVED OAP	RESERVED OAP	Available
46	MDD		Copilot	Fendy Gusta	OAP	RESERVED OAP	361926	Dimas Aditya Maulana Fajri	dimas.aditya.maulana@corp.bri.co.id	Available
47	MDD		Copilot	Fendy Gusta	OAP	RESERVED OAP	337849	Nerisa Arviana	nerisa.arviana@brilian.bri.co.id	Available
48	MDD		Copilot	Fendy Gusta	OAP	RESERVED OAP	332986	Apriantoni	apriantoni.332986@brilian.bri.co.id	Available
49	MDD		Copilot	Fendy Gusta	OAP	RESERVED OAP	90185521	Muhamad Ilham Putra	90185521@brilian.bri.co.id	Available
50	MDD		Copilot	Fendy Gusta	OAP	RESERVED OAP	90185468	Muhammad Zada W	90185468@brilian.bri.co.id	Available
51	DWP	Qlola	Gemini	Surya Barokah	QRP	Roxanne	344629	Bayu Aditya	344629@hq.bri.co.id	success
52	DWP	Qlola	Gemini	Surya Barokah	QRP	Roxanne	361989	Indah Cikal Al Gyfari Okthaviany	361989@hq.bri.co.id	success
53	DWP	Qlola	Gemini	Surya Barokah	QRP	Roxanne	90186802	Hasbulloh Qohar	90186802@bbri.id	success
54	DWP	Qlola	Gemini	Surya Barokah	QRP	Roxanne	90181271	Azzy D'vyastia Kesuma	90181271@bbri.id	success
55	DWP	Qlola	Gemini	Surya Barokah	QRP	Roxanne	90186012	Muhammad Rizki Ramdhani	90186012@hq.bri.co.id	success
56	DWP	Qlola	Gemini	Dicky Firmansyah	QLP	SWAT-DIABLO	396351	Steven Nugroho	00396351@hq.bri.co.id	success
57	DWP	Qlola	Gemini	Dicky Firmansyah	QLP	SWAT	337924	Melanie Safira Vebriana	00337924@hq.bri.co.id	success
58	DWP	Qlola	Gemini	Dicky Firmansyah	QLP	Diablo	345845	Ishak febrianto	00345845@hq.bri.co.id	success
59	DWP	Qlola	Gemini	Dicky Firmansyah	QLP	Diablo	90186548	Zenandi Barkah Tariadi	90186548@hq.bri.co.id	success
60	DWP	Qlola	Gemini	Dicky Firmansyah	QLP	Diablo	90181028	Vernon Joseph Yeremia Tamba	90181028@hq.bri.co.id	success
61	DGR	BRIMo	Gemini	Hafidz Cahyo	MTP	Jaipur	351356	Nugroho Priambodo	00351356@hq.bri.co.id	success
62	DGR	BRIMo	Gemini	Hafidz Cahyo	MTP	TL	168770	Hafidz Cahyo Utomo	00168770@hq.bri.co.id	tidak kebagian license
63	DGR	BRIMo	Gemini	Hafidz Cahyo	MTP	Jaipur	70000989	Mohammad Rafa Adila	70000989@bbri.id	success
64	DGR	BRIMo	Gemini	Hafidz Cahyo	MTP	SWIPE	70002703	Dian Lazuardi	70002703@bbri.id	success
65	DGR	BRIMo	Gemini	Hafidz Cahyo	MTP	Dubai	70001917	Ilham Abdurrahman	70001917@bbri.id	success
66	DGR	BRIMo	Gemini	Hafidz Cahyo	MTP	Honolulu	70002815	bagas pardana	70002815@bbri.id	success
67	DGR	BRIMo	Gemini	Hafidz Cahyo	MTP	Dubai	70003249	Asrin	70003249@bbri.id	tidak kebagian license
68	DGR	BRIMo	Gemini	Hafidz Cahyo	MTP	Dubai	70002939	Rangga Leo	70002939@bbri.id	tidak kebagian license
69	COP	NDS	Gemini	Rendy M	OTP	Iron Man	345855	Rindang Tavip Supriyanto	00345855@hq.bri.co.id	success
70	COP	NDS	Gemini	Rendy M	OTP	Iron Man	90185470	Leonard Deniel Damanik	90185470@hq.bri.co.id	success
71	COP	NDS	Gemini	Rendy M	OTP	Iron Man	90185541	Nur Rizki	90185541@hq.bri.co.id	success
72	COP	NDS	Gemini	Rendy M	OTP	Iron Man	90180712	Muhammad Mahatma Arrayyan	90180712@hq.bri.co.id	success
73	COP	NDS	Gemini	Rendy M	OTP	Iron Man	90180650	Rheina Tamara	90180650@hq.bri.co.id	success
74	COP	NDS	Gemini	Adityo Andrianto	ODP	Dr Strange	90181282	Varuna Dewi	90181282@hq.bri.co.id	success
75	COP	NDS	Gemini	Adityo Andrianto	ODP	Dr Strange	90181723	Kevin Fernanda Putra	90181723@hq.bri.co.id	success
76	COP	NDS	Gemini	Adityo Andrianto	ODP	Dr Strange	90186151	Raihan Insan Kamil	90186151@hq.bri.co.id	success
77	COP	NDS	Gemini	Adityo Andrianto	ODP	Dr Strange	90185463	Muhammad Raihan Nur Rizqi Amin	90185463@hq.bri.co.id	success
78	COP	NDS	Gemini	Adityo Andrianto	ODP	Dr Strange	90168762	Aprillia Nur Azizah	90168762@hq.bri.co.id	success
79	ESP	Brispot	Gemini	Wondo	MPD	Mikro 2	324095	Muhamad Solihin	00324095@hq.bri.co.id	tidak kebagian license
80	ESP	Brispot	Gemini	Wondo	MPD	Mikro 2	90185466	Azka Zulham Amongsaufa	90171864@hq.bri.co.id	success
81	ESP	Brispot	Gemini	Wondo	MPD	Mikro 2	90185467	Farhan Agung Maulana	90175615@hq.bri.co.id	success
82	ESP	Brispot	Gemini	Wondo	MPD	Mikro 2	90185468	Muhammad Kevin Rozal	00361922@hq.bri.co.id	success
83	ESP	Brispot	Gemini	Wondo	MPD	Mikro 2	90185469	Rohman Beny Riyanto	90186784@hq.bri.co.id	success
84	ESP	Brispot	Gemini	M fariz mafazi	CFD	LAS	90185470	Gita Arifatun Nisa	00326574@hq.bri.co.id	success
85	ESP	Brispot	Gemini	M fariz mafazi	CFD	LAS	90185471	Muhammad Mukhtarul Lathief	90168778@hq.bri.co.id	success
86	ESP	Brispot	Gemini	M fariz mafazi	CFD	Funding 2	90185472	Nur Najmi Sania	00332885@hq.bri.co.id	success
87	ESP	Brispot	Gemini	M fariz mafazi	CFD	Funding 2	90185473	Ali Fatur Rohmah	90168791@hq.bri.co.id	success
88	ESP	Brispot	Gemini	M fariz mafazi	CFD	Funding 2	3603172407980006	Jiwo Kristi	3171072910010000@bbri.id	success
89	DGR	BRIMo	Gemini	Hafidz Cahyo			1872010505940013	Muhamad Ridwan		success
90	DGR	BRIMo	Gemini	Hafidz Cahyo			3276061109020001	Rangga Arsy Prawira		success
91	DGR	BRIMo	Gemini	Hafidz Cahyo			271060209030004	Farhan Wildan Nugraha		success
92	DGR	Merchant	Gemini	Fahrul Rozie	MCP	Azzuri	3.17107E+15	Muhammad Fadhly Noor Rizqi		success
93	DGR	Merchant	Gemini	Fahrul Rozie	MCP	Azzuri	1.87101E+15	Fikri Halim Chaniago		success`;

async function main() {
  console.log('🚀 Starting re-assignment seed...');

  const password = await bcrypt.hash('bri@1234', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // 1. Setup AI Tools
  console.log('⚙ Setting up AI Tools...');
  await prisma.aiTool.upsert({ where: { name: 'Gemini' }, update: {}, create: { name: 'Gemini', totalQuota: 40 } });
  await prisma.aiTool.upsert({ where: { name: 'Copilot' }, update: {}, create: { name: 'Copilot', totalQuota: 50 } });

  // 2. Setup Admin Users
  console.log('👤 Setting up Admin Users...');
  await prisma.user.upsert({
    where: { email: 'admin@corp.id' },
    update: {},
    create: { email: 'admin@corp.id', password: adminPassword, name: 'Ahmad Reza', role: 'ADMIN', initials: 'AD', title: 'Admin · TPE' }
  });
  await prisma.user.upsert({
    where: { email: 'ciso@corp.id' },
    update: {},
    create: { email: 'ciso@corp.id', password: password, name: 'Sari Dewi', role: 'CISO', initials: 'CS', title: 'CISO' }
  });
  await prisma.user.upsert({
    where: { email: 'iga@corp.id' },
    update: {},
    create: { email: 'iga@corp.id', password: password, name: 'Budi Santoso', role: 'IGA', initials: 'IG', title: 'IGA Team' }
  });

  // 3. Parse Data and Create Teams/TLs/Licenses
  const lines = rawData.split('\n');
  const teamCache = new Map<string, number>();
  const date = '2 Apr 2026';

  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 11) continue;

    const [no, dept, app, tool, tl, fungsi, squad, pn, nama, emailRaw, statusRaw] = cols;

    // 1. Normalisasi TL Name
    let tlNameNormalized = tl.trim();
    if (tlNameNormalized.toLowerCase() === 'm fariz mafazi') tlNameNormalized = 'M Fariz Mafazi';
    if (tlNameNormalized.toLowerCase() === 'muh i yusrifa') tlNameNormalized = 'Muh I Yusrifa'; // Tetap sebagai Muh I Yusrifa
    if (tlNameNormalized.toLowerCase() === 'fendy gusta') tlNameNormalized = 'Fendy Gusta';
    if (tlNameNormalized.toLowerCase() === 'surya barokah') tlNameNormalized = 'Surya Barokah';
    if (tlNameNormalized.toLowerCase() === 'dicky firmansyah') tlNameNormalized = 'Dicky Firmansyah';
    if (tlNameNormalized.toLowerCase() === 'aditya andrianto') tlNameNormalized = 'Aditya Andrianto';
    if (tlNameNormalized.toLowerCase() === 'adityo andrianto') tlNameNormalized = 'Adityo Andrianto';
    if (tlNameNormalized.toLowerCase() === 'hafidz cahyo') tlNameNormalized = 'Hafidz Cahyo';

    // 2. Tentukan Team Name secara Spesifik (sesuai screenshot)
    let teamName = '';
    const tlLower = tlNameNormalized.toLowerCase();
    
    if (tlLower.includes('aditya andrianto')) teamName = 'COP ODP';
    else if (tlLower.includes('adityo andrianto')) teamName = 'COP ODP'; 
    else if (tlLower.includes('wondo')) teamName = 'ESP MPD';
    else if (tlLower.includes('dicky firmansyah')) teamName = 'DWP QLP';
    else if (tlLower.includes('hafidz cahyo')) teamName = 'DGR MTP';
    else if (tlLower.includes('muh i yusrifa')) teamName = 'DGR MBP'; // Yusrifa punya tim sendiri

    else if (tlLower.includes('fendy gusta')) teamName = 'MDD OAP';
    else if (tlLower.includes('surya barokah')) teamName = 'DWP QRP';
    else if (tlLower.includes('rendy m')) teamName = 'COP OTP';
    else if (tlLower.includes('fariz mafazi')) teamName = 'ESP CFD';
    else if (tlLower.includes('fahrul rozie')) teamName = 'DGR MCP';
    else {
      // Fallback: Dept + Fungsi/TL
      teamName = `${dept.trim()} ${fungsi.trim() || tlNameNormalized}`.trim();
    }

    
    let teamId: number;
    if (teamCache.has(teamName)) {
      teamId = teamCache.get(teamName)!;
    } else {
      console.log(`🏢 Creating Team: ${teamName}`);
      const team = await prisma.team.upsert({
        where: { name: teamName },
        update: { maxQuota: 30 },
        create: { name: teamName, tlName: tlNameNormalized, maxQuota: 30 }
      });
      teamId = team.id;
      teamCache.set(teamName, teamId);

      // Initialize tool-specific quotas
      await prisma.teamAiToolQuota.upsert({
        where: { teamId_aiTool: { teamId, aiTool: 'Gemini' } },
        update: { maxQuota: 15 },
        create: { teamId, aiTool: 'Gemini', maxQuota: 15 }
      });
      await prisma.teamAiToolQuota.upsert({
        where: { teamId_aiTool: { teamId, aiTool: 'Copilot' } },
        update: { maxQuota: 15 },
        create: { teamId, aiTool: 'Copilot', maxQuota: 15 }
      });

      // Create TL User if doesn't exist
      const tlEmail = tlNameNormalized.toLowerCase().replace(/[^a-z0-9]/g, '.') + '@corp.id';
      await prisma.user.upsert({
        where: { email: tlEmail },
        update: {},
        create: {
          email: tlEmail,
          password: password,
          name: tlNameNormalized,
          role: 'TL',
          initials: tlNameNormalized.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
          title: `TL · ${teamName}`,
          teamId: teamId
        }
      });
    }

    // Normalisasi Email User
    let userEmail = emailRaw.trim();
    if (!userEmail || userEmail === '') {
      userEmail = nama.toLowerCase().replace(/[^a-z0-9]/g, '.') + '@corp.id';
    }

    const application = app.trim() || 'General';
    const status = statusRaw.trim();

    if (status === 'Available' || status === 'success') {
      // Create License
      await prisma.license.create({
        data: {
          userName: nama.trim(),
          email: userEmail,
          aiTool: tool.trim() || 'Gemini',
          userType: 'Internal',
          departemen: dept.trim(),
          aplikasi: application,
          squad: squad.trim() || '-',
          tlName: tlNameNormalized,
          teamId: teamId,
          status: 'DONE',
          date: date
        }
      });
    } else if (status === 'tidak kebagian license') {
      // Create Request
      await prisma.request.create({
        data: {
          userName: nama.trim(),
          email: userEmail,
          tlName: tlNameNormalized,
          teamId: teamId,
          departemen: dept.trim(),
          aplikasi: application,
          squad: squad.trim() || '-',
          date: date,
          reason: 'Auto-migrated from excess data',
          aiTool: tool.trim() || 'Gemini'
        }
      });
    }
  }

  console.log('✨ Re-assignment completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during re-assignment:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
