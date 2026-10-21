# CamZero 3D printed case

The camera enclosure, designed with **OpenJSCAD V2** (`@jscad/modeling`).

Documentation: https://openjscad.xyz/v2/dokuwiki/doku.php?id=en:start

## Parts

The case is made of 4 parts:

- **Lower body** — the most complex part, where the camera components sit. It has a
  trapezoidal trap for a 2 mm joint rope running all around, lower to upper body.
- **Upper body** — closes the case over the lower body; has a hole for the camera
  cap.
- **Camera cap** — sits on top of the upper body; shields the sensor from direct
  sun and provides thermal shielding.
- **USB bottle cap** — closes the case over the USB port.

## Variants

Two camera variants:

- **Tangxi** camera
- **Sainsmart** camera (smaller PCB than Tangxi)

The active variant is selected through `CAM_MODEL` (`tangxi` | `sainsmart`).

## Commands

Run from the `3d_case/` repo root. The camera model argument is required.

```bash
npm run build -- tangxi        # build JSCAD JSON for the tangxi variant
npm run build -- sainsmart     # build JSCAD JSON for the sainsmart variant
npm run watch -- tangxi        # rebuild on file changes
npm run export:stl -- sainsmart  # export an STL (gitignored)
```

- `CAM_MODEL` is required; `resolveCamModel` fails fast if it is missing or
  invalid.
- `SEG` controls STL segment count (defaults to `128` on export).
- Verify **both** variants build before finishing geometry work.

## Files

- `models/camera.js` — main entry; reuses the other models to build the final case.
- `models/constants.js` — all dimensions/constants for the case.
- `models/utils.js` — shared utility functions.
- `camera-model.js` — validates the `CAM_MODEL` variant and exposes helpers.
- `build.js`, `watch.js`, `export-stl.js` — build scripts.
- Other `models/*.js` files are named for what they build.
- Kept for possible future use (not actively wired in):
  `models/additional-cards-mount.js`, `models/rope.js`.

## Conventions

- Units are **millimetres**.
- Keep geometry parametric; put dimensions in `constants.js` and shared logic in
  `utils.js` rather than hard-coding values.
- Generated outputs are gitignored: `jscad/*.jscad.json` and `stl/*.stl`. Do not
  edit or commit them.
