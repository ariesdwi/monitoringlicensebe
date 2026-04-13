import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Seeding AI Impact reports untuk semua TL...\n');

  // Get all teams
  const teams = await prisma.team.findMany({ include: { apps: true } });
  console.log(`Found ${teams.length} teams\n`);

  // Clear existing reports
  await prisma.aiImpact.deleteMany({});
  console.log('🧹 Cleared existing AI Impact reports.\n');

  // Data reports per TL — masing-masing 2 report (2 period)
  const reports = [
    // ── DWP QRP — Surya Barokah — Qlola ──
    {
      tlName: 'Surya Barokah', squad: 'Roxanne', aplikasi: 'Qlola', aiTool: 'Gemini', period: 'Mar 2026',
      manCount: 5, daysWithAI: 12, daysWithoutAI: 25,
      sqBugs: 3, sqVulnerabilities: 0, sqCodeSmells: 18, sqCoverage: 82.5, sqDuplications: 2.1, sqRating: 'A',
      notes: 'Gemini membantu refactoring service layer',
    },
    {
      tlName: 'Surya Barokah', squad: 'Roxanne', aplikasi: 'Qlola', aiTool: 'Gemini', period: 'Apr 2026',
      manCount: 5, daysWithAI: 8, daysWithoutAI: 18,
      sqBugs: 1, sqVulnerabilities: 0, sqCodeSmells: 10, sqCoverage: 87.3, sqDuplications: 1.5, sqRating: 'A',
      notes: 'Sprint planning lebih cepat, AI assist unit test',
    },

    // ── DWP QLP — Dicky Firmansyah — Qlola ──
    {
      tlName: 'Dicky Firmansyah', squad: 'SWAT-DIABLO', aplikasi: 'Qlola', aiTool: 'Gemini', period: 'Mar 2026',
      manCount: 4, daysWithAI: 15, daysWithoutAI: 28,
      sqBugs: 5, sqVulnerabilities: 1, sqCodeSmells: 22, sqCoverage: 75.0, sqDuplications: 4.3, sqRating: 'B',
      notes: 'Claude membantu generate boilerplate, testing coverage naik',
    },
    {
      tlName: 'Dicky Firmansyah', squad: 'Diablo', aplikasi: 'Qlola', aiTool: 'Gemini', period: 'Apr 2026',
      manCount: 3, daysWithAI: 10, daysWithoutAI: 20,
      sqBugs: 2, sqVulnerabilities: 0, sqCodeSmells: 14, sqCoverage: 80.2, sqDuplications: 3.0, sqRating: 'A',
      notes: 'Migrasi module dengan bantuan Claude, code quality meningkat',
    },

    // ── DGR MTP — Hafidz Cahyo — BRIMo ──
    {
      tlName: 'Hafidz Cahyo', squad: 'Jaipur', aplikasi: 'BRIMo', aiTool: 'Gemini', period: 'Mar 2026',
      manCount: 6, daysWithAI: 14, daysWithoutAI: 30,
      sqBugs: 4, sqVulnerabilities: 2, sqCodeSmells: 25, sqCoverage: 70.8, sqDuplications: 5.1, sqRating: 'B',
      notes: 'Copilot digunakan untuk debugging dan code review',
    },
    {
      tlName: 'Hafidz Cahyo', squad: 'Jaipur', aplikasi: 'BRIMo', aiTool: 'Gemini', period: 'Apr 2026',
      manCount: 6, daysWithAI: 10, daysWithoutAI: 22,
      sqBugs: 2, sqVulnerabilities: 0, sqCodeSmells: 15, sqCoverage: 78.5, sqDuplications: 3.8, sqRating: 'A',
      notes: 'Efisiensi meningkat, Copilot membantu generate API docs',
    },

    // ── COP OTP — Rendy M — NDS ──
    {
      tlName: 'Rendy M', squad: 'Iron Man', aplikasi: 'NDS', aiTool: 'Gemini', period: 'Mar 2026',
      manCount: 5, daysWithAI: 18, daysWithoutAI: 30,
      sqBugs: 7, sqVulnerabilities: 3, sqCodeSmells: 30, sqCoverage: 65.2, sqDuplications: 6.0, sqRating: 'C',
      notes: 'Awal adopsi Kiro, masih adaptasi workflow',
    },
    {
      tlName: 'Rendy M', squad: 'Iron Man', aplikasi: 'NDS', aiTool: 'Gemini', period: 'Apr 2026',
      manCount: 5, daysWithAI: 12, daysWithoutAI: 25,
      sqBugs: 3, sqVulnerabilities: 1, sqCodeSmells: 18, sqCoverage: 74.0, sqDuplications: 4.2, sqRating: 'B',
      notes: 'Produktivitas naik setelah tim terbiasa dengan Kiro',
    },

    // ── COP ODP — Adityo Andrianto — NDS ──
    {
      tlName: 'Adityo Andrianto', squad: 'Dr Strange', aplikasi: 'NDS', aiTool: 'Gemini', period: 'Mar 2026',
      manCount: 5, daysWithAI: 13, daysWithoutAI: 24,
      sqBugs: 2, sqVulnerabilities: 0, sqCodeSmells: 12, sqCoverage: 85.0, sqDuplications: 2.0, sqRating: 'A',
      notes: 'Tim sudah terbiasa Cursor, coverage tinggi dari awal',
    },
    {
      tlName: 'Adityo Andrianto', squad: 'Dr Strange', aplikasi: 'NDS', aiTool: 'Gemini', period: 'Apr 2026',
      manCount: 5, daysWithAI: 9, daysWithoutAI: 20,
      sqBugs: 1, sqVulnerabilities: 0, sqCodeSmells: 8, sqCoverage: 90.1, sqDuplications: 1.2, sqRating: 'A',
      notes: 'Best practice AI coding dengan Cursor sudah mature',
    },

    // ── ESP MPD — Wondo — Brispot ──
    {
      tlName: 'Wondo', squad: 'Mikro 2', aplikasi: 'Brispot', aiTool: 'Gemini', period: 'Mar 2026',
      manCount: 4, daysWithAI: 16, daysWithoutAI: 28,
      sqBugs: 6, sqVulnerabilities: 2, sqCodeSmells: 20, sqCoverage: 68.0, sqDuplications: 5.5, sqRating: 'B',
      notes: 'ChatGPT assist untuk batch processing dan data migration',
    },
    {
      tlName: 'Wondo', squad: 'Mikro 2', aplikasi: 'Brispot', aiTool: 'Gemini', period: 'Apr 2026',
      manCount: 4, daysWithAI: 11, daysWithoutAI: 22,
      sqBugs: 3, sqVulnerabilities: 1, sqCodeSmells: 14, sqCoverage: 76.5, sqDuplications: 3.9, sqRating: 'B',
      notes: 'Improvement signifikan dari bulan sebelumnya',
    },

    // ── ESP CFD — M Fariz Mafazi — Brispot ──
    {
      tlName: 'M Fariz Mafazi', squad: 'LAS', aplikasi: 'Brispot', aiTool: 'Gemini', period: 'Mar 2026',
      manCount: 4, daysWithAI: 14, daysWithoutAI: 26,
      sqBugs: 4, sqVulnerabilities: 1, sqCodeSmells: 16, sqCoverage: 72.3, sqDuplications: 4.0, sqRating: 'B',
      notes: 'Gemini membantu generate test cases dan documentation',
    },
    {
      tlName: 'M Fariz Mafazi', squad: 'Funding 2', aplikasi: 'Brispot', aiTool: 'Gemini', period: 'Apr 2026',
      manCount: 5, daysWithAI: 10, daysWithoutAI: 22,
      sqBugs: 2, sqVulnerabilities: 0, sqCodeSmells: 10, sqCoverage: 81.0, sqDuplications: 2.5, sqRating: 'A',
      notes: 'Coverage naik drastis, Claude-assisted testing',
    },
  ];

  for (const r of reports) {
    // Find team by tlName
    const team = teams.find(t => t.tlName === r.tlName);
    if (!team) {
      console.log(`⚠️  Team not found for TL: ${r.tlName}, skipping...`);
      continue;
    }

    await prisma.aiImpact.create({
      data: {
        teamId: team.id,
        tlName: r.tlName,
        squad: r.squad,
        aplikasi: r.aplikasi,
        aiTool: r.aiTool,
        period: r.period,
        manCount: r.manCount,
        daysWithAI: r.daysWithAI,
        daysWithoutAI: r.daysWithoutAI,
        sqBugs: r.sqBugs,
        sqVulnerabilities: r.sqVulnerabilities,
        sqCodeSmells: r.sqCodeSmells,
        sqCoverage: r.sqCoverage,
        sqDuplications: r.sqDuplications,
        sqRating: r.sqRating,
        notes: r.notes,
      },
    });
    console.log(`  ✅ ${r.tlName} — ${r.squad} — ${r.period}`);
  }

  console.log(`\n🎉 Selesai! ${reports.length} AI Impact reports berhasil ditambahkan.`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
