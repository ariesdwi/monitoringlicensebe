import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkOrgAccess() {
  const token = process.env.GITHUB_TOKEN;
  const orgName = process.env.GITHUB_ORG;

  console.log('🔍 Attempting to access organization...\n');
  console.log(`Organization: ${orgName}`);
  console.log(`Token scopes will be checked in response headers\n`);

  try {
    // Try to access organization
    const response = await axios.get(`https://api.github.com/orgs/${orgName}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    console.log('✅ Organization accessed successfully!');
    console.log(`\nOrganization Details:`);
    console.log(`  Name: ${response.data.name || response.data.login}`);
    console.log(`  Type: ${response.data.type}`);
    console.log(`  Public repos: ${response.data.public_repos}`);
    console.log(`  Members: ${response.data.public_members}`);

    // Check response headers for SAML info
    const samlHeader = response.headers['x-saml-nameid-format'];
    if (samlHeader) {
      console.log(`\n✅ SAML detected: ${samlHeader}`);
    }
  } catch (error: any) {
    const status = error.response?.status;
    const errorMsg = error.response?.data;

    console.log(`❌ Access denied (${status})\n`);

    if (status === 403 && errorMsg?.message?.includes('SAML')) {
      console.log('📋 SAML SSO Protection Active');
      console.log('\n🔐 How to authorize token for SAML:\n');

      console.log('Method 1: Via GitHub Web UI');
      console.log(
        '✓ Go to: https://github.com/settings/personal-access-tokens',
      );
      console.log('✓ Find your token: "License-Tracking-BRI"');
      console.log('✓ Look for "SAML SSO" section (atau "Organization access")');
      console.log('✓ Click "Authorize" next to organization "bri" or "briapp"');
      console.log('\nMethod 2: GitHub might prompt during first use');
      console.log(
        '✓ Try making a request and GitHub will show SSO auth dialog',
      );
      console.log('✓ Click "Authorize" in the dialog');

      console.log('\n💡 Alternative: Use GitHub CLI');
      console.log('$ gh auth login');
      console.log('(Follow interactive prompts - easier untuk SAML)');

      console.log('\n🔗 Reference:');
      console.log(
        'https://docs.github.com/en/authentication/authenticating-with-saml-single-sign-on/authorizing-a-personal-access-token-for-use-with-saml-single-sign-on',
      );
    } else {
      console.log('Error:', errorMsg);
    }
  }
}

checkOrgAccess();
