import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

async function debugGitHubAccess() {
  const token = process.env.GITHUB_TOKEN;
  const orgName = process.env.GITHUB_ORG;

  console.log('🔍 GitHub Access Debugging\n');
  console.log(`Organization: ${orgName}`);
  console.log(`Token: ${token?.substring(0, 20)}...`);

  try {
    // 1. Check token validity
    console.log('\n📋 1. Checking token validity...');
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    const user = userResponse.data;
    console.log(`✅ Token valid!`);
    console.log(`   Login: ${user.login}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Public repos: ${user.public_repos}`);

    // 2. Check user organizations (all memberships)
    console.log('\n📋 2. Checking all organizations...');
    const orgsResponse = await axios.get('https://api.github.com/user/orgs', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    const orgs = orgsResponse.data;
    console.log(`✅ Found ${orgs.length} organizations`);
    orgs.forEach((org: any) => {
      console.log(`   - ${org.login} (${org.type})`);
    });

    // 3. Try to access specific org
    console.log(`\n📋 3. Trying to access organization: ${orgName}...`);
    try {
      const orgDetailsResponse = await axios.get(
        `https://api.github.com/orgs/${orgName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
          },
        },
      );

      const orgDetails = orgDetailsResponse.data;
      console.log(`✅ Organization found!`);
      console.log(`   Name: ${orgDetails.name}`);
      console.log(`   Type: ${orgDetails.type}`);
      console.log(`   Members: ${orgDetails.public_members_url}`);
      console.log(`   Repos: ${orgDetails.public_repos}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`❌ Organization "${orgName}" not found (404)`);
        console.log(`\n💡 Suggestions:`);
        console.log(`   - Check the exact organization name`);
        console.log(`   - Try: BRI (uppercase)`);
        console.log(`   - Try: bri-org or bri_org`);
        console.log(
          `   - Organizations found above are: ${orgs.map((o: any) => o.login).join(', ') || 'none'}`,
        );
      } else {
        throw error;
      }
    }

    // 4. Check scopes
    console.log(`\n📋 4. Token scopes:`);
    const scopes = userResponse.headers['x-oauth-scopes']?.split(', ') || [];
    if (scopes.length > 0) {
      scopes.forEach((scope) => console.log(`   ✅ ${scope}`));
    } else {
      console.log(`   ⚠️  No scopes found (might be public-only token)`);
    }
  } catch (error: any) {
    console.error('\n❌ Error:');
    console.error(error.response?.data || error.message);
  }
}

debugGitHubAccess();
