# Thanasorn portfolio draft

Static, explorable zen-garden portfolio based on the supplied 2026 CV. Visitors choose a garden component to open a visual detail panel: rock islands for projects, stepping stones for experience, shishi-odoshi for the personal story, pavilion for skills/CV, and pond for contact. Quick view and a persistent destination menu provide an alternative to spatial navigation. Serve `dist/` over HTTP for the WebGPU fountain.

The embedded fountain reuses the shishi-odoshi scene from the user's `Senter44/water-glass-animation` project. Its compiled JavaScript, bamboo model, garden asset, and Splash license are retained. The additions are the portfolio page and the scene's presentation and visibility handling. No simulation code was changed.

Content describes documented responsibilities, with platform-wide scale labeled explicitly. Project disclosures intentionally avoid unverified performance or business impact metrics.

The fountain supports reduced motion, manual pause, and automatic pause when outside the viewport, when viewing a detail panel, or in Quick view. The decorative frame is excluded from keyboard and screen-reader navigation. Native dialogs provide keyboard focus containment, Escape dismissal, and focus return. WebGPU requires a compatible browser and GPU; the rest of the portfolio remains available without it.

The source CV is in `dist/assets/thanasorn-techasen-cv.pdf`. Splash's license is in `dist/bamboo-3d/SPLASH-LICENSE.txt`.

The decorative raked-sand, moss, and stone background is `dist/assets/zen-garden-v1.png`, created with the built-in image-generation tool. The generation prompt is saved in `design/zen-garden-prompt.md`. Readable warm-paper surfaces keep the portfolio content in the foreground.

The current map uses `dist/assets/zen-map-v1.png`, generated with the built-in image-generation tool. Its brief is saved in `design/zen-map-prompt.md`. The landscape is a static artwork; the fountain is the existing live WebGPU scene. No other map elements are claimed to be real-time 3D geometry.

Run `node --test --experimental-test-coverage tests/*.test.mjs` for navigation-state and asset checks. Browser checks cover all five destinations, project switches, Quick view, Escape/focus return, contact/CV links, and narrow-screen tap targets.
