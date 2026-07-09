const {
  geometries: { geom2, poly2 },
  extrusions: { extrudeLinear },
  maths: { vec2 },
  measurements: { measureBoundingBox },
} = require("@jscad/modeling");
const { outerHeight, upperToLowerHeightRatio } = require("./constants");

function Hexagon(diameter, height) {
  const radius = diameter / 2;
  const sqrt3 = Math.sqrt(3) / 2;
  const vec2Points = [

  ]
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

module.exports = {
  Hexagon,
  lowerBodyOuterHeight,
  getSizes,
};