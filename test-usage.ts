import axios from 'axios';
require('dotenv').config();

async function run() {
  const token = process.env.GITHUB_TOKEN;
  const org = process.env.GITHUB_ORG;
  console.log(`Using token ${token?.substring(0, 5)}... org: ${org}`);
  const api = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  const urls = [
    `/orgs/${org}/copilot/usage`,
    `/orgs/${org}/copilot/metrics`,
    `/orgs/${org}/copilot/billing/usage`,
  ];

  for (const url of urls) {
    console.log(`\nTesting: ${url}`);
    try {
      const res = await api.get(url);
      console.log(`✅ 200 OK`);
      console.log(JSON.stringify(res.data).substring(0, 200) + '...');
    } catch (e: any) {
      console.log(`❌ ${e.response?.status || 'Error'}: ${e.response?.data?.message || e.message}`);
    }
  }
}

run();
