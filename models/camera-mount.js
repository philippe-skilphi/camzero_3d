const {
  primitives: { cuboid, cylinder },
  booleans: { union },
  transforms: { translate, rotate },
} = require("@jscad/modeling");

const { screwMountM2 } = require("./screwery");
const {
  segments,
  cameraMountHoleSpacing,
  wallThickness,
  innerHeight,
  centeredHeight,
  innerLength,
} = require("./constants");
const { add } = require("@jscad/modeling/src/maths/mat4");
const { subtract } = require("@jscad/modeling/src/operations/booleans");

function cameraMount() {
  const width = 21;
  const height = 13.5;

  const body = translate(
    [innerLength / 2 - wallThickness, 0, 0],
    union(
      subtract(
        cuboid({ size: [6, 40, innerHeight] }),
        rotate([0, Math.PI / 2, 0], cylinder({ radius: 9, height: 10 })),
        translate([1, width / 2, height / 2], rotate([0, Math.PI / 2, Math.PI], cylinder({ radius: 2, height: 10 }))),
        translate([1, -width / 2, height / 2], rotate([0, Math.PI / 2, Math.PI], cylinder({ radius: 2, height: 10 }))),
        translate([1, width / 2, -height / 2], rotate([0, Math.PI / 2, Math.PI], cylinder({ radius: 2, height: 10 }))),
        translate([1, -width / 2, -height / 2], rotate([0, Math.PI / 2, Math.PI], cylinder({ radius: 2, height: 10 }))),
      ),
      translate([1, width / 2, height / 2], rotate([0, Math.PI / 2, Math.PI], screwMountM2())),
      translate([1, -width / 2, height / 2], rotate([0, Math.PI / 2, Math.PI], screwMountM2())),
      translate([1, width / 2, -height / 2], rotate([0, Math.PI / 2, Math.PI], screwMountM2())),
      translate([1, -width / 2, -height / 2], rotate([0, Math.PI / 2, Math.PI], screwMountM2())),
    ),
  );

  return body;
}

module.exports = { cameraMount };
