# Your two zen-garden portfolios

Saved separately on 21 September 2026. Neither live website was changed.

## View online

- Original illustrated garden: https://thanasorn-portfolio-study.mlbs-9651.chatgpt.site/
- Interactive 3D garden: https://thanasorn-zen-garden-3d.mlbs-9651.chatgpt.site/

## Saved projects

- `original-zen-garden/` — illustrated garden, portfolio content, animated fountain, CV, assets, tests, and design notes.
- `3d-zen-garden/` — Three.js scene, 3D models, portfolio content, optional fluid lab, CV, assets, tests, and model generator.
- Each project has its own matching `.zip` backup. Extract the ZIP before running it.

These are complete copies of the website project files, excluding Git history, temporary caches, and installed dependency folders. The required Three.js browser modules are included. Each project's README contains more detail.

## Run locally

The animations and 3D modules need a local web server; double-clicking `dist/index.html` is not sufficient. Python is already installed on this computer.

For the original version, open PowerShell and run:

```powershell
cd "C:\Users\hydro\OneDrive\Desktop\zen-garden-portfolios\original-zen-garden"
python -m http.server 4185 --bind 127.0.0.1 --directory dist
```

Then open http://127.0.0.1:4185/ in your browser.

For the 3D version, use another PowerShell window:

```powershell
cd "C:\Users\hydro\OneDrive\Desktop\zen-garden-portfolios\3d-zen-garden"
python -m http.server 4186 --bind 127.0.0.1 --directory dist
```

Then open http://127.0.0.1:4186/. Keep PowerShell open while viewing; press Ctrl+C to stop the server. The optional Splash fluid simulation requires a WebGPU-compatible browser and GPU.

## Verification

All 25 original-project files and all 38 3D-project files were SHA-256 checked against their sources after copying. The original project passed 9 tests and the 3D project passed 14 tests. ZIP contents were checked against the saved folders.
