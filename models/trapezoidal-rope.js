const {
  geometries: { geom2 },
  extrusions: { extrudeLinear, extrudeRotate },
  maths: { vec2, vec3, mat4 },
  transforms: { translate, rotate, transform },
  booleans: { union },
} = require("@jscad/modeling");

const {
  segments,
  centeredWidth,
  centeredLength,
  wallThickness,
  roundedRadius,
} = require("./constants");
const { getVec2RoundedPoints, getLowerUpperCutPath } = require("./utils");

// ---------------------------------------------------------------------------
// Catalog profile for a 2.7 mm rope / O-ring retaining groove (gorge trapézoïdale).
// Tweak these to change the main trapezoid cross-section.
// ---------------------------------------------------------------------------

/** K — opening width at the mating face (mm). Narrower than the bottom so the rope is trapped. */
const K = 2.45;

/** k — groove depth from the mating face into the solid (mm). */
const k = 1.9;

/** R — fillet radius at the two bottom (wide) corners of the groove (mm). */
const R = 0.3;

/** r — fillet radius at the two top (opening) edges of the groove (mm). */
const r = 0.15;

/** α — interior angle between the groove base and each side wall (rad). 60° for the 2.7 mm catalog row. */
const alpha = Math.PI / 3;

/**
 * FACE_OVERSHOOT — how far the cutter protrudes past the mating face into the gap (mm).
 * Keeps the boolean from leaving a sealed skin over the groove opening.
 * Does not change catalog depth k into the solid.
 */
const FACE_OVERSHOOT = 0.01;

// ---------------------------------------------------------------------------
// Path bend radii (loop corners), derived from the body roundedCuboid.
// ---------------------------------------------------------------------------

/**
 * LOOP_CORNER_RADIUS — 90° bends on the horizontal step (left X↔Y turns), mid-wall (mm).
 * Equals roundedCuboid roundRadius minus half wall thickness so the path tracks the
 * mid-plane around the body corners.
 */
const LOOP_CORNER_RADIUS = roundedRadius - wallThickness / 2;

/**
 * TOP_CORNER_RADIUS — 90° bends where the diagonal meets the top Y-connector (mm).
 * Uses the full body roundRadius because that path sits near the outer top surface.
 */
const TOP_CORNER_RADIUS = roundedRadius;

/**
 * 2D cross-section of the trapezoidal retaining groove.
 * Opening centered on X; groove extends toward -Y (depth).
 * Wider at the bottom (retaining dovetail).
 *
 * @param {number} [overshoot=0] raise opening to Y = overshoot for face breakthrough
 * @returns {geom2}
 */
function trapezoidal2D(overshoot = 0) {
  // Effective wall length for the 60° flanks when the opening is raised by overshoot.
  const depth = k + overshoot;
  // Horizontal flare of each side wall over `depth` at angle alpha.
  const offset = depth / Math.tan(alpha);
  const sqrt3 = Math.sqrt(3);

  // Fillet centers for the four rounded corners of the profile.
  const topLeftCenter = [-K / 2 + r / sqrt3, overshoot - r];
  const bottomLeftCenter = [-K / 2 - offset + R * sqrt3, -k + R];
  const bottomRightCenter = [K / 2 + offset - R * sqrt3, -k + R];
  const topRightCenter = [K / 2 - r / sqrt3, overshoot - r];

  // CCW outline: opening fillets → bottom fillets (walls are the edges between arcs).
  const points = [
    ...getVec2RoundedPoints(topLeftCenter, r, Math.PI / 2, (5 * Math.PI) / 6),
    ...getVec2RoundedPoints(bottomLeftCenter, R, (5 * Math.PI) / 6, (3 * Math.PI) / 2),
    ...getVec2RoundedPoints(bottomRightCenter, R, -Math.PI / 2, Math.PI / 6),
    ...getVec2RoundedPoints(topRightCenter, r, Math.PI / 6, Math.PI / 2),
  ];

  return geom2.fromPoints(points.map((p) => vec2.fromValues(p[0], p[1])));
}

/**
 * Straight groove segment: extrude the 2D profile along +Z.
 *
 * @param {number} height extrusion length along +Z
 * @param {{ overshoot?: number }} [options]
 * @returns {geom3}
 */
