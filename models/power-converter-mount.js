const {
  booleans: { union, subtract },
  transforms: { translate },
  primitives: { cylinder, cuboid },
} = require("@jscad/modeling");
const { screwMountM2_5 } = require("./screwery");
const { segments } = require("./constants");

const powerConverterLength = 12;
const powerConverterWidth = 16.6;
const radius = 2;
const height = 5;
const deltaHeight = 4;

function powerConverterMount() {
  return subtract(
    union(
      cylinder({
        radius,
        height,
        segments,
        center: [powerConverterLength / 2, 0, height / 2],
      }),
      cylinder({
        radius,
        height,
        segments,
        center: [-powerConverterLength / 2, 0, height / 2],
      }),
    ),
    cuboid({
      size: [powerConverterLength, powerConverterWidth, deltaHeight],
      center: [0, 0, height],
    }),
  );
}

module.exports = { powerConverterMount };
