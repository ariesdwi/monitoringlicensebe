async function run() {
  const loginRes = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@corp.id', password: 'admin123' })
  });
  const data = await loginRes.json();
  const token = data.access_token;
  console.log("Token:", token.substring(0, 10));

  const editRes = await fetch('http://localhost:3001/licenses/1/edit', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ userType: 'Vendor' })
  });
  console.log("Edit Status:", editRes.status);
  console.log("Edit Body:", await editRes.text());
}
run();
