const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  // Step 1: Load the app
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/step1-initial.png', fullPage: false });
  console.log('STEP1: initial load screenshot saved');

  // Step 2: Check toolbar is present
  const addBtn = await page.locator('button', { hasText: 'Add Box' });
  const addVisible = await addBtn.isVisible();
  console.log('STEP2: Add Box button visible =', addVisible);

  // Step 3: Check nodes are rendered (3 default nodes)
  const nodes = await page.locator('.react-flow__node').all();
  console.log('STEP3: initial node count =', nodes.length);

  // Step 4: Click Add Box
  await addBtn.click();
  await page.waitForTimeout(500);
  const nodesAfter = await page.locator('.react-flow__node').all();
  console.log('STEP4: node count after Add Box =', nodesAfter.length);
  await page.screenshot({ path: '/tmp/step4-after-add.png' });

  // Step 5: Double-click a node to edit text
  const firstNode = page.locator('.react-flow__node').first();
  await firstNode.dblclick();
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/step5-editing.png' });
  console.log('STEP5: double-click to edit done');

  // Step 6: Type new text
  await page.keyboard.type('Hello World');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/step6-after-edit.png' });
  console.log('STEP6: typed text in node');

  // Step 7: Click a node to select it, check properties panel
  await firstNode.click();
  await page.waitForTimeout(300);
  const propPanel = await page.locator('text=Box Properties').isVisible();
  console.log('STEP7: Properties panel visible on selection =', propPanel);
  await page.screenshot({ path: '/tmp/step7-properties.png' });

  // Step 8: Check edges are rendered
  const edges = await page.locator('.react-flow__edge').all();
  console.log('STEP8: initial edge count =', edges.length);

  // Step 9: Undo (Ctrl+Z)
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(300);
  const nodesAfterUndo = await page.locator('.react-flow__node').all();
  console.log('STEP9: nodes after undo =', nodesAfterUndo.length);

  // Step 10: PNG export button exists
  const pngBtn = await page.locator('button', { hasText: 'PNG' });
  console.log('STEP10: PNG export button visible =', await pngBtn.isVisible());

  await page.screenshot({ path: '/tmp/step10-final.png' });
  await browser.close();
  console.log('DONE');
})();
