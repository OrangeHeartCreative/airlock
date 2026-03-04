Screenshots for itch.io

Recommended screenshots to capture

- Gameplay wide: 1920x1080 — filename: screenshot-gameplay-1920x1080.png
- Gameplay portrait/vertical: 1080x1920 — filename: screenshot-vertical-1080x1920.png (optional)
- HUD/UX closeup: 1280x720 — filename: screenshot-hud-1280x720.png
- SectorComplete/title: 1280x720 — filename: screenshot-sectorcomplete-1280x720.png
- Cover image (required by itch): 1160x642 — filename: cover-1160x642.png
- Thumbnail (small): 600x338 — filename: thumbnail-600x338.png

Capture instructions (macOS)

1. Run the game locally (from project root):

```bash
npm run dev
# open http://localhost:5173 or the printed dev URL
```

2. Connect a gamepad and reproduce the desired scene.
3. Use macOS capture shortcuts:
   - Full area selection: `Cmd+Shift+4` then drag to select area.
   - Capture a window: `Cmd+Shift+4` then press Space and click window.
   - Screenshots are saved to Desktop by default.

Capture instructions (Windows)

1. Run the game locally (see above).
2. Press `Win+Shift+S` to open Snip & Sketch, select the region, then paste/save.

Capture instructions (Linux)

1. Run the game locally.
2. Use `gnome-screenshot -a` for area selection, or your distro's screenshot tool.

Sizing / export

- Use any image editor (Preview on macOS, Photos, GIMP, or an online tool) to export PNGs at the recommended dimensions.
- Aim for high-quality PNGs; 72–100% JPEG is acceptable if file size is critical, but PNG is preferred.

Filenames and placement

- Place screenshots in a folder named `release_screenshots/` at the project root.
- Filenames should follow the recommended names above for easy identification.

Add screenshots to the release ZIP

From project root, after placing images into `release_screenshots/`:

```bash
# add screenshots into the existing zip (created earlier)
zip -ur airlock-v1.0-web.zip release_screenshots/
# verify listing
unzip -l airlock-v1.0-web.zip | sed -n '1,120p'
```

Notes for itch.io

- Upload the ZIP or the extracted contents as an "HTML" build.
- Set the entry point to `index.html` (automatic when uploading a ZIP containing `index.html`).
- Upload the `cover-1160x642.png` as the cover image in the upload metadata to ensure correct listing visuals.

If you want, I can create placeholder images (simple gradient + title) and add them to the ZIP for now — say "yes" and I'll generate them.