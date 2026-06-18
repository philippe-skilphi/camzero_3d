const {
  booleans: { union },
  transforms: { translate },
} = require("@jscad/modeling");
const { screwMountM2_5 } = require("./screwery");

const powerConverterLength = 12;
const powerConverterWidth = 17;
const additionalHeight = 4;
const thickness = 1;

function powerConverterMount() {
  return union(
    translate([powerConverterLength / 2, powerConverterWidth / 2, 0], screwMountM2_5({additionalHeight, thickness})),
    translate([-powerConverterLength / 2, powerConverterWidth / 2, 0], screwMountM2_5({additionalHeight, thickness})),
    translate([powerConverterLength / 2, -powerConverterWidth / 2, 0], screwMountM2_5({additionalHeight, thickness})),
    translate([-powerConverterLength / 2, -powerConverterWidth / 2, 0], screwMountM2_5({additionalHeight, thickness})),
  )
}

module.exports = { powerConverterMount };