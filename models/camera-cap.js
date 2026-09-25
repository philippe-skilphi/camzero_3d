const {
  primitives: { roundedCuboid, cuboid },
  booleans: { union, subtract },
  transforms: { translate, rotate },
} = require("@jscad/modeling");

const { screwHole } = require("./screwery");

const {
  layout,
  cameraCapTopLength,
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
  capRearClearance,
  capRearVerticalClearance,
} = require("./constants");
const { facetedRoundedCuboid } = require("./faceted-rounded-cuboid");

function cameraCap() {
  const booleanOverlap = 0.5;
  const capShellTop = cameraCapHeight - capThickness / 2;
  const caseRearX = -outerLength / 2 - layout.cameraCapTranslate[0];
  const rearWallInnerX = caseRearX - capRearClearance;
  const rearWallOuterX = rearWallInnerX - capThickness;
  const rearWallBottomZ =
    outerHeight / 2 -
    layout.cameraCapTranslate[2] +
    capRearVerticalClearance;
  const rearWallHeight = capShellTop- rearWallBottomZ;

  let body = facetedRoundedCuboid({
    size: [
      cameraCapTopLength,
      cameraCapOuterWidth,
      cameraCapHeight - capThickness,
    ],
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

  const cutBackDepth = cameraCapTopLength;
  const cutBackBody = cuboid({
    size: [cutBackDepth, cameraCapOuterWidth, cameraCapHeight],
    center: [
      rearWallOuterX - cutBackDepth / 2,
      0,
      cameraCapHeight / 2,
    ],
  });

  body = subtract(body, cutAngleBody,);
  body = subtract(body, cutFrontBody);
  body = subtract(body, cutBackBody);

  const rearWall = cuboid({
    size: [
      capThickness,
      cameraCapInnerWidth + 2 * booleanOverlap,
      rearWallHeight,
    ],
    center: [
      (rearWallInnerX + rearWallOuterX) / 2,
      0,
      rearWallBottomZ + rearWallHeight / 2,
    ],
  });
  body = union(body, rearWall);

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
