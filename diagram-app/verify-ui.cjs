const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1500);

  // Click Start node to see properties
  const firstNode = page.locator('.react-flow__node').first();
  await firstNode.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/ui-rounded.png' });
  console.log('screenshot saved');
  await browser.close();
})();
