const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const outDir = path.join(__dirname, '..', 'release_screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function captureGameplay(url, filePath, viewport) {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox','--disable-setuid-sandbox'],
    headless: false // Show browser to debug
  });
  const page = await browser.newPage();
  await page.setViewport(viewport);
  
  // Navigate and wait for page load
  await page.goto(url, { waitUntil: 'networkidle2' });
  console.log(`Loading ${url}...`);
  
  // Wait longer for game initialization
  await new Promise((r) => setTimeout(r, 3000));
  
  // Try to click to activate the game if needed
  await page.click('body');
  await new Promise((r) => setTimeout(r, 1000));
  
  // Wait for game to be in playing state
  await page.evaluate(() => {
    return new Promise((resolve) => {
      const checkGameState = () => {
        const game = window.game;
        if (game && game.scene && game.scene.scenes) {
          const gameScene = game.scene.scenes.find(s => s.constructor.name === 'GameScene');
          if (gameScene && gameScene.scene.isActive() && gameScene.state === 'playing') {
            resolve();
            return;
          }
        }
        setTimeout(checkGameState, 200);
      };
      checkGameState();
      
      // Fallback timeout
      setTimeout(() => resolve(), 8000);
    });
  });
  
  // Additional wait for gameplay elements to stabilize
  await new Promise((r) => setTimeout(r, 2000));
  
  await page.screenshot({ path: filePath, fullPage: false });
  await browser.close();
  console.log('Captured', filePath);
}

async function captureMenu(url, filePath, viewport) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  // Wait for menu to render
  await new Promise((r) => setTimeout(r, 2000));
  
  await page.screenshot({ path: filePath, fullPage: false });
  await browser.close();
  console.log('Captured', filePath);
}

(async () => {
  const base = 'http://127.0.0.1:8000';
  try {
    // Start menu
    await captureMenu(`${base}/index.html`, path.join(outDir, 'enhanced_start_1280x720.png'), { width: 1280, height: 720 });
    
    // Sector complete
    await captureMenu(`${base}/index.html?autostart=sectorcomplete&nextSector=4`, path.join(outDir, 'enhanced_sectorcomplete_1280x720.png'), { width: 1280, height: 720 });
    
    // Multiple gameplay captures
    await captureGameplay(`${base}/index.html?autostart=game&sector=1`, path.join(outDir, 'enhanced_sector1_1920x1080.png'), { width: 1920, height: 1080 });
    await captureGameplay(`${base}/index.html?autostart=game&sector=3`, path.join(outDir, 'enhanced_gameplay_1920x1080.png'), { width: 1920, height: 1080 });
    await captureGameplay(`${base}/index.html?autostart=game&sector=6`, path.join(outDir, 'enhanced_sector6_1920x1080.png'), { width: 1920, height: 1080 });
    await captureGameplay(`${base}/index.html?autostart=game&sector=3`, path.join(outDir, 'enhanced_hud_1280x720.png'), { width: 1280, height: 720 });
    
    console.log('Enhanced captures complete.');
  } catch (err) {
    console.error('Enhanced capture failed:', err);
    process.exit(1);
  }
})();