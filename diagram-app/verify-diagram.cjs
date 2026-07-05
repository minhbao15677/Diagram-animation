const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/step1-initial.png' });
  console.log('STEP1: initial load');

  const addBtn = page.locator('button', { hasText: 'Add Box' });
  console.log('STEP2: Add Box visible =', await addBtn.isVisible());

  const nodes = await page.locator('.react-flow__node').all();
  console.log('STEP3: initial nodes =', nodes.length);

  await addBtn.click();
  await page.waitForTimeout(600);
  const nodesAfter = await page.locator('.react-flow__node').all();
  console.log('STEP4: nodes after Add Box =', nodesAfter.length);
  await page.screenshot({ path: '/tmp/step4-after-add.png' });

  // Double-click first node to edit
  const firstNode = page.locator('.react-flow__node').first();
  await firstNode.dblclick();
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/step5-editing.png' });
  console.log('STEP5: double-click to edit node');

  await page.keyboard.type(' EDITED');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/step6-after-edit.png' });
  console.log('STEP6: typed text in node');

  // Click node to select, check properties panel
  await firstNode.click();
  await page.waitForTimeout(400);
  const propVisible = await page.locator('text=Box Properties').isVisible();
  console.log('STEP7: Properties panel visible =', propVisible);
  await page.screenshot({ path: '/tmp/step7-properties.png' });

  const edges = await page.locator('.react-flow__edge').all();
  console.log('STEP8: edges count =', edges.length);

  const pngBtn = page.locator('button', { hasText: 'PNG' });
  console.log('STEP9: PNG export button =', await pngBtn.isVisible());

  // Probe: Ctrl+Z undo
  await page.keyboard.press('Escape');
  await page.keyboard.press('Meta+z');
  await page.waitForTimeout(400);
  const afterUndo = await page.locator('.react-flow__node').all();
  console.log('STEP10-PROBE: nodes after undo =', afterUndo.length);

  await page.screenshot({ path: '/tmp/step10-final.png' });
  await browser.close();
  console.log('DONE');
})();
