const {
  primitives: { roundedCuboid, cuboid },
  booleans: { union, subtract },
  transforms: { translate, rotate },
} = require("@jscad/modeling");

const { screwHole } = require("./screwery");

const {
  cameraCapTopLength,
  cameraCapBottomLength,
  cameraCapWidth,
  cameraCapHeight,
  outerLength,
  outerWidth,
  outerHeight,
  roundedRadius,
  capDistanceToBody,
  capThickness,
  cameraCapOuterWidth,
  cameraCapInnerWidth,
} = require("./constants");

function cameraCap() {
  let body = roundedCuboid({
    size: [cameraCapTopLength, cameraCapOuterWidth, cameraCapHeight],
    center: [0, 0, cameraCapHeight / 2],
    roundRadius: roundedRadius,
  });

  const toRemove = roundedCuboid({
    size: [cameraCapTopLength + 10, cameraCapInnerWidth, cameraCapHeight],
    roundRadius: roundedRadius,
    center: [0, 0, -4 + cameraCapHeight / 2],
  });
  body = subtract(body, toRemove);

  const cutAngleBody = translate(
    [cameraCapTopLength / 2 + 4, 0, 0],
    rotate(
      [0, Math.PI / 5, 0],
      cuboid({
        size: [30, cameraCapOuterWidth, 30],
        center: [0, 0, 0],
      }),
    ),
  );
  body = subtract(body, cutAngleBody);

  // Add 4 M2.5 screw holes on the bottom side to support the cap.
  const capScrewMounts = union(
    translate([2.5, capDistanceToBody + outerWidth / 2, outerHeight / 4 - capDistanceToBody - capThickness], rotate([-Math.PI / 2, 0, 0], screwHole())),
    translate([-27.5, capDistanceToBody + outerWidth / 2, outerHeight / 4 - capDistanceToBody - capThickness], rotate([-Math.PI / 2, 0, 0], screwHole())),
    translate([2.5, - (outerWidth / 2) - capDistanceToBody, outerHeight / 4 - capThickness - capDistanceToBody],  rotate([Math.PI / 2, 0, 0], screwHole())),
    translate([-27.5, - (outerWidth / 2) - capDistanceToBody, outerHeight / 4 - capThickness - capDistanceToBody], rotate([Math.PI / 2, 0, 0], screwHole())),
  );

  // return capScrewMounts;
  body = subtract(body, capScrewMounts);
  return body;
  // return  cutAngleBody;
  // return translate([0, 0, cameraCapHeight / 2], body);
}

module.exports = { cameraCap };
