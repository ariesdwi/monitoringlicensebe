const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Login as admin
  await page.type('input[placeholder="admin@corp.id"]', 'admin@corp.id');
  await page.type('input[placeholder="Enter your password"]', 'admin123');
  await page.click('.btn-primary');
  
  await page.waitForSelector('.panel-title', { timeout: 5000 });
  
  // Go to Licenses view
  await page.evaluate(() => {
    const licensesSidebarLink = Array.from(document.querySelectorAll('.sidebar-link')).find(el => el.textContent.includes('Licenses'));
    if (licensesSidebarLink) licensesSidebarLink.click();
  });
  
  await page.waitForSelector('table', { timeout: 5000 });
  
  // Click first Edit button
  await page.evaluate(() => {
    const editBtns = Array.from(document.querySelectorAll('.act-btn')).filter(el => el.textContent.trim() === 'Edit');
    if(editBtns.length > 0) editBtns[0].click();
  });
  
  // Wait for modal
  await page.waitForSelector('#edit-usertype', { timeout: 5000 });
  
  // Change to Vendor
  await page.select('#edit-usertype', 'Vendor');
  
  // Save Changes
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.modal-actions .btn-primary'));
    if(btns.length > 0) btns[0].click();
  });
  
  // Wait for save
  await new Promise(r => setTimeout(r, 1000));
  
  await page.screenshot({ path: 'after-edit.png' });
  
  const toast = await page.evaluate(() => {
    const t = document.querySelector('.toast');
    return t ? t.textContent : null;
  });
  console.log("Toast message:", toast);
  
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(msg.text()));
  
  console.log("Console errors:", consoleMessages);
  
  await browser.close();
})();
