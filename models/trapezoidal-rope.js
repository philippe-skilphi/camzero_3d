const {
  geometries: { geom2 },
  extrusions: { extrudeLinear, extrudeRotate },
  maths: { vec2, vec3, mat4 },
  transforms: { translate, transform },
  booleans: { union },
} = require("@jscad/modeling");

const {
  segments,
  centeredWidth,
  centeredLength,
  frontSeamCurveWidth,
  wallThickness,
  roundedRadius,
} = require("./constants");
const {
  caseSeparationZ,
  getFrontSeamCurvePoints,
  getVec2RoundedPoints,
} = require("./utils");

// ---------------------------------------------------------------------------
// Catalog profile for a 2 mm rope / O-ring retaining groove (gorge trapézoïdale).
// Tweak these to change the main trapezoid cross-section.
// ---------------------------------------------------------------------------

/** K — opening width at the mating face (mm). Narrower than the bottom so the rope is trapped. */
const K = 1.75;

/** k — groove depth from the mating face into the solid (mm). */
const k = 1.4;

/** R — fillet radius at the two bottom (wide) corners of the groove (mm). */
const R = 0.2;

/** r — fillet radius at the two top (opening) edges of the groove (mm). */
const r = 0.1;

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
 * Closed-loop trapezoidal rope trap on the low horizontal mating face.
 * The front connector follows the same smooth dip as the body split.
 * Positive cutter — subtract from lowerBody only.
 * @returns {import("@jscad/modeling/src/geometries/types").Geom3}
 */
function trapezoidalRopeTrap() {
  const separationZ = caseSeparationZ();
  const normal = [0, 0, 1];
  const xExtent = centeredLength / 2;
  const yExtent = centeredWidth / 2;
  const cornerRadius = LOOP_CORNER_RADIUS;
  const xCorner = xExtent - cornerRadius;
  const yCorner = yExtent - cornerRadius;
  const curveHalfWidth = frontSeamCurveWidth / 2;
  const sideLength = 2 * xCorner;
  const rearLength = 2 * yCorner;
  const frontStraightLength = yCorner - curveHalfWidth;
  const segment = (length) =>
    trapezoidalSegment(length, { overshoot: FACE_OVERSHOOT });

  const parts = [
    // Horizontal side and rear runs.
    placeOriented(
      segment(sideLength),
      [-xCorner, yExtent, separationZ],
      [1, 0, 0],
      normal,
    ),
    placeOriented(
      segment(sideLength),
      [xCorner, -yExtent, separationZ],
      [-1, 0, 0],
      normal,
    ),
    placeOriented(
      segment(rearLength),
      [-xExtent, -yCorner, separationZ],
      [0, 1, 0],
      normal,
    ),
    // Short front runs connect the plan-view corners to the curved section.
    placeOriented(
      segment(frontStraightLength),
      [xExtent, -yCorner, separationZ],
      [0, 1, 0],
      normal,
    ),
    placeOriented(
      segment(frontStraightLength),
      [xExtent, curveHalfWidth, separationZ],
      [0, 1, 0],
      normal,
    ),
    // Four horizontal plan-view corners.
    placeAxialCornerCW(
      cornerRadius,
      Math.PI / 2,
      [-xCorner, yCorner, separationZ],
      normal,
      [-1, 0, 0],
    ),
    placeAxialCornerCW(
      cornerRadius,
      Math.PI / 2,
      [xCorner, yCorner, separationZ],
      normal,
      [0, 1, 0],
    ),
    placeAxialCornerCW(
      cornerRadius,
      Math.PI / 2,
      [xCorner, -yCorner, separationZ],
      normal,
      [1, 0, 0],
    ),
    placeAxialCornerCW(
      cornerRadius,
      Math.PI / 2,
      [-xCorner, -yCorner, separationZ],
      normal,
      [0, -1, 0],
    ),
  ];

  const curvePoints = getFrontSeamCurvePoints();
  for (let index = 0; index < curvePoints.length - 1; index++) {
    const [y0, z0] = curvePoints[index];
    const [y1, z1] = curvePoints[index + 1];
    const dy = y1 - y0;
    const dz = z1 - z0;
    parts.push(
      placeOriented(
        segment(Math.hypot(dy, dz)),
        [xExtent, y0, z0],
        [0, dy, dz],
        [0, -dz, dy],
      ),
    );
  }

  return union(...parts);
}

module.exports = {
  trapezoidal2D,
  trapezoidalSegment,
  trapezoidalRadius,
  trapezoidalRopeTrap,
  LOOP_CORNER_RADIUS,
  K,
  k,
};
