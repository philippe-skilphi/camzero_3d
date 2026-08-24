const {
  primitives: { cuboid, cylinder },
  booleans: { union, subtract },
  transforms: { rotate, translate },
} = require("@jscad/modeling");

const { screwMount1_4, screwMount1_4Body } = require("./screwery");
const { segments } = require("./constants");

const mastRadius = 10;
const trapHeight = 40;
const trapThickness = 4;
const trapTolerance = 0.5;
const headerHeight = 15;
const openingWidth = 3;
const openingCount = 3;

function m14MastAdapter() {
  const outerRadius = mastRadius + trapTolerance * 2 + trapThickness;
  const trapCenterZ = -headerHeight / 2
  let body = cylinder({ radius: outerRadius, height: trapHeight + headerHeight , segments: segments });
  let trapShape = cylinder({
    radius: mastRadius + trapTolerance * 2,
    height: trapHeight,
    center: [0, 0, trapCenterZ],
    segments: segments,
  });
  const openings = [];
  for (let i = 0; i < openingCount; i++) {
    const slot = cuboid({
      size: [outerRadius * 2 + 2, openingWidth, trapHeight],
      center: [outerRadius, 0, trapCenterZ],
    });
    openings.push(rotate([0, 0, (i * 2 * Math.PI) / openingCount], slot));
  }
  body = subtract(body, union(trapShape, ...openings)); 
  // Add M1/4 screw on top
  // First subtract M1/4 body from the top of the mast adapter
  const m14Body = translate([0, 0, 28], rotate([0, Math.PI, 0], screwMount1_4Body()));
  body = subtract(body, m14Body);

  // Then add the M1/4 screw on top
  body = union(body,  translate([0, 0, 27.5], rotate([0, Math.PI, 0], screwMount1_4(2.5))));

  // Cylindric extrusion 1mm inside the mast trap
  const extrusionBody = translate([0, 0, - trapHeight / 1.4 + headerHeight], 
  subtract(
    cylinder({ radius: mastRadius + trapTolerance * 2 + trapThickness + 10, height: 10, segments: segments }),
    cylinder({ radius: mastRadius + trapTolerance * 2 + trapThickness - 1, height: 10, segments: segments })
  ));
  body = subtract(body, extrusionBody);
  return translate([0, 0, (trapHeight + headerHeight) / 2], rotate([0, Math.PI, 0], body));
}

module.exports = { m14MastAdapter };