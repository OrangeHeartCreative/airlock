const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // standard itch.io cover image size
  await page.setViewport({ width: 630, height: 500 });
  
  await page.setContent(`
    <html>
      <body style="margin:0; padding:0; background-color:#07100b; color:#9affc4; font-family:monospace; display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; overflow:hidden;">
        <!-- Background decorative elements to make it look sci-fi -->
        <div style="position:absolute; top:10%; left:10%; width:80%; height:80%; border:2px solid rgba(154,255,196,0.1); border-radius:10px; z-index:0;"></div>
        <div style="position:absolute; top:15%; left:15%; width:70%; height:70%; border:1px solid rgba(154,255,196,0.05); z-index:0;"></div>
        
        <div style="z-index:1; display:flex; flex-direction:column; align-items:center;">
          <h1 style="font-size: 64px; text-transform: uppercase; margin: 0 0 10px 0; text-shadow: 0 0 15px #9affc4, 0 0 5px #9affc4; letter-spacing: 4px;">AIRLOCK</h1>
          <h2 style="font-size: 24px; color: #ffffff; margin: 0 0 40px 0; letter-spacing: 2px; text-shadow: 0 0 5px #ffffff;">THE ONCOMING SWARM</h2>
          
          <div style="width: 250px; height: 4px; background: #9affc4; margin-bottom: 40px; box-shadow: 0 0 10px #9affc4;"></div>
          
          <p style="font-size: 14px; color: #aaaaaa; letter-spacing: 1px; margin: 0;">SURVIVE THE SWARM &middot; UPGRADE &middot; ESCAPE</p>
        </div>
      </body>
    </html>
  `);

  const outputPath = path.join(__dirname, '../release_screenshots/cover_630x500.png');
  await page.screenshot({ path: outputPath });
  console.log('Cover image generated at:', outputPath);
  
  await browser.close();
})();