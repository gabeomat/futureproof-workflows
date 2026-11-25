// render.js — screenshot a Countdown Catalog page for the critique loop, including its interactions.
// Needs Playwright (npm i playwright). Run:
//   node render.js <url> <outDir> [viewport=1440x900] [label=desktop]
// Writes <label>-top.png, -mid.png, -bottom.png, -catalog.png, -open.png, -marked.png
// and prints JSON: { docHeight, errors, shots }. `errors` MUST be empty before you ship.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [, , url, outDir = '.', size = '1440x900', label = 'desktop'] = process.argv;
  const [w, h] = size.split('x').map(Number);
  const errors = [], shots = [];
  // Playwright's own Chromium if installed, otherwise the Google Chrome already on the machine
  const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  page.on('requestfailed', r => { if (!/fonts\.(googleapis|gstatic)/.test(r.url())) errors.push('request failed: ' + r.url()); });
  await page.goto(url, { waitUntil: 'networkidle' }).catch(() => page.goto(url, { waitUntil: 'load' }));
  await page.waitForTimeout(1200);
  // make every scroll-in section visible so full-page shots show real content
  await page.evaluate(() => document.querySelectorAll('.cc-in').forEach(x => x.classList.add('cc-seen')));
  const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const shot = async (name, y) => {
    await page.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y);
    await page.waitForTimeout(700);
    const f = path.join(outDir, `${label}-${name}.png`); await page.screenshot({ path: f }); shots.push(f);
  };
  await shot('top', 0);
  await shot('mid', Math.max(0, docHeight / 2 - h / 2));
  await shot('bottom', docHeight);
  const card = await page.$('.cc-card');
  if (card) {
    const y = await page.evaluate(() => { const c = document.querySelector('.cc-card'); return c.getBoundingClientRect().top + scrollY - 90; });
    await shot('catalog', y);
    await page.click('.cc-card .cc-turn');
    await page.waitForTimeout(1100);
    await shot('open', y);
    await page.click('.cc-card.cc-open .cc-turnback');
    const boxes = await page.$$('.cc-pick input');
    for (const b of boxes.slice(1, 3)) await b.click({ force: true });
    await page.waitForTimeout(1300);
    await shot('marked', y);
  }
  console.log(JSON.stringify({ docHeight, errors, shots }, null, 1));
  await browser.close();
})();
