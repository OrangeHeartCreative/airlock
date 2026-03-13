const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const outDir = path.join(__dirname, '..', 'release_screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function captureQueenBoss() {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox','--disable-setuid-sandbox'],
    headless: false // Show browser to see what's happening
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('Loading Queen boss encounter...');
  await page.goto('http://127.0.0.1:8000/index.html?autostart=queen', { waitUntil: 'networkidle2' });
  
  // Wait for game to load and initialize
  await new Promise((r) => setTimeout(r, 3000));
  
  // Click to ensure game is active
  await page.click('body');
  await new Promise((r) => setTimeout(r, 1000));
  
  // Wait for the game to reach playing state and Queen to spawn
  await page.evaluate(() => {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 40; // 8 second timeout
      
      const checkForQueen = () => {
        attempts++;
        const game = window.game;
        
        if (game && game.scene && game.scene.scenes) {
          const gameScene = game.scene.scenes.find(s => s.constructor.name === 'GameScene');
          if (gameScene && gameScene.scene.isActive() && gameScene.state === 'playing') {
            // Check if Queen has spawned
            const enemies = gameScene.enemies;
            if (enemies) {
              const queen = enemies.getChildren().find(enemy => enemy.getData('type') === 'queen');
              if (queen && queen.active) {
                console.log('Queen found and active!');
                resolve();
                return;
              }
            }
          }
        }
        
        if (attempts >= maxAttempts) {
          console.log('Timeout waiting for Queen, proceeding anyway...');
          resolve();
          return;
        }
        
        setTimeout(checkForQueen, 200);
      };
      
      checkForQueen();
    });
  });
  
  // Additional wait for positioning and effects
  await new Promise((r) => setTimeout(r, 2000));
  
  console.log('Capturing Queen boss screenshot...');
  await page.screenshot({ 
    path: path.join(outDir, 'queen_boss_1920x1080.png'), 
    fullPage: false 
  });
  
  // Also capture at smaller resolution for variety
  await page.setViewport({ width: 1280, height: 720 });
  await new Promise((r) => setTimeout(r, 500));
  
  await page.screenshot({ 
    path: path.join(outDir, 'queen_boss_1280x720.png'), 
    fullPage: false 
  });
  
  await browser.close();
  console.log('Queen boss screenshots captured successfully!');
}

(async () => {
  try {
    await captureQueenBoss();
  } catch (err) {
    console.error('Screenshot capture failed:', err);
    process.exit(1);
  }
})();