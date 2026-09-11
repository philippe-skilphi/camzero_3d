const {
  primitives: { roundedCuboid, cuboid },
  booleans: { union, subtract },
  transforms: { translate, rotate },
} = require("@jscad/modeling");

const { screwHole } = require("./screwery");

const {
  layout,
  cameraCapTopLength,
  cameraCapBottomLength,
  cameraCapHeight,
  outerLength,
  outerWidth,
  outerHeight,
  roundedRadius,
  segments,
  lowerFacetHeight,
  lowerFacetInset,
  capDistanceToBody,
  capThickness,
  cameraCapOuterWidth,
  cameraCapInnerWidth,
} = require("./constants");
const { facetedRoundedCuboid } = require("./faceted-rounded-cuboid");

function cameraCap() {

  console.log("cameraCapTopLength", cameraCapTopLength);
  console.log("cameraCapBottomLength", cameraCapBottomLength);
  console.log("cameraCapHeight", cameraCapHeight);
  console.log("cameraCapOuterWidth", cameraCapOuterWidth);
  console.log("cameraCapInnerWidth", cameraCapInnerWidth);
  console.log("capDistanceToBody", capDistanceToBody);
  console.log("capThickness", capThickness);
  console.log("roundedRadius", roundedRadius);
  console.log("outerLength", outerLength);
  console.log("outerWidth", outerWidth);
  console.log("outerHeight", outerHeight);
  console.log("layout", layout);
    

  let body = facetedRoundedCuboid({
    size: [cameraCapTopLength, cameraCapOuterWidth, cameraCapHeight - 3],
    center: [0, 0, cameraCapHeight / 2],
    roundRadius: roundedRadius,
    facetHeight: lowerFacetHeight,
    facetInset: lowerFacetInset,
    segments,
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

  const cutFrontBody = cuboid({
    size: [10, cameraCapOuterWidth, cameraCapHeight],
    center: [
      cameraCapTopLength / 2 + layout.cutFrontBodyOffset,
      0,
      cameraCapHeight / 2,
    ],
  });

  const cutBackBody = cuboid({
    size: [10, cameraCapOuterWidth, cameraCapHeight],
    center: [
      -cameraCapBottomLength / 2 - layout.cutFrontBodyOffset -5,
      0,
      cameraCapHeight / 2,
    ],
  });

  body = subtract(body, cutAngleBody,);
  body = subtract(body, cutFrontBody);
  body = subtract(body, cutBackBody);

  // Add 4 M2.5 screw holes on the bottom side to support the cap.
  const capScrewMounts = union(
    translate(
      [15, capDistanceToBody + outerWidth / 2, outerHeight / 4 - capThickness],
      rotate([-Math.PI / 2, 0, 0], screwHole()),
    ),
    translate(
      [
        -30,
        capDistanceToBody + outerWidth / 2,
        outerHeight / 4 - capThickness,
      ],
      rotate([-Math.PI / 2, 0, 0], screwHole()),
    ),
    translate(
      [
        15,
        -(outerWidth / 2) - capDistanceToBody,
        outerHeight / 4 - capThickness,
      ],
      rotate([Math.PI / 2, 0, 0], screwHole()),
    ),
    translate(
      [
        -30,
        -(outerWidth / 2) - capDistanceToBody,
        outerHeight / 4 - capThickness,
      ],
      rotate([Math.PI / 2, 0, 0], screwHole()),
    ),
  );

  // return capScrewMounts;
  body = subtract(body, capScrewMounts);
  return body;
  // return  cutAngleBody;
  // return translate([0, 0, cameraCapHeight / 2], body);
}

module.exports = { cameraCap };
