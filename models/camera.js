const {
  primitives: { roundedCuboid, roundedRectangle, cylinder, cuboid, torus },
  booleans: { intersect, subtract, union },
  transforms: { translate, rotate, center, transform },
  measurements: { measureArea, measureBoundingBox },
  geometries: { geom2 },
  maths: { mat4, vec2 },
  extrusions: { extrudeFromSlices, extrudeLinear, slice },
} = require("@jscad/modeling");

const { ropeJoint, ropeJointAngle } = require("./rope");

const { cameraHole35mm } = require("./camera-hole");

const {
  screwMount1_4,
  screwMount1_4Body,
  screwHoleHalfCircularWithSupport,
  screwMountHalfCircularWithSupport,
  screwMountM2_5,
} = require("./screwery");

const {
  Hexagon,
  caseSeparationZ,
  getFrontSeamCurvePoints,
} = require("./utils");

const { cameraMount: cameraMountTangxi } = require("./camera-mount-tangxi");
const { cameraMount: cameraMountSainsmart } = require("./camera-mount-sainsmart");
const { raspberryZeroMount } = require("./raspberryzero-mount");
const { powerConverterMount } = require("./power-converter-mount");
const {
  innerScrewCylinder,
  innerCylinderHeight,
  innerScrew,
  fullPiece,
  bottleCap,
} = require("./screw-thread");
const { cameraCap } = require("./camera-cap");
const {
  trapezoidalSegment,
  trapezoidalRopeTrap,
} = require("./trapezoidal-rope");

const {
  camModel,
  layout,
  segments,
  innerLength,
  innerWidth,
  innerHeight,
  wallThickness,
  roundedRadius,
  lowerFacetHeight,
  lowerFacetInset,
  cameraVerticalOffset,
  usbHoleScrewOuterRadius,
  usbHoleScrewInnerRadius,
  outerLength,
  outerWidth,
  outerHeight,
  centeredLength,
  upperBodyCenteredLength,
  capDistanceToBody,
  capThickness,
  cameraCapHeight,
  usbPortLength,
  usbPortWidth,
  upperBodyOuterLength,
  upperBodyInnerLength,
} = require("./constants");

const cameraMount =
  camModel === "sainsmart" ? cameraMountSainsmart : cameraMountTangxi;

