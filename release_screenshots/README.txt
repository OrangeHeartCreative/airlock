Placeholder screenshots

Files in this folder are simple SVG placeholders. Replace them with real screenshots before public release if possible.

Recommended final files (PNG):
- cover-1160x642.png
- screenshot-gameplay-1920x1080.png
- screenshot-hud-1280x720.png
- screenshot-sectorcomplete-1280x720.png
- screenshot-vertical-1080x1920.png (optional)
- thumbnail-600x338.png

To convert SVG to PNG on macOS (Preview can export), or use ImageMagick:

  magick convert cover-1160x642.svg cover-1160x642.png

Then add them to the ZIP:

  zip -ur airlock-v1.0-web.zip release_screenshots/
