import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

interface TestConfig {
  apiUrl: string;
  email: string;
  password: string;
  orgName: string;
  teamId: number;
}

async function fullSetupTest() {
  const config: TestConfig = {
    apiUrl: 'http://localhost:3000',
    email: 'admin@corp.id',
    password: 'admin123',
    orgName: 'briapp',
    teamId: 1,
  };

  console.log('🚀 GitHub Enterprise Setup Test\n');
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`Organization: ${config.orgName}`);
  console.log('');

  try {
    // Step 1: Assume server running (skip health check)
    console.log('✅ Assuming server is running\n');

    // Step 2: Login (using default admin credentials from seeder)
    console.log('⏳ Step 2: Logging in...');
    let jwtToken: string;
    const loginResponse = await axios.post(`${config.apiUrl}/auth/login`, {
      email: config.email,
      password: config.password,
    });

    jwtToken = loginResponse.data.access_token;
    console.log(`✅ Logged in (token: ${jwtToken.substring(0, 20)}...)\n`);

    // Step 3: Register GitHub organization
    console.log('⏳ Step 3: Registering GitHub organization...');
    const registerResponse = await axios.post(
      `${config.apiUrl}/github/organizations`,
      {
        organizationName: config.orgName,
        personalAccessToken: process.env.GITHUB_TOKEN,
        teamId: config.teamId,
        enterpriseSlug: 'bri',
      },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      },
    );

    const orgId = registerResponse.data.data.id;
    console.log(`✅ Organization registered (ID: ${orgId})\n`);

    // Step 4: Sync data
    console.log(`⏳ Step 4: Syncing organization data...`);
    await axios.post(
      `${config.apiUrl}/github/organizations/${orgId}/sync/full`,
      {},
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      },
    );
    console.log('✅ Data synced\n');

    // Step 5: Get organization info
    console.log(`⏳ Step 5: Fetching organization info...`);
    const infoResponse = await axios.get(
      `${config.apiUrl}/github/organizations/${orgId}`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      },
    );

    const orgInfo = infoResponse.data.data;
    console.log('✅ Organization Info:');
    console.log(`   Name: ${orgInfo.organizationName}`);
    console.log(`   Total Members: ${orgInfo.totalMembers}`);
    console.log(`   Members with Copilot: ${orgInfo.membersWithCopilot}`);
    if (orgInfo.currentSeatUsage) {
      console.log(`   Total Seats: ${orgInfo.currentSeatUsage.totalSeats}`);
      console.log(`   Active Seats: ${orgInfo.currentSeatUsage.activeSeats}`);
    }
    console.log('');

    console.log('✨ Setup completed successfully!\n');
    console.log('🎯 Next steps:');
    console.log(`1. Visit Dashboard: ${config.apiUrl}/dashboard`);
    console.log(`2. API Docs: ${config.apiUrl}/api`);
    console.log(`3. Organization ID for future use: ${orgId}`);
  } catch (error: any) {
    console.error('\n❌ Setup failed!');
    console.error(`Error: ${error.message}`);

    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }

    process.exit(1);
  }
}

fullSetupTest();
