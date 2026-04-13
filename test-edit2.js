const http = require('http');
// First login
const postData = JSON.stringify({ email: 'admin@corp.id', password: 'password123' });
const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const data = JSON.parse(body);
    const token = data.access_token;
    console.log("Token:", token);
    
    // Now edit
    const editData = JSON.stringify({ userType: 'Vendor' });
    const req2 = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/licenses/1/edit',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'Content-Length': editData.length
      }
    }, (res2) => {
      let body2 = '';
      res2.on('data', chunk => body2 += chunk);
      res2.on('end', () => {
        console.log("Edit status code:", res2.statusCode);
        console.log("Edit result:", body2);
      });
    });
    req2.write(editData);
    req2.end();
  });
});
req.write(postData);
req.end();
