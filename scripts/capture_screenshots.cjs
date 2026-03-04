const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const outDir = path.join(__dirname, '..', 'release_screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function capture(url, filePath, viewport) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(url, { waitUntil: 'networkidle2' });
  // Give the game a moment to render and any autostart transitions
  await new Promise((r) => setTimeout(r, 1600));
  await page.screenshot({ path: filePath, fullPage: false });
  await browser.close();
  console.log('Captured', filePath);
}

(async () => {
  const base = 'http://127.0.0.1:8000'; // serve `dist` with a local static server first
  try {
    // StartScene (1280x720)
    await capture(`${base}/index.html`, path.join(outDir, 'ss_start_1280x720.png'), { width: 1280, height: 720 });

    // SectorComplete (start autostart)
    await capture(`${base}/index.html?autostart=sectorcomplete&nextSector=4`, path.join(outDir, 'ss_sectorcomplete_1280x720.png'), { width: 1280, height: 720 });

    // Gameplay (autostart game in sector 3)
    await capture(`${base}/index.html?autostart=game&sector=3`, path.join(outDir, 'ss_gameplay_1920x1080.png'), { width: 1920, height: 1080 });

    // HUD closeup (GameScene with smaller viewport)
    await capture(`${base}/index.html?autostart=game&sector=3`, path.join(outDir, 'ss_hud_1280x720.png'), { width: 1280, height: 720 });

    console.log('All captures complete.');
  } catch (err) {
    console.error('Capture failed:', err);
    process.exit(1);
  }
})();
