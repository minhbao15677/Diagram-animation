const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1500);

  // Click "Start" node to select
  const nodes = page.locator('.react-flow__node');
  await nodes.first().click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/order-panel.png' });
  console.log('properties panel with order input');

  // Set presentation order = 1 for Start node
  const orderInput = page.locator('input[type="number"]').first();
  await orderInput.fill('1');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/order-badge.png' });
  console.log('badge should appear');

  await browser.close();
})();
