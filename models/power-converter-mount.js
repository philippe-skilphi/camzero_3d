const {
  booleans: { union, subtract },
  transforms: { translate },
  primitives: { cylinder, cuboid },
} = require("@jscad/modeling");
const { screwMountM2_5 } = require("./screwery");

const powerConverterLength = 12;
const powerConverterWidth = 17;
const radius = 2;
const height = 8;
const segments = 128;
const deltaHeight = 2;

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

  // return union(
  //   translate([powerConverterLength / 2, powerConverterWidth / 2, 0], cylinder({radius: 1.5, height: 10, segments: 128})),
  //   translate([-powerConverterLength / 2, powerConverterWidth / 2, 0], cylinder({radius: 1.5, height: 10, segments: 128})),
  //   translate([powerConverterLength / 2, -powerConverterWidth / 2, 0], cylinder({radius: 1.5, height: 10, segments: 128})),
  //   translate([-powerConverterLength / 2, -powerConverterWidth / 2, 0], cylinder({radius: 1.5, height: 10, segments: 128})),
  // )
}

module.exports = { powerConverterMount };
