const {
  booleans: { union },
  transforms: { translate, rotate },
} = require("@jscad/modeling");

const { screwMountM2 } = require("./screwery");
const { cameraMountHoleSpacing } = require("./constants");

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
    )
  );
}

module.exports = { cameraMount };