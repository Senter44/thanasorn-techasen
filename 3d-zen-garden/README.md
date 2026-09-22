# Thanasorn — 3D Zen Garden

A standalone Three.js portfolio study. The previous illustrated garden at
https://thanasorn-portfolio-study.mlbs-9651.chatgpt.site/ is a separate project and is not replaced.

## Preview

Run `python -m http.server 4186 --bind 127.0.0.1 --directory dist`, then visit
http://127.0.0.1:4186/. Serve over HTTP locally or HTTPS when hosted; do not open index.html using file://.
There is no build step or backend. Deploy the contents of `dist`.

## Explore

- Drag or use arrow keys to rotate the real 3D diorama. Scroll or use + / - to zoom. Home resets.
- Select the rocks, path, bamboo, pavilion, or pond to open readable portfolio panels.
- Quick view and the persistent navigation provide an alternative to 3D discovery.
- The garden's lightweight fountain animation is illustrative, not a fluid solver. Open the optional Water physics lab from About to run the existing Splash/WebGPU simulation.
- Closing the lab unloads it. Motion pauses while reading, off-screen, or in a hidden tab. The Pause control and reduced-motion preference are respected.

## Assets and dependencies

Three.js 0.186.0 is vendored under `dist/vendor`; its MIT license is included.
`node tools/vendor.mjs` restores the pinned, SHA-512-verified official package files.
The original garden geometry was authored in Blender. Its reproducible generator is `tools/generate-garden.py` (Blender 4.5); it writes outputs beside the script. Copy its generated garden.glb to `dist/assets/garden.glb` when intentionally regenerating.
The bamboo model and optional Splash lab are reused from the user's water-glass-animation project, with existing notices preserved. CV and professional content are carried over from the previous portfolio.

## Verification

Run `node --test tests/*.test.mjs`. Tests cover navigation state, motion policy, the fountain cycle, pointer-selection safety, local assets, and the complete Three.js dependency graph.
Browser checks additionally cover real mesh selection, all five panels, keyboard orbit, Quick view, pause, mobile framing, and loading/unloading the optional lab.
