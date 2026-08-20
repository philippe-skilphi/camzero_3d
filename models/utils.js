const {
  geometries: { geom2 },
  extrusions: { extrudeLinear },
  maths: { vec2 },
  measurements: { measureBoundingBox },
  primitives: { roundedRectangle, rectangle },
  booleans: { subtract },
} = require("@jscad/modeling");
const {
  facetTopZ,
  frontSeamCurveWidth,
  layout,
  outerHeight,
  segments,
  roundedRadius,
  innerWidth,
} = require("./constants");
const {
  screwHoleHalfCircularWithSupportHeight,
} = require("./screwery");

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
  return caseSeparationZ() + outerHeight / 2;
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

function caseSeparationZ() {
  return facetTopZ + screwHoleHalfCircularWithSupportHeight();
}

function frontSeamDipAtY(y) {
  const halfWidth = frontSeamCurveWidth / 2;
  if (Math.abs(y) >= halfWidth) return 0;
  return (
    (layout.frontSeamDip / 2) *
    (1 + Math.cos((2 * Math.PI * y) / frontSeamCurveWidth))
  );
}

function frontSeamZAtY(y) {
  return caseSeparationZ() - frontSeamDipAtY(y);
}

function frontSeamSlopeAtY(y) {
  const halfWidth = frontSeamCurveWidth / 2;
  if (Math.abs(y) >= halfWidth) return 0;
  return (
    (layout.frontSeamDip * Math.PI) /
    frontSeamCurveWidth *
    Math.sin((2 * Math.PI * y) / frontSeamCurveWidth)
  );
}

function getFrontSeamCurvePoints(segmentCount = Math.max(12, segments)) {
  const halfWidth = frontSeamCurveWidth / 2;
  const points = [];
  for (let index = 0; index <= segmentCount; index++) {
    const y = -halfWidth + (frontSeamCurveWidth * index) / segmentCount;
    points.push([y, frontSeamZAtY(y)]);
  }
  return points;
}

function thermalReliefShape() {
  const thermalReliefShape = roundedRectangle({ size: [innerWidth, 20], roundRadius: roundedRadius });
  // const toRemove = rectangle({ size: [innerWidth, 14], center: [0, 5] });
  const toRemove = roundedRectangle({ size: [innerWidth, 16], center: [0, 5], roundRadius: 6 });
  const thermalRelief = subtract(thermalReliefShape, toRemove);
  const thermalReliefBody = extrudeLinear({ height: 2 }, thermalRelief);
  return thermalReliefBody;
}

module.exports = {
  getVec2RoundedPoints,
  caseSeparationZ,
  frontSeamDipAtY,
  frontSeamZAtY,
  frontSeamSlopeAtY,
  getFrontSeamCurvePoints,
  Hexagon,
  lowerBodyOuterHeight,
  getSizes,
  thermalReliefShape,
};