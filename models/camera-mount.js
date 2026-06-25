const {
  primitives: { cuboid, cylinder },
  booleans: { union },
  transforms: { translate, rotate },
} = require("@jscad/modeling");

const { screwMountM2 } = require("./screwery");
const {
  cameraMountHoleSpacing,
  wallThickness,
  innerHeight,
  centeredHeight,
  outerLength,
} = require("./constants");
const { add } = require("@jscad/modeling/src/maths/mat4");
const { subtract } = require("@jscad/modeling/src/operations/booleans");

function cameraMount({ innerLength, totalHeight = 18 } = {}) {
  const additionalHeight = totalHeight - 4;
  return union(
    translate(
      [innerLength, cameraMountHoleSpacing / 2, cameraMountHoleSpacing / 2],
      rotate([0, -Math.PI / 2, 0], screwMountM2(additionalHeight)),
    ),
    translate(
      [innerLength, -cameraMountHoleSpacing / 2, cameraMountHoleSpacing / 2],
      rotate([0, -Math.PI / 2, 0], screwMountM2(additionalHeight)),
    ),
    translate(
      [innerLength, cameraMountHoleSpacing / 2, -cameraMountHoleSpacing / 2],
      rotate([0, -Math.PI / 2, 0], screwMountM2(additionalHeight)),
    ),
    translate(
      [innerLength, -cameraMountHoleSpacing / 2, -cameraMountHoleSpacing / 2],
      rotate([0, -Math.PI / 2, 0], screwMountM2(additionalHeight)),
    ),
    // Add lower support cuboid to support the camera mount
    cuboid({
      size: [
        totalHeight - 2,
        5,
        (centeredHeight - cameraMountHoleSpacing) / 2 - wallThickness,
      ],
      center: [
        innerLength - wallThickness - 5,
        -cameraMountHoleSpacing / 2,
        -innerHeight / 2 + wallThickness -1,
      ],
    }),
    cuboid({
      size: [
        totalHeight - 2,
        5,
        (centeredHeight - cameraMountHoleSpacing) / 2 - wallThickness,
      ],
      center: [
        innerLength - wallThickness - 5,
        cameraMountHoleSpacing / 2,
        -innerHeight / 2 + wallThickness -1,
      ],
    }),
    subtract(
      translate(
        [additionalHeight + innerLength / 2, 0, 0],
        rotate(
          [0, Math.PI / 2, 0],
          cylinder({
            radius: 18,
            height: totalHeight - 2,
            center: [0, 0, 0],
            segments: 128,
          }),
        ),
      ),
      translate(
        [additionalHeight + innerLength / 2, 0, 0],
        rotate(
          [0, Math.PI / 2, 0],
          cylinder({
            radius: 15.6,
            height: totalHeight - 2,
            center: [0, 0, 0],
            segments: 128,
          }),
        ),
      ),
      cuboid({
        size: [totalHeight - 2, cameraMountHoleSpacing + 10, 8],
        center: [additionalHeight + innerLength / 2, 0, -cameraMountHoleSpacing / 2 - 2],
      }),
      cuboid({
        size: [totalHeight - 2, cameraMountHoleSpacing + 10, 8],
        center: [additionalHeight + innerLength / 2, 0, cameraMountHoleSpacing / 2 + 2],
      }),
    ),
  );
}

module.exports = { cameraMount };
