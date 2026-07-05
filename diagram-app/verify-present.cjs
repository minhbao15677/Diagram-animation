const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1500);

  // Enter presentation mode
  const presentBtn = page.locator('button', { hasText: 'Present' });
  await presentBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/pres-start.png' });
  console.log('presentation entered');

  // Press Next
  await page.locator('button', { hasText: 'Next' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/pres-step1.png' });
  console.log('step 1');

  await page.locator('button', { hasText: 'Next' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/pres-step2.png' });
  console.log('step 2');

  await browser.close();
})();