function trapezoidalSegment(height, options = {}) {
  const { overshoot = 0 } = options;
  if (!(height > 0)) {
    throw new Error("trapezoidalSegment height must be a positive number");
  }
  return extrudeLinear({ height }, trapezoidal2D(overshoot));
}

/** Smallest path bend radius that keeps the flared profile from crossing the axis. */
function minBendRadius() {
  const offset = k / Math.tan(alpha);
  return K / 2 + offset + 0.1;
}

/**
 * Revolved groove corner (path bend).
 * - axial: depth along the rotation axis (planar mating-face corners)
 * - radial: depth radially outward (R=20 cut fillet on the ruled face)
 *
 * @param {number} bendRadius path centerline radius
 * @param {number} [angle=Math.PI/2] sweep (rad)
 * @param {{ mode?: 'axial'|'radial', startAngle?: number, overshoot?: number }} [options]
 * @returns {geom3}
 */
function trapezoidalRadius(bendRadius, angle = Math.PI / 2, options = {}) {
  const { mode = "axial", startAngle = 0, overshoot = 0 } = options;
  const floor = minBendRadius();
  if (!(bendRadius >= floor)) {
    throw new Error(
      `trapezoidalRadius bendRadius must be >= ${floor.toFixed(3)} (got ${bendRadius})`,
    );
  }
  if (!(angle > 0)) {
    throw new Error("trapezoidalRadius angle must be a positive number");
  }

  let profile;
  if (mode === "radial") {
    // Map profile so opening faces the bend center (gap) and depth goes outward (solid).
    const pts = geom2.toPoints(trapezoidal2D(overshoot)).map(([x, y]) =>
      vec2.fromValues(bendRadius - y, x),
    );
    profile = geom2.fromPoints(pts);
  } else {
    // Axial: opening width along radial X, depth along Y → Z after extrudeRotate.
    profile = translate([bendRadius, 0], trapezoidal2D(overshoot));
  }

  return extrudeRotate(
    { segments: Math.max(segments, 12), startAngle, angle },
    profile,
  );
}

function normalize3(v) {
  const out = vec3.create();
  vec3.normalize(out, v);
  return out;
}

function cross3(a, b) {
  const out = vec3.create();
  vec3.cross(out, a, b);
  return out;
}

/**
 * Place a local extrusion (extrude +Z, opening +Y / depth -Y) into world space:
 * extrude along `tangent`, opening facing `normal`, depth into -normal.
 */
function placeOriented(geom, origin, tangent, normal) {
  const zAxis = normalize3(tangent);
  const yAxis = normalize3(normal);
  const xAxis = cross3(yAxis, zAxis);
  if (vec3.length(xAxis) < 1e-9) {
    throw new Error("placeOriented: tangent and normal are parallel");
  }
  vec3.normalize(xAxis, xAxis);
  vec3.cross(zAxis, xAxis, yAxis);
  vec3.normalize(zAxis, zAxis);

  const m = mat4.fromValues(
    xAxis[0], xAxis[1], xAxis[2], 0,
    yAxis[0], yAxis[1], yAxis[2], 0,
    zAxis[0], zAxis[1], zAxis[2], 0,
    origin[0], origin[1], origin[2], 1,
  );
  return transform(m, geom);
}

/**
 * Axial 90° (or other) corner, sweeping CW around +normal when viewed along the face normal.
 * `startDir` = radial from corner center to the path at the start of the arc.
 *
 * extrudeRotate only sweeps CCW around local +Z, so the same sector is built as
 * CCW from endDir → startDir with endDir = cross(startDir, normal).
 */
function placeAxialCornerCW(bendRadius, angle, origin, normal, startDir) {
  const corner = trapezoidalRadius(bendRadius, angle, {
    mode: "axial",
    overshoot: FACE_OVERSHOOT,
  });

  const zAxis = normalize3(normal);
  const start = normalize3(startDir);
  const end = cross3(start, zAxis);
  if (vec3.length(end) < 1e-9) {
    throw new Error("placeAxialCornerCW: startDir parallel to normal");
  }
  vec3.normalize(end, end);

  // Right-handed: local +X = end (CCW start), local +Y = start, local +Z = normal.
  const xAxis = end;
  const yAxis = start;

  const m = mat4.fromValues(
    xAxis[0], xAxis[1], xAxis[2], 0,
    yAxis[0], yAxis[1], yAxis[2], 0,
    zAxis[0], zAxis[1], zAxis[2], 0,
    origin[0], origin[1], origin[2], 1,
  );
  return transform(m, corner);
}

