import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const token = process.env.GITHUB_TOKEN || '';
const enterprise = process.env.GITHUB_ENTERPRISE_SLUG || 'bri';

async function importEnterpriseMembers() {
  console.log('🚀 Importing GitHub Enterprise members...\n');

  try {
    // Fetch from enterprise endpoint
    console.log(`⏳ Fetching members from enterprise '${enterprise}'...`);
    const response = await axios.get(
      `https://api.github.com/enterprises/${enterprise}/consumed-licenses`,
      {
        headers: {
          Authorization: `token ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          Accept: 'application/vnd.github+json',
        },
        timeout: 10000,
      },
    );

    const data = response.data;
    console.log(`✅ Fetched ${data.users.length} members\n`);

    // First, create org if not exists
    console.log(`📌 Ensuring organization 'briapp' exists in database...`);
    let org = await prisma.gitHubOrganization.findUnique({
      where: { organizationName: 'briapp' },
    });

    if (!org) {
      // Get first team for FK
      const firstTeam = await prisma.team.findFirst();

      if (!firstTeam) {
        console.error('❌ No team exists in database. Create a team first.');
        process.exit(1);
      }

      org = await prisma.gitHubOrganization.create({
        data: {
          organizationName: 'briapp',
          personalAccessToken: token,
          enterpriseSlug: enterprise,
          teamId: firstTeam.id,
        },
      });
      console.log(
        `✅ Organization created (ID: ${org.id}, Team: ${firstTeam.id})\n`,
      );
    } else {
      console.log(`✅ Organization exists (ID: ${org.id})\n`);
    }

    // Import members
    console.log(`⏳ Importing ${data.users.length} members...\n`);
    let created = 0;
    let updated = 0;

    for (let idx = 0; idx < data.users.length; idx++) {
      const user = data.users[idx];
      const memberRole =
        user.github_com_member_roles?.[0]?.split(':')[1] || 'member';
      const hasCopilot = user.license_type === 'Enterprise';
      // Generate unique ID based on index to avoid collisions
      const githubId = 1000000 + idx;

      try {
        const member = await prisma.gitHubMember.upsert({
          where: {
            organizationId_githubLogin: {
              organizationId: org.id,
              githubLogin: user.github_com_login,
            },
          },
          create: {
            organizationId: org.id,
            githubLogin: user.github_com_login,
            githubId: githubId,
            name: user.github_com_name,
            role: memberRole.toLowerCase(),
            hasCopilotLicense: hasCopilot,
            isActive: true,
          },
          update: {
            name: user.github_com_name,
            role: memberRole.toLowerCase(),
            hasCopilotLicense: hasCopilot,
            isActive: true,
            lastActivityAt: new Date(),
          },
        });

        created++;
        console.log(
          `   ✓ ${user.github_com_login} (${memberRole}, ID: ${githubId})`,
        );
      } catch (err: any) {
        if (err.code === 'P2002' && err.meta?.target?.includes('githubId')) {
          // Try with sequential ID if hash collision
          const altId = 2000000 + idx;
          try {
            await prisma.gitHubMember.upsert({
              where: {
                organizationId_githubLogin: {
                  organizationId: org.id,
                  githubLogin: user.github_com_login,
                },
              },
              create: {
                organizationId: org.id,
                githubLogin: user.github_com_login,
                githubId: altId,
                name: user.github_com_name,
                role: memberRole.toLowerCase(),
                hasCopilotLicense: hasCopilot,
                isActive: true,
              },
              update: {
                name: user.github_com_name,
                role: memberRole.toLowerCase(),
                hasCopilotLicense: hasCopilot,
                isActive: true,
                lastActivityAt: new Date(),
              },
            });
            created++;
            console.log(
              `   ✓ ${user.github_com_login} (${memberRole}, alt ID: ${altId})`,
            );
          } catch (altErr: any) {
            console.error(
              `   ✗ Error importing ${user.github_com_login}: ${altErr.message}`,
            );
          }
        } else {
          console.error(
            `   ✗ Error importing ${user.github_com_login}: ${err.message}`,
          );
        }
      }
    }

    console.log(`\n✅ Import completed!`);
    console.log(`   Total processed: ${data.users.length}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Organization: briapp`);
    console.log(`   Members: ${data.users.length}`);
    console.log(`   Seats consumed: ${data.total_seats_consumed}`);
    console.log(`   Seats purchased: ${data.total_seats_purchased}`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response?.data?.message) {
      console.error('Response:', error.response.data.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importEnterpriseMembers();
