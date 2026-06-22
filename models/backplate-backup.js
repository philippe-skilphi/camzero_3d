const {
  primitives: { cuboid, roundedCuboid, roundedRectangle, cylinder },
  booleans: { union, subtract },
  transforms: { translate, rotate },
  extrusions: { extrudeLinear },
} = require("@jscad/modeling");

module.exports.main = () => {
  // --- Raspberry Pi board dimensions ---
  const piWidth = 85;
  const piLength = 56;
  const piHeight = 2;       // piBase top layer thickness (z=0 to z=2)
  const outerHeight = 4;    // base plate thickness (z=-4 to z=0)
  const wallThickness = 5;  // margin around Pi board on piBase
  const cornerRadius = 3;

  // --- piBase: raised platform for the Raspberry Pi (95x66x2) ---
  const piBaseProfile = roundedRectangle({
    size: [piWidth + 2 * wallThickness, piLength + 2 * wallThickness],
    roundRadius: cornerRadius,
    segments: 32,
  });
  const piBase = extrudeLinear({ height: piHeight }, piBaseProfile);

  // --- Base plate: larger mounting plate underneath (140x100x4) ---
  const baseWidth = 140;
  const baseLength = 100;
  
  const baseProfile = roundedRectangle({
    size: [baseWidth, baseLength],
    roundRadius: cornerRadius,
    segments: 32,
  });
  const base = translate(
    [0, 0, -outerHeight],
    extrudeLinear({ height: outerHeight }, baseProfile)
  );

  // --- 4x M4 through-holes on base plate corners (120x90 pattern) ---
  const hole = (x, y) => translate(
    [x, y, -outerHeight - 1],
    cylinder({ radius: 2, height: outerHeight + 6, segments: 32 })
  );

  const screwHoleHalfCirculars = [
    hole( 60,  45),
    hole(-60,  45),
    hole(-60, -45),
    hole( 60, -45),
  ];

  const baseWithHoles = subtract(base, ...screwHoleHalfCirculars);

  // --- 4x M2.5 hex spacer pockets for Pi mounting (Loctited in place) ---
  // 5mm across flats + 0.15mm tolerance; circumradius for 6-segment cylinder
  const hexAcrossFlats = 5.15;
  const hexRadius = (hexAcrossFlats / 2) / Math.cos(Math.PI / 6);
  const fullThickness = piHeight + outerHeight; // 6mm total through both layers

  const hexPocket = (x, y) => translate(
    [x, y, -outerHeight - 1],
    cylinder({ radius: hexRadius, height: fullThickness + 40, segments: 6 })
  );

  // Pi holes: 3.5mm from each edge of the 85x56 board
  const piHoleX = piWidth / 2 - 3.5;
  const piHoleY = piLength / 2 - 3.5;

  const spacerPockets = [
    hexPocket( piHoleX,  piHoleY),
    hexPocket(-piHoleX,  piHoleY),
    hexPocket(-piHoleX, -piHoleY),
    hexPocket( piHoleX, -piHoleY),
  ];

  const plate = union(piBase, baseWithHoles);

  // --- Weight-reduction grid: circular through-holes on piBase area ---
  const gridHoleRadius = 5;  // 10mm diameter holes
  const gridPitch = 13;      // 10mm hole + 3mm wall
  const gridMargin = 5;      // perimeter frame width
  const mountClearance = 10;  // exclusion radius around mounting points

  const piMounts = [
    [piHoleX, piHoleY], [-piHoleX, piHoleY],
    [-piHoleX, -piHoleY], [piHoleX, -piHoleY],
  ];

  // Centered grid within piBase footprint, skipping holes near hex spacer mounts
  const usableX = (piWidth + 2 * wallThickness) / 2 - gridMargin;
  const usableY = (piLength + 2 * wallThickness) / 2 - gridMargin;
  const colCount = Math.floor(usableX * 2 / gridPitch);
  const rowCount = Math.floor(usableY * 2 / gridPitch);
  const startX = -(colCount - 1) * gridPitch / 2;
  const startY = -(rowCount - 1) * gridPitch / 2;

  const gridHoles = [];
  for (let col = 0; col < colCount; col++) {
    for (let row = 0; row < rowCount; row++) {
      const cx = startX + col * gridPitch;
      const cy = startY + row * gridPitch;
      const tooClose = piMounts.some(([mx, my]) =>
        Math.hypot(cx - mx, cy - my) < mountClearance
      );
      if (!tooClose) {
        gridHoles.push(
          translate([cx, cy, -outerHeight - 1],
            cylinder({ radius: gridHoleRadius, height: fullThickness + 10, segments: 32 })
          )
        );
      }
    }
  }

  // --- Weight-reduction grid: outer base area (outside piBase footprint) ---
  const piBaseHalfX = (piWidth + 2 * wallThickness) / 2;
  const piBaseHalfY = (piLength + 2 * wallThickness) / 2;
  const baseHalfX = baseWidth / 2;
  const baseHalfY = baseLength / 2;

  // Camera plate width needed for exclusion zone (declared here, used in grid + camera section)
  const camWidth = 31;

  const baseMounts = [
    [60, 45], [-60, 45], [-60, -45], [60, -45],
  ];

  const outerUsableX = baseHalfX - gridMargin;
  const outerUsableY = baseHalfY - gridMargin;
  const outerColCount = Math.floor(outerUsableX * 2 / gridPitch);
  const outerRowCount = Math.floor(outerUsableY * 2 / gridPitch);
  const outerStartX = -(outerColCount - 1) * gridPitch / 2;
  const outerStartY = -(outerRowCount - 1) * gridPitch / 2;

  // Skip holes that overlap piBase area, screw mounts, or camera plate junction
  const outerGridHoles = [];
  for (let col = 0; col < outerColCount; col++) {
    for (let row = 0; row < outerRowCount; row++) {
      const cx = outerStartX + col * gridPitch;
      const cy = outerStartY + row * gridPitch;
      const insidePiBase =
        Math.abs(cx) < piBaseHalfX + gridMargin &&
        Math.abs(cy) < piBaseHalfY + gridMargin;
      if (insidePiBase) continue;
      const tooCloseToMount = baseMounts.some(([mx, my]) =>
        Math.hypot(cx - mx, cy - my) < mountClearance
      );
      if (tooCloseToMount) continue;
      const tooCloseToCam =
        cx > baseHalfX - mountClearance &&
        Math.abs(cy) < camWidth / 2 + gridMargin;
      if (tooCloseToCam) continue;
      outerGridHoles.push(
        translate([cx, cy, -outerHeight - 1],
          cylinder({ radius: gridHoleRadius, height: outerHeight + 10, segments: 32 })
        )
      );
    }
  }

  const plateWithPiPockets = subtract(plate, ...spacerPockets, ...gridHoles, ...outerGridHoles);

  // --- Camera backplate: vertical plate at +X edge of base plate ---
  // 25mm wide, 38.862mm tall (23.862mm board + 15mm extension below)
  const camBoardHeight = 23.862;
  const camExtension = 15;
  const camTotalHeight = camBoardHeight + camExtension;
  const camThickness = 4;

  const cameraPlate = translate(
    [baseWidth / 2 + camThickness / 2, 0, -outerHeight + camTotalHeight / 2],
    roundedCuboid({ size: [camThickness, camWidth, camTotalHeight], roundRadius: 1.5, segments: 16 })
  );

  // --- 4x M2 hex spacer pockets for camera mounting ---
  // 4mm across flats + 0.15mm tolerance
  const camHexAcrossFlats = 4.15;
  const camHexRadius = (camHexAcrossFlats / 2) / Math.cos(Math.PI / 6);

  // Holes match the 25mm-wide camera board: 2mm from each board edge
  const camBoardWidth = 25;
  const camHoleY = camBoardWidth / 2 - 2.0;
  const camHoleZBottom = -outerHeight + camExtension + 4;
  const camHoleZTop = -outerHeight + camExtension + 4 + 14.5;

  const camHexPocket = (y, z) => translate(
    [baseWidth / 2 + camThickness / 2, y, z],
    rotate(
      [0, Math.PI / 2, 0],
      cylinder({ radius: camHexRadius, height: camThickness + 2, segments: 6 })
    )
  );

  const camPockets = [
    camHexPocket( camHoleY, camHoleZBottom),
    camHexPocket(-camHoleY, camHoleZBottom),
    camHexPocket(-camHoleY, camHoleZTop),
    camHexPocket( camHoleY, camHoleZTop),
  ];

  // --- Camera lens hole: centered between the 4 mounting holes ---
  const camLensCenter = (camHoleZBottom + camHoleZTop) / 2;
  const camLensHole = translate(
    [baseWidth / 2 + camThickness / 2, 0, camLensCenter],
    rotate(
      [0, Math.PI / 2, 0],
      cylinder({ radius: 8, height: camThickness + 2, segments: 32 })
    )
  );

  // --- Final assembly ---
  const assembly = union(plateWithPiPockets, cameraPlate);
  return subtract(assembly, ...camPockets, camLensHole);
};
