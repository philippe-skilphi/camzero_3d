const {
  geometries: { geom2, poly2 },
  extrusions: { extrudeLinear },
  maths: { vec2 },
  measurements: { measureBoundingBox },
} = require("@jscad/modeling");
const {
  outerHeight,
  outerLength,
  upperToLowerHeightRatio,
  segments,
} = require("./constants");

const CUT_FILLET_RADIUS = 20;

function Hexagon(diameter, height) {
  const radius = diameter / 2;
  const sqrt3 = Math.sqrt(3) / 2;

  const hex2D = geom2.fromPoints(
    [
      [radius, 0],
      [radius / 2, radius * sqrt3],
      [-radius / 2, radius * sqrt3],
      [-radius, 0],
      [-radius / 2, -radius * sqrt3],
      [radius / 2, -radius * sqrt3]
    ]
  )

  return extrudeLinear({height}, hex2D);
}

function lowerBodyOuterHeight() {
  return (outerHeight) / (1 / upperToLowerHeightRatio)
}

function getSizes(geometry) {
  const v = measureBoundingBox(geometry);
  return {
    x: Math.round((Math.abs(v[0][0]) + Math.abs(v[1][0])) * 100) / 100,
    y: Math.round((Math.abs(v[0][1]) + Math.abs(v[1][1])) * 100) / 100,
    z: Math.round((Math.abs(v[0][2]) + Math.abs(v[1][2])) * 100) / 100,
  }
}

function getVec2RoundedPoints(center, radius, startAngle, endAngle) {
  const points = [];
  for (let i = startAngle; i <= endAngle; i += Math.PI / segments) {
    points.push(vec2.fromValues(center[0] + radius * Math.cos(i), center[1] + radius * Math.sin(i)));
  }
  return points;
}

/**
 * Shared lower/upper mating cut geometry in the XZ plane (x, z).
 * Matches the boolean split used by lowerBody().
 */
function getLowerUpperCutPath() {
  const filletRadius = CUT_FILLET_RADIUS;
  const corner = [0, -outerHeight / 6];
  const edgeAngle = Math.atan2((3 * outerHeight) / 4, (3 * outerLength) / 8);

  const bisAngle = Math.PI / 2 + edgeAngle / 2;
  const centerDist = filletRadius / Math.cos(edgeAngle / 2);
  const filletCenter = [
    corner[0] + centerDist * Math.cos(bisAngle),
    corner[1] + centerDist * Math.sin(bisAngle),
  ];

  const startAngle = -Math.PI / 2;
  const endAngle = edgeAngle - Math.PI / 2;
  const filletSweep = endAngle - startAngle;

  const horizontalStart = [-outerLength / 2, -outerHeight / 6];
  const horizontalEnd = [
    filletCenter[0] + filletRadius * Math.cos(startAngle),
    filletCenter[1] + filletRadius * Math.sin(startAngle),
  ];
  const diagonalStart = [
    filletCenter[0] + filletRadius * Math.cos(endAngle),
    filletCenter[1] + filletRadius * Math.sin(endAngle),
  ];
  const diagonalEnd = [(3 * outerLength) / 8, outerHeight / 2];

  const roundedPoints = getVec2RoundedPoints(
    filletCenter,
    filletRadius,
    startAngle,
    endAngle,
  );

  const removePolygonPoints = [
    horizontalStart,
    ...roundedPoints.map((p) => [p[0], p[1]]),
    diagonalEnd,
    [-outerLength / 2, outerHeight / 2],
  ];

  return {
    filletRadius,
    corner,
    edgeAngle,
    filletCenter,
    startAngle,
    endAngle,
    filletSweep,
    horizontalStart,
    horizontalEnd,
    diagonalStart,
    diagonalEnd,
    removePolygonPoints,
  };
}

/**
 * World Z of the lower/upper mating cut at a given X (horizontal step, fillet, or diagonal).
 * Used to seat screw mounts/holes on the actual separation surface.
 */
function cutSeparationZAtX(x) {
  const {
    horizontalStart,
    horizontalEnd,
    filletCenter,
    filletRadius,
    startAngle,
    endAngle,
    diagonalStart,
    diagonalEnd,
  } = getLowerUpperCutPath();

  if (x <= horizontalEnd[0]) {
    return horizontalStart[1];
  }
  if (x >= diagonalEnd[0]) {
    return diagonalEnd[1];
  }
  if (x < diagonalStart[0]) {
    // On the fillet arc: solve for angle from x = cx + R cos(θ), θ in [startAngle, endAngle].
    const cosTheta = (x - filletCenter[0]) / filletRadius;
    const clamped = Math.max(-1, Math.min(1, cosTheta));
    // Fillet spans startAngle (-π/2) → endAngle (edgeAngle - π/2), both in the lower-right
    // relative to center; sin(θ) is negative-to-less-negative. Prefer θ in that range.
    let theta = -Math.acos(clamped);
    if (theta < startAngle) theta = startAngle;
    if (theta > endAngle) theta = endAngle;
    return filletCenter[1] + filletRadius * Math.sin(theta);
  }

  const t =
    (x - diagonalStart[0]) / (diagonalEnd[0] - diagonalStart[0]);
  return diagonalStart[1] + t * (diagonalEnd[1] - diagonalStart[1]);
}

module.exports = {
  getVec2RoundedPoints,
  getLowerUpperCutPath,
  cutSeparationZAtX,
  Hexagon,
  lowerBodyOuterHeight,
  getSizes,
  CUT_FILLET_RADIUS,
};