const {
  geometries: { geom2, poly2 },
  extrusions: { extrudeLinear },
  maths: { vec2 },
} = require("@jscad/modeling");

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

module.exports = {
  Hexagon,
};