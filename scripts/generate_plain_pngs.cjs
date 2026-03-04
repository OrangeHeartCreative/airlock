const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const outDir = path.join(__dirname, '..', 'release_screenshots');
const specs = [
  { name: 'cover-1160x642.png', w: 1160, h: 642, color: [16,61,43] },
  { name: 'screenshot-gameplay-1920x1080.png', w: 1920, h: 1080, color: [8,16,13] },
  { name: 'screenshot-hud-1280x720.png', w: 1280, h: 720, color: [2,17,15] },
  { name: 'screenshot-sectorcomplete-1280x720.png', w: 1280, h: 720, color: [3,32,24] },
  { name: 'screenshot-vertical-1080x1920.png', w: 1080, h: 1920, color: [8,27,18] },
  { name: 'thumbnail-600x338.png', w: 600, h: 338, color: [7,34,23] }
];

function writePNG(spec) {
  return new Promise((resolve, reject) => {
    const png = new PNG({ width: spec.w, height: spec.h });
    for (let y = 0; y < spec.h; y++) {
      for (let x = 0; x < spec.w; x++) {
        const idx = (spec.w * y + x) << 2;
        png.data[idx] = spec.color[0];
        png.data[idx+1] = spec.color[1];
        png.data[idx+2] = spec.color[2];
        png.data[idx+3] = 255;
      }
    }
    const outPath = path.join(outDir, spec.name);
    const stream = fs.createWriteStream(outPath);
    png.pack().pipe(stream);
    stream.on('finish', () => resolve(outPath));
    stream.on('error', reject);
  });
}

(async () => {
  try {
    for (const s of specs) {
      const p = await writePNG(s);
      console.log('Wrote', p);
    }
    console.log('Plain PNG placeholders generated.');
  } catch (err) {
    console.error('Error generating PNGs:', err);
    process.exit(1);
  }
})();
