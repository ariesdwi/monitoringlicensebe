import axios from 'axios';

const token = process.env.GITHUB_TOKEN || '';
const org = process.env.GITHUB_ORG || 'briapp';

async function testNewToken() {
  console.log('🔐 Testing new GitHub token...\n');
  console.log(`Token: ${token.substring(0, 15)}...`);
  console.log(`Organization: ${org}\n`);

  try {
    // Test 1: Token validity
    console.log('⏳ Test 1: Checking token validity...');
    const userRes = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        Accept: 'application/vnd.github+json',
      },
      timeout: 5000,
    });

    console.log(`✅ Token valid! User: ${userRes.data.login}`);
    console.log(`   Scopes: ${userRes.headers['x-oauth-scopes'] || 'N/A'}\n`);

    // Test 2: Organization access
    console.log(`⏳ Test 2: Checking access to organization '${org}'...`);
    const orgRes = await axios.get(`https://api.github.com/orgs/${org}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        Accept: 'application/vnd.github+json',
      },
      timeout: 5000,
    });

    console.log(`✅ Organization accessible!`);
    console.log(`   Name: ${orgRes.data.name}`);
    console.log(`   Type: ${orgRes.data.type}`);
    console.log(`   Members: ${orgRes.data.public_members_count}\n`);

    // Test 3: Members listing
    console.log('⏳ Test 3: Fetching members...');
    const membersRes = await axios.get(
      `https://api.github.com/orgs/${org}/members`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          Accept: 'application/vnd.github+json',
        },
        params: { per_page: 5 },
        timeout: 5000,
      },
    );

    console.log(`✅ Members fetched! Total page: ${membersRes.data.length}`);
    membersRes.data.slice(0, 3).forEach((member: any) => {
      console.log(`   - ${member.login}`);
    });

    console.log('\n🎉 All tests passed! Token is working!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
    if (error.response?.status === 403) {
      console.error(
        '\n⚠️  Still SAML protected. Check if token is authorized for org.',
      );
    }
  }
}

testNewToken();
