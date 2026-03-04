const Jimp = require('jimp');
const path = require('path');
const outDir = path.join(__dirname, '..', 'release_screenshots');

const specs = [
  { name: 'cover-1160x642.png', w: 1160, h: 642, bg: '#103d2b', title: 'AIRLOCK', subtitle: 'The Oncoming Swarm — placeholder cover', titleSize: 64, subSize: 20 },
  { name: 'screenshot-gameplay-1920x1080.png', w: 1920, h: 1080, bg: '#08100d', title: 'Gameplay — placeholder 1920×1080', titleSize: 72 },
  { name: 'screenshot-hud-1280x720.png', w: 1280, h: 720, bg: '#02110f', title: 'HUD / UX Closeup — 1280×720', titleSize: 48 },
  { name: 'screenshot-sectorcomplete-1280x720.png', w: 1280, h: 720, bg: '#032018', title: 'Sector Complete — 1280×720', titleSize: 48 },
  { name: 'screenshot-vertical-1080x1920.png', w: 1080, h: 1920, bg: '#081b12', title: 'Vertical Promo — 1080×1920', titleSize: 48 },
  { name: 'thumbnail-600x338.png', w: 600, h: 338, bg: '#072217', title: 'Thumbnail 600×338', titleSize: 28 }
];

async function create(spec) {
  const image = new Jimp(spec.w, spec.h, spec.bg);
  // choose font size
  let font;
  if (spec.titleSize >= 72) font = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE).catch(()=>null);
  if (!font && spec.titleSize >= 48) font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE).catch(()=>null);
  if (!font) font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE).catch(()=>null);

  const text = spec.title;
  const maxWidth = Math.floor(spec.w * 0.9);
  const maxHeight = Math.floor(spec.h * 0.6);

  // measure and print centered
  image.print(font, 0, (spec.h/2) - 40, {
    text: text,
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
  }, spec.w, maxHeight);

  if (spec.subtitle) {
    const fontSub = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE).catch(()=>null);
    image.print(fontSub, 0, (spec.h/2) + 30, {
      text: spec.subtitle,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
    }, spec.w, maxHeight);
  }

  const outPath = path.join(outDir, spec.name);
  await image.writeAsync(outPath);
  console.log('Wrote', outPath);
}

(async () => {
  try {
    for (const s of specs) await create(s);
    console.log('All screenshots generated.');
  } catch (err) {
    console.error('Error generating screenshots:', err);
    process.exit(1);
  }
})();
