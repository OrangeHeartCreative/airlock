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
  await new Promise((r) => setTimeout(r, 1600));
  await page.screenshot({ path: filePath, fullPage: false });
  await browser.close();
  console.log('Captured', filePath);
}

async function makePoster(srcImagePath, outPath) {
  // Load image as base64 and create a data URL HTML page with overlay text
  const data = fs.readFileSync(srcImagePath);
  const b64 = data.toString('base64');
  const mime = 'image/png';
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;height:100%;}
    .bg{width:100%;height:100%;background-image:url(data:${mime};base64,${b64});background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center}
    .overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.12),rgba(0,0,0,0.35));}
    .title{position:relative;color:#9affc4;font-family:monospace;font-weight:700;font-size:86px;text-align:center;letter-spacing:6px}
    .subtitle{position:relative;color:#c0d8cc;font-family:monospace;font-size:20px;text-align:center;margin-top:8px}
    .container{display:flex;flex-direction:column;align-items:center}
  </style></head><body>
  <div class="bg"><div class="overlay"></div><div class="container"><div class="title">AIRLOCK</div><div class="subtitle">The Oncoming Swarm</div></div></div>
  </body></html>`;

  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080 });
  await page.setContent(html, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: outPath, fullPage: false });
  await browser.close();
  console.log('Poster written', outPath);
}

(async () => {
  const base = 'http://127.0.0.1:8000';
  try {
    await capture(`${base}/index.html?autostart=game&sector=1`, path.join(outDir, 'ss_sector1_1920x1080.png'), { width: 1920, height: 1080 });
    await capture(`${base}/index.html?autostart=game&sector=6`, path.join(outDir, 'ss_sector6_1920x1080.png'), { width: 1920, height: 1080 });
    await capture(`${base}/index.html?autostart=game&sector=12`, path.join(outDir, 'ss_sector12_1920x1080.png'), { width: 1920, height: 1080 });

    // Use sector12 as poster background
    await makePoster(path.join(outDir, 'ss_sector12_1920x1080.png'), path.join(outDir, 'poster_1080x1080.png'));

    console.log('All sector captures and poster generation complete.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