module.exports.main = () => {
  function facetedOuterBody() {
    const bottomZ = -outerHeight / 2;
    const facetTopZ = bottomZ + lowerFacetHeight;
    const topRoundStartZ = outerHeight / 2 - roundedRadius;

    const fullFootprint = roundedRectangle({
      size: [outerLength, outerWidth],
      roundRadius: roundedRadius,
      segments,
    });
    const bottomFootprint = roundedRectangle({
      size: [
        outerLength - 2 * lowerFacetInset,
        outerWidth - 2 * lowerFacetInset,
      ],
      roundRadius: roundedRadius - lowerFacetInset,
      segments,
    });

    const bottomSlice = slice.fromSides(geom2.toSides(bottomFootprint));
    const fullSlice = slice.fromSides(geom2.toSides(fullFootprint));
    const atZ = (profileSlice, z) =>
      slice.transform(
        mat4.fromTranslation(mat4.create(), [0, 0, z]),
        profileSlice,
      );

    const lowerAndVertical = extrudeFromSlices(
      {
        numberOfSlices: 3,
        callback: (_progress, index) => {
          if (index === 0) return atZ(bottomSlice, bottomZ);
          if (index === 1) return atZ(fullSlice, facetTopZ);
          return atZ(fullSlice, topRoundStartZ);
        },
      },
      bottomSlice,
    );

    const roundedTop = intersect(
      roundedCuboid({
        size: [outerLength, outerWidth, outerHeight],
        roundRadius: roundedRadius,
        segments,
      }),
      cuboid({
        size: [outerLength + 2, outerWidth + 2, roundedRadius],
        center: [0, 0, outerHeight / 2 - roundedRadius / 2],
      }),
    );

    return union(lowerAndVertical, roundedTop);
  }

  function fullBody() {
    const outerCuboid = facetedOuterBody();

    const innerCuboid = roundedCuboid({
      size: [innerLength, innerWidth, innerHeight],
      roundRadius: roundedRadius,
      segments,
    });

    return subtract(outerCuboid, innerCuboid);
  }

  /**
   * @param {() => import("@jscad/modeling/src/geometries/types").Geom3} createFastener
   * @param {number} z
   * @returns {import("@jscad/modeling/src/geometries/types").Geom3}
   */
  function sideCaseFasteners(createFastener, z) {
    /** @type {import("@jscad/modeling/src/geometries/types").Geom3[]} */
    const fasteners = layout.caseScrewX.flatMap((x) =>
      [1, -1].map((ySign) =>
        translate(
          [x, (ySign * outerWidth) / 2, z],
          rotate(
            [Math.PI, 0, (ySign * Math.PI) / 2],
            createFastener(),
          ),
        ),
      ),
    );
    return union(fasteners);
  }

  function cameraCutout() {
    return translate(
      [centeredLength / 2, 0, cameraVerticalOffset],
      rotate([0, Math.PI / 2, 0], cameraHole35mm()),
    );
  }

  function lowerBody() {
    const separationZ = caseSeparationZ();
    const upperHeight = outerHeight / 2 - separationZ;
    const upperHalfSpace = cuboid({
      size: [outerLength + 2, outerWidth + 2, upperHeight + 2],
      center: [0, 0, separationZ + (upperHeight + 2) / 2],
    });

    const frontCurve = getFrontSeamCurvePoints();
    const frontNotch2D = geom2.fromPoints(
      [
        ...frontCurve,
        [frontCurve[frontCurve.length - 1][0], separationZ + 1],
        [frontCurve[0][0], separationZ + 1],
      ].map((point) => vec2.fromValues(point[0], point[1])),
    );

    const frontNotchDepth = wallThickness + 2;
    const frontNotch = transform(
      mat4.fromValues(
        0, 1, 0, 0,
        0, 0, 1, 0,
        1, 0, 0, 0,
        innerLength / 2 - 1, 0, 0, 1,
      ),
      extrudeLinear({ height: frontNotchDepth }, frontNotch2D),
    );

    return subtract(
      subtract(fullBody(), upperHalfSpace),
      frontNotch,
    );
  }

  function lowerBodyWithJoint() {
    let body = subtract(lowerBody(), trapezoidalRopeTrap());
    // let body = union(lowerBody(), trapezoidalRopeTrap());

    // Gx12 bottom hole.
    const { x: Gx12XOffset, y: Gx12YOffset } = layout.gx12;
    const gx12BottomHole = translate(
      [Gx12XOffset, Gx12YOffset, -outerHeight / 2],
      cylinder({ radius: 6, height: 10, segments }),
    );
    // Gx12 hex hole for nut
    const gx12HexHole = translate(
      [Gx12XOffset, Gx12YOffset, -2 - innerHeight / 2],
      Hexagon(18, 10),
    );
    body = subtract(body, gx12BottomHole, gx12HexHole);

    // Power converter mount
    if (layout.hasPowerConverter) {  
        const powerConverterMountPiece = translate(
          [layout.powerConverter.x, layout.powerConverter.y, -innerHeight / 2],
          rotate([0, 0, Math.PI / 2], powerConverterMount()),
        );
        body = union(body, powerConverterMountPiece);
    }


    // Camera body 1/4 screw mount on the bottom
    // First we need to substract the whole area then add the screw mount shape
    const bottomScrewMountBody = translate(
      [layout.bottomScrewMount.x, layout.bottomScrewMount.y, -outerHeight / 2],
      screwMount1_4Body(),
    );
    body = subtract(body, bottomScrewMountBody);

    const bottomScrewMount = translate(
      [layout.bottomScrewMount.x, layout.bottomScrewMount.y, -outerHeight / 2],
      screwMount1_4(),
    );
    body = union(body, bottomScrewMount);

    // Raspberry Pi 0 mount
    const raspberryPi0MountPiece = translate(
      [layout.raspberryPi.x, layout.raspberryPi.y, -innerHeight / 2],
      rotate([0, 0, 0], raspberryZeroMount()),
    );
    body = union(body, raspberryPi0MountPiece);

    // Usb hole with screw thread
    // Main cylinder subtract
    const { x: usbHoleX, y: usbHoleY } = layout.usbHole;
    const innerCylinder = innerScrewCylinder({
      majorRadius: usbHoleScrewOuterRadius,
    });
    body = subtract(
      body,
      translate([usbHoleX, usbHoleY, -outerHeight / 2], innerCylinder),
    );

    // Inner screw thread
    const innerScrewThreadHole = innerScrew({
      gripRibs: false,
      gripRibCount: 0,
      majorRadius: usbHoleScrewOuterRadius,
    });

    body = union(
      body,
      translate([usbHoleX, usbHoleY, -outerHeight / 2], innerScrewThreadHole),
    );

    // subtract torus shape for 1mm joint at the bottom.
    const torusShape = translate(
      [usbHoleX, usbHoleY, 10 - outerHeight / 2],
      torus({
        innerRadius: 0.5,
        outerRadius: usbHoleScrewInnerRadius + 0.5,
        innerSegments: segments,
        outerSegments: segments,
      }),
    );

    // return torusShape;
    body = subtract(body, torusShape);

    // Usb hole 17.6 by 9
    const usbHole = translate(
      [usbHoleX, usbHoleY, -outerHeight / 2 + innerCylinderHeight()],
      rotate(
        [0, 0, 0],
        roundedCuboid({
          size: [usbPortLength, usbPortWidth, 6],
          roundRadius: 1,
        }),
      ),
    );
    body = subtract(body, usbHole);

    // Camera sensor screw mount stays attached to the lower body.
    const sensorScrewMount = cameraMount({
      ...(layout.cameraMountCall || {}),
      zOffset: cameraVerticalOffset,
    });
    body = union(body, sensorScrewMount);

    const caseScrewMounts = sideCaseFasteners(
      screwHoleHalfCircularWithSupport,
      caseSeparationZ(),
    );

    return union(body, caseScrewMounts);
  }

  function upperBodyWithCap() {
    return union(
      upperBody(),
      translate(layout.cameraCapTranslate, cameraCap()),
    );
  }

  function upperBody() {
    let body = subtract(fullBody(), lowerBody());
    body = subtract(body, cameraCutout());

    // Case screw mounts on the top side, face down to limit water ingress.
    const caseScrewMounts = sideCaseFasteners(
      screwMountHalfCircularWithSupport,
      caseSeparationZ() + 6,
    );

    // Now we need to add 2 M2.5 screw mounts  on each side to support the cap.
    // We also need to provide 45° edge support for 3d printing convenience.
    // In this case we need to add support on the top of the screw mounts.
    // Because we will print that piece upside down.....

    const [capScrewXPos, capScrewXNeg] = layout.capScrewX;
    const capScrewMounts = union(
      translate(
        [capScrewXPos, outerWidth / 2, outerHeight / 4],
        rotate([Math.PI / 2, 0, Math.PI], screwMountM2_5({ additionalHeight: 5 })),
      ),
      translate(
        [capScrewXNeg, outerWidth / 2, outerHeight / 4],
        rotate([Math.PI / 2, 0, Math.PI], screwMountM2_5({ additionalHeight: 5 })),
      ),
      translate(
        [capScrewXPos, -(outerWidth / 2), outerHeight / 4],
        rotate([Math.PI / 2, 0, 0], screwMountM2_5({ additionalHeight: 5 })),
      ),
      translate(
        [capScrewXNeg, -(outerWidth / 2), outerHeight / 4],
        rotate([Math.PI / 2, 0, 0], screwMountM2_5({ additionalHeight: 5 })),
      ),
    );

    return union(body, caseScrewMounts, capScrewMounts);
  }

  function printable() {
    const capPiece = bottleCap({
      majorRadius: usbHoleScrewOuterRadius - 0.4,
      flangeRadius: 15,
      innerBoreRadius: usbHoleScrewOuterRadius - 3,
    });
    return union(
      translate([0, -innerWidth * 2, outerHeight / 2], lowerBodyWithJoint()),
      translate(
        [0, innerWidth * 2, outerHeight / 2],
        rotate([0, Math.PI, Math.PI], upperBody()),
      ),
      translate([50, 0, 0], rotate([0, 0, 0], capPiece)),
      translate(
        [-50, 0, cameraCapHeight - 1],
        rotate([0, Math.PI, Math.PI], cameraCap()),
      ),
    );
  }

  function thread2Parts() {
    const inner = innerScrew({
      gripRibs: false,
      gripRibCount: 0,
      majorRadius: usbHoleScrewOuterRadius,
    });
    const outer = bottleCap({
      majorRadius: usbHoleScrewOuterRadius - 0.4,
      flangeRadius: 15,
      innerBoreRadius: usbHoleScrewOuterRadius - 3,
    });

    return subtract(
      union(
        translate([0, 0, 14], rotate([0, 0, 0], inner)),
        translate([0, 0, 0], outer),
      ),
      cuboid({ size: [100, 100, 100], center: [0, 50, 0] }),
    );
  }

  function printAllChecks() {
    return union(
      translate([0, 0, 40], union(lowerBodyWithJoint(), upperBody())),
      translate([0, -100, 20], upperBodyWithCap()),
      translate([0, 70, 10], thread2Parts()),
      translate([-150, 0, 40], union(lowerBodyWithJoint(), upperBodyWithCap())),
      translate([-150, -100, 25], upperBody()),
      translate([-150, 100, 40], lowerBodyWithJoint()),
    );
  }

  // return translate([0, 0, 50], lowerBodyWithJoint());
  // return printAllChecks();
  return printable();
};
