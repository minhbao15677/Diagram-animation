import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });
await page.goto('http://localhost:5173/');
await page.waitForTimeout(2000);

// Get node positions
const node1Box = await page.locator('[data-id="node-1"]').boundingBox();
const node3Box = await page.locator('[data-id="node-3"]').boundingBox();
console.log('node-1:', JSON.stringify(node1Box));
console.log('node-3:', JSON.stringify(node3Box));

// Hover over node-1 to show handles
await page.mouse.move(node1Box.x + node1Box.width/2, node1Box.y + node1Box.height/2);
await page.waitForTimeout(500);

// Check handle visibility
const handles = await page.$$('.react-flow__handle');
console.log('Total handles:', handles.length);
for (const h of handles) {
  const box = await h.boundingBox();
  const opacity = await h.evaluate(el => window.getComputedStyle(el).opacity);
  console.log('Handle box:', JSON.stringify(box), 'opacity:', opacity);
}

// Take screenshot with handles visible
await page.screenshot({ path: '/tmp/diagram-hover-handles.png' });

// Move to the right handle of node-1 precisely
const rightHandleX = node1Box.x + node1Box.width + 5;  // right handle at -5 from edge = +5 outside
const rightHandleY = node1Box.y + node1Box.height / 2;
console.log(`Right handle target: (${rightHandleX}, ${rightHandleY})`);

await page.mouse.move(rightHandleX - 10, rightHandleY);
await page.waitForTimeout(200);
await page.mouse.move(rightHandleX, rightHandleY);
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/diagram-on-handle.png' });

// Drag to node-3
await page.mouse.down();
await page.waitForTimeout(100);
await page.mouse.move(node3Box.x + node3Box.width/2, node3Box.y + node3Box.height/2, { steps: 20 });
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/diagram-dragging.png' });
await page.mouse.up();
await page.waitForTimeout(1000);

const edgesAfter = await page.$$('.react-flow__edge');
console.log('Edges after:', edgesAfter.length);
await page.screenshot({ path: '/tmp/diagram-result.png' });

await browser.close();
