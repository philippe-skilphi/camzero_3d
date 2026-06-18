const {
  primitives: { cuboid, cylinder, torus },
  booleans: { union, subtract },
  transforms: { translate, rotate },
} = require("@jscad/modeling");

function screwMount({
  radius = 1.5,
  height = 3,
  additionalHeight = 2,
  thickness = 1,
}) {


  const mount = translate(
    [0, 0, -height / 2],
    cylinder({ radius: radius, height: height, segments: 128 }),
  );
  const totalHeight = height + additionalHeight;
  const base = translate(
    [0, 0, -totalHeight / 2],
    cylinder({
      radius: radius + thickness,
      height: totalHeight,
      segments: 128,
    }),
  );
  return translate([0, 0, totalHeight], subtract(base, mount));
}

function screwMountBody({
  radius = 1.5,
  height = 3,
  additionalHeight = 2,
  thickness = 1,
}) {
  const totalHeight = height + additionalHeight;
  const base = translate(
    [0, 0, -totalHeight / 2],
    cylinder({
      radius: radius + thickness,
      height: totalHeight,
      segments: 128,
    }),
  );

  return translate([0, 0, totalHeight], base);
}

/**
 * @param {*} additionalHeight ise if we need to add extra height below the mount base
 * The screw mount is a cylinder, height is 3mm and diameter is the same.
 * We will add 2mm around it and below it.
 */

function screwMountM2(additionalHeight) {
  return screwMount({
    radius: 1.5,
    height: 3,
    thickness: 1,
    additionalHeight: additionalHeight ?? 1,
  });
}

function screwMountM2_5({additionalHeight, thickness}) {
  return screwMount({
    radius: 1.7,
    height: 4,
    thickness: thickness ?? 1,
    additionalHeight: additionalHeight ?? 1,
  });
}

function screwMount1_4(additionalHeight) {
  additionalHeight = additionalHeight ?? 1;
  const holeDepth = 12.7;
  const piece = screwMount({
    radius: 6.1,
    height: holeDepth,
    thickness: 4,
    additionalHeight: additionalHeight,
  });

  return translate([0, 0, holeDepth + additionalHeight], rotate([0, Math.PI, 0], piece));
}

const screwMount1_4Body = (additionalHeight) => {
  return screwMountBody({
    radius: 6.1,
    height: 12.7,
    additionalHeight: additionalHeight,
    thickness: 4,
  });
}

module.exports = { screwMountM2, screwMountM2_5, screwMount1_4, screwMount1_4Body };