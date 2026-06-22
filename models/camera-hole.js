const {
  primitives: { cylinder },
  booleans: { union },
  transforms: { translate, rotate },
} = require("@jscad/modeling");

function cameraHole33mm() {
  return cameraHole({
    outerRadius: 16.5,
    innerRadius: 15.4,
    height: 2,
  });
}

function cameraHole31_6mm() {
  return cameraHole({
    outerRadius: 15.8,
    innerRadius: 13,
    height: 2,
  });
}

function cameraHole30mm() {
  return cameraHole({
    outerRadius: 15,
    innerRadius: 13,
    height: 2,
  });
}

function cameraHole({
  outerRadius = 16.5,
  innerRadius = 15.4,
  height = 2,
} = {}) {
  const cyl1 = cylinder({ radius: outerRadius, height: height, segments: 128 });
  const cyl2 = translate([0, 0, height], cylinder({ radius: innerRadius, height: height, segments: 128 }));

  // We decide no joint on that one for now....
  // const joint = torus({ innerRadius: 0.5, outerRadius: 2.5 });

  // We translate the whole piece so its centered on [0,0,0] coordinates
  return translate([0, 0, -1], union(cyl1, cyl2));
  // return translate([46, 0, 0], rotate([0, Math.PI / 2, 0], union(cyl1, cyl2)));
}

module.exports = { cameraHole, cameraHole33mm, cameraHole31_6mm, cameraHole30mm };