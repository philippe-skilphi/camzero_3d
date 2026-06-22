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
} = {}) {
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
} = {}) {
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

function screwMountHalfCircular({
  radius = 2.5,
  height = 6,
  additionalHeight = 0,
  thickness = 2,
} = {}) {
  const mount = cylinder({
    radius: radius,
    height: height,
    segments: 128,
    center: [radius, 0, additionalHeight + thickness * 2],
  });
  const base = screwMountHalfCircularBody({
    radius,
    height,
    additionalHeight,
    thickness,
  });

  return subtract(base, mount);
}

function screwHole({
  holeHeight = 2,
  holeRadius = 1.6,
  headHeight = 2,
  headRadius = 2.5,
} = {}) {
  const headCylinder = cylinder({
    radius: headRadius,
    height: headHeight,
    segments: 128,
    center: [headRadius, 0, (headHeight + holeHeight) / 2 + headHeight / 2],
  });
  const holeCylinder = cylinder({
    radius: holeRadius,
    height: holeHeight,
    segments: 128,
    center: [headRadius, 0, (headHeight + holeHeight) / 2 - holeHeight / 2],
  });

  return union(headCylinder, holeCylinder);
}

function screwHoleHalfCircular({
  bodyRadius = 2.5,
  holeHeight = 2,
  holeRadius = 1.6,
  headHeight = 2,
  headRadius = 2.5,
  thickness = 1,
} = {}) {
  const headCylinder = cylinder({
    radius: headRadius,
    height: headHeight,
    segments: 128,
    center: [headRadius, 0, (headHeight + holeHeight) / 2 + headHeight / 2],
  });
  const holeCylinder = cylinder({
    radius: holeRadius,
    height: holeHeight,
    segments: 128,
    center: [headRadius, 0, (headHeight + holeHeight) / 2 - holeHeight / 2],
  });
  //  return union(holeCylinder, headCylinder);
  const base = screwMountHalfCircularBody({
    radius: bodyRadius,
    height: holeHeight + headHeight,
    additionalHeight: 0,
    thickness,
  });

  return subtract(base, union(holeCylinder, headCylinder));
}

function screwMountHalfCircularBody({
  radius = 1.5,
  height = 3,
  additionalHeight = 2,
  thickness = 1,
} = {}) {
  const totalHeight = height + additionalHeight;
  const base = translate(
    [0, 0, -totalHeight / 2],
    subtract(
      cylinder({
        radius: 3 * radius,
        height: totalHeight,
        segments: 128,
      }),
      cuboid({
        size: [3 * radius, 6 * radius, totalHeight],
        center: [-(1.5 * radius), 0, 0],
      }),
    ),
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

function screwMountM2_5({ additionalHeight, thickness } = {}) {
  return screwMount({
    radius: 1.7,
    height: 4,
    thickness: thickness ?? 1,
    additionalHeight: additionalHeight ?? 1,
  });
}

function screwMountM3(additionalHeight, thickness) {
  return screwMount({
    radius: 1.9,
    height: 5,
    thickness: thickness ?? 1,
    additionalHeight: additionalHeight ?? 1,
  });
}

function screwMountM3Body(additionalHeight, thickness) {
  return screwMountBody({
    radius: 1.9,
    height: 5,
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

  return translate(
    [0, 0, holeDepth + additionalHeight],
    rotate([0, Math.PI, 0], piece),
  );
}

const screwMount1_4Body = (additionalHeight) => {
  return screwMountBody({
    radius: 6.1,
    height: 12.7,
    additionalHeight: additionalHeight,
    thickness: 4,
  });
};

module.exports = {
  screwMountM2,
  screwMountM2_5,
  screwMountM3,
  screwMountM3Body,
  screwMount1_4,
  screwMount1_4Body,
  screwMountHalfCircular,
  screwMountHalfCircularBody,
  screwHoleHalfCircular,
  screwHole,
};