/**
 * Cut-path fillet (R = 20 from lower/upper split) at fixed Y.
 * Radial-mode revolution around an axis // Y through the fillet center.
 */
function placeFilletRun(y) {
  const path = getLowerUpperCutPath();
  const { filletRadius, filletCenter, startAngle, filletSweep } = path;

  const sector = trapezoidalRadius(filletRadius, filletSweep, {
    mode: "radial",
    startAngle,
    overshoot: FACE_OVERSHOOT,
  });

  // Local arc in XY / axis Z → world arc in XZ / axis Y.
  const oriented = rotate([Math.PI / 2, 0, 0], sector);
  return translate([filletCenter[0], y, filletCenter[1]], oriented);
}

/** Map a cut-path (x, z) point to world at the given wall Y. */
function xzToWorld(xz, y) {
  return [xz[0], y, xz[1]];
}

/** Unit tangent along the diagonal cut, and face normal toward the upper/gap side. */
function diagonalTangentAndNormal(path) {
  const dx = path.diagonalEnd[0] - path.diagonalStart[0];
  const dz = path.diagonalEnd[1] - path.diagonalStart[1];
  const tangent = normalize3([dx, 0, dz]);
  const normal = normalize3([-dz, 0, dx]);
  return { tangent, normal };
}

/**
 * Path length along the diagonal from the outer top endpoint so the top Y-connector
 * stays inside the top wall (inclined dig + bottom flare must not break z = innerHeight/2).
 */
function topConnectorInset(diagT, diagN) {
  const tz = Math.abs(diagT[2]);
  const nz = Math.abs(diagN[2]);
  if (tz < 1e-9) {
    return wallThickness / 2;
  }
  const bottomHalfWidth = K / 2 + (k + FACE_OVERSHOOT) / Math.tan(alpha);
  // World-Z reach below the path centerline.
  const below = k * nz + bottomHalfWidth * tz;
  const margin = 0.15;
  const maxInset = (wallThickness - below - margin) / tz;
  const midInset = wallThickness / 2 / tz;
  return Math.max(0, Math.min(midInset, maxInset));
}

/**
 * Closed-loop trapezoidal rope trap on the lower/upper mating cut face.
 * Positive cutter — subtract from lowerBody only.
 *
 * Loop (CW when viewed along face normals):
 *   left Y-connector → +Y long run (horizontal + fillet + diagonal)
 *   → top Y-connector → -Y long run (reverse) → back to left connector
 *
 * @returns {geom3}
 */
function trapezoidalRopeTrap() {
  const path = getLowerUpperCutPath();
  const Rc = LOOP_CORNER_RADIUS;
  const topRc = TOP_CORNER_RADIUS;

  // ±Y wall mid-planes (groove long runs sit here).
  const yPos = centeredWidth / 2;
  const yNeg = -centeredWidth / 2;

  // Horizontal step of the cut (world Z of the mating face on that step).
  const z0 = path.horizontalStart[1];

  // Left (±X) wall mid-plane.
  const xWallMid = -centeredLength / 2;

  // Outer-top endpoint of the cut silhouette (before top-wall inset).
  const topEnd = path.diagonalEnd;

  const { tangent: diagT, normal: diagN } = diagonalTangentAndNormal(path);
  const horizN = [0, 0, 1]; // opening toward upper on the horizontal step
  const horizT = [1, 0, 0]; // long-run direction along +X

  // Inset top connector along the diagonal so the groove stays in the top wall.
  const topInset = topConnectorInset(diagT, diagN);
  const topConn = [
    topEnd[0] - diagT[0] * topInset,
    topEnd[1] - diagT[2] * topInset,
  ];

  // --- Segment lengths (corners eat Rc / topRc at each end) ---
  const h0x = xWallMid + Rc; // horizontal run starts after the left corner
  const hLen = path.horizontalEnd[0] - h0x;

  const d0 = path.diagonalStart;
  const dLen =
    Math.hypot(topConn[0] - d0[0], topConn[1] - d0[1]) - topRc;

  const leftYConnLen = centeredWidth - 2 * Rc;
  const topYConnLen = centeredWidth - 2 * topRc;

  const parts = [];

  // -------------------------------------------------------------------------
  // Long runs at y = ±yPos / ±yNeg (cut silhouette through the ±Y walls)
  // -------------------------------------------------------------------------
  for (const y of [yPos, yNeg]) {
    // SEGMENT: horizontal step along +X on the mating face (z = z0).
    // Origin at left end after the left corner; opening +Z, depth -Z.
    parts.push(
      placeOriented(
        trapezoidalSegment(hLen, { overshoot: FACE_OVERSHOOT }),
        [h0x, y, z0],
        horizT,
        horizN,
      ),
    );

    // ANGLE / FILLET: R=20 cut fillet between horizontal step and diagonal
    // (same arc as lowerBody / getLowerUpperCutPath).
    parts.push(placeFilletRun(y));

    // SEGMENT: diagonal portion of the cut, from fillet end toward the top connector.
    // Opening along diagN (gap / upper); depth into lowerBody.
    parts.push(
      placeOriented(
        trapezoidalSegment(dLen, { overshoot: FACE_OVERSHOOT }),
        xzToWorld(d0, y),
        diagT,
        diagN,
      ),
    );
  }

  // -------------------------------------------------------------------------
  // End connectors (close the loop across Y)
  // -------------------------------------------------------------------------

  // SEGMENT: left Y-connector — through left wall mid-plane (x = xWallMid),
  // on the horizontal step (z = z0), from -Y corner to +Y corner.
  parts.push(
    placeOriented(
      trapezoidalSegment(leftYConnLen, { overshoot: FACE_OVERSHOOT }),
      [xWallMid, yNeg + Rc, z0],
      [0, 1, 0],
      horizN,
    ),
  );

  // SEGMENT: top Y-connector — on the inclined cut face at topConn,
  // mid-ish top wall, from -Y top corner to +Y top corner.
  parts.push(
    placeOriented(
      trapezoidalSegment(topYConnLen, { overshoot: FACE_OVERSHOOT }),
      [topConn[0], yNeg + topRc, topConn[1]],
      [0, 1, 0],
      diagN,
    ),
  );

  // -------------------------------------------------------------------------
  // Left angles (horizontal face, normal +Z) — radius LOOP_CORNER_RADIUS
  // -------------------------------------------------------------------------

  // ANGLE: +Y left — joins left Y-connector to +Y horizontal run.
  // Center (xWallMid+Rc, yPos-Rc, z0); CW from radial -X to +Y.
  parts.push(
    placeAxialCornerCW(Rc, Math.PI / 2, [xWallMid + Rc, yPos - Rc, z0], horizN, [-1, 0, 0]),
  );

  // ANGLE: -Y left — joins -Y horizontal run to left Y-connector.
  // Center (xWallMid+Rc, yNeg+Rc, z0); CW from radial -Y to -X.
  parts.push(
    placeAxialCornerCW(Rc, Math.PI / 2, [xWallMid + Rc, yNeg + Rc, z0], horizN, [0, -1, 0]),
  );

  // -------------------------------------------------------------------------
  // Top angles (inclined face, normal diagN) — radius TOP_CORNER_RADIUS
  // -------------------------------------------------------------------------

  // ANGLE: +Y top — joins +Y diagonal run to top Y-connector.
  // Center inset from topConn along -diagT and -Y; CW from radial +Y toward diagT.
  parts.push(
    placeAxialCornerCW(
      topRc,
      Math.PI / 2,
      [topConn[0] - diagT[0] * topRc, yPos - topRc, topConn[1] - diagT[2] * topRc],
      diagN,
      [0, 1, 0],
    ),
  );

  // ANGLE: -Y top — joins top Y-connector to -Y diagonal run.
  // Center inset from topConn along -diagT and +Y; CW from radial diagT toward -Y.
  parts.push(
    placeAxialCornerCW(
      topRc,
      Math.PI / 2,
      [topConn[0] - diagT[0] * topRc, yNeg + topRc, topConn[1] - diagT[2] * topRc],
      diagN,
      diagT,
    ),
  );

  return union(...parts);
}

module.exports = {
  trapezoidal2D,
  trapezoidalSegment,
  trapezoidalRadius,
  trapezoidalRopeTrap,
  LOOP_CORNER_RADIUS,
  TOP_CORNER_RADIUS,
  K,
  k,
};
