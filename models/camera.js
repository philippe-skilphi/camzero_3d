const {
  primitives: { roundedCuboid, cylinder, cuboid, torus },
  booleans: { subtract, union },
  transforms: { translate, rotate, center },
  measurements: { measureArea, measureBoundingBox },
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

const { Hexagon, lowerBodyOuterHeight, getSizes } = require("./utils");

const { cameraMount } = require("./camera-mount");
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
  segments,
  innerLength,
  innerWidth,
  innerHeight,
  roundedRadius,
  usbHoleRelativeX,
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
  upperToLowerHeightRatio,
  upperBodyOuterLength,
  upperBodyInnerLength,
} = require("./constants");

module.exports.main = () => {
  function fullBody() {
    const outerCuboid = roundedCuboid({
      size: [outerLength, outerWidth, outerHeight],
      roundRadius: roundedRadius,
      segments,
    });

    const innerCuboid = roundedCuboid({
      size: [innerLength, innerWidth, innerHeight],
      roundRadius: roundedRadius,
      segments,
    });

    return subtract(outerCuboid, innerCuboid);
  }

  function lowerBody() {
    const toRemove = roundedCuboid({
      size: [outerLength, outerWidth + 30, outerHeight],
      center: [upperBodyCenteredLength - centeredLength, 0, lowerBodyOuterHeight()],
      roundRadius: 10,
      segments,
    });

    return subtract(fullBody(), toRemove);
  }

  function upperBody() {
    return subtract(fullBody(), lowerBody());
  }

  function lowerBodyWithJoint() {

    let body = subtract(lowerBody(), ropeJoint());
    // return ropeJoint();
    // return body;

    // Gx12 bottom hole.
    const Gx12XOffset = -8;
    const Gx12YOffset = -18;
    const gx12BottomHole = translate(
      [Gx12XOffset, Gx12YOffset, -outerHeight / 2],
      cylinder({ radius: 6, height: 10, segments }),
    );
    // Gx12 hex hole for nut
    const gx12HexHole = translate(
      [Gx12XOffset, Gx12YOffset, -1 - innerHeight / 2],
      Hexagon(16, 6),
    );
    body = subtract(body, gx12BottomHole, gx12HexHole);

    // Power converter mount
    const powerConverterMountPiece = translate(
      [8, -20, -innerHeight / 2],
      rotate([0, 0, Math.PI / 2], powerConverterMount()),
    );
    body = union(body, powerConverterMountPiece);

    // Camera body 1/4 screw mount on the bottom
    // First we need to substract the whole area then add the screw mount shape
    const bottomScrewMountBody = translate(
      [4, 0, -outerHeight / 2],
      screwMount1_4Body(),
    );
    body = subtract(body, bottomScrewMountBody);

    const bottomScrewMount = translate(
      [4, 0, -outerHeight / 2],
      screwMount1_4(),
    );
    body = union(body, bottomScrewMount);

    // Raspberry Pi 0 mount
    const raspberryPi0MountPiece = translate(
      [-16, 11, -innerHeight / 2],
      rotate([0, 0, 0], raspberryZeroMount()),
    );
    body = union(body, raspberryPi0MountPiece);

    // Usb hole with screw thread
    // Main cylinder subtract
    const innerCylinder = innerScrewCylinder({
      majorRadius: usbHoleScrewOuterRadius,
    });
    body = subtract(
      body,
      translate([usbHoleRelativeX, -12, -outerHeight / 2], innerCylinder),
    );

    // Inner screw thread
    const innerScrewThreadHole = innerScrew({
      gripRibs: false,
      gripRibCount: 0,
      majorRadius: usbHoleScrewOuterRadius,
    });

    body = union(
      body,
      translate(
        [usbHoleRelativeX, -12, -outerHeight / 2],
        innerScrewThreadHole,
      ),
    );

    console.log(usbHoleScrewInnerRadius);
    // subtract torus shape for 1mm joint at the bottom.
    const torusShape = translate(
      [usbHoleRelativeX, -12, 10 - outerHeight / 2],
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
      [usbHoleRelativeX, -12, -outerHeight / 2 + innerCylinderHeight()],
      rotate(
        [0, 0, 0],
        roundedCuboid({
          size: [usbPortLength, usbPortWidth, 6],
          roundRadius: 1,
        }),
      ),
    );
    body = subtract(body, usbHole);

    // Camera sensor hole
    const cam = translate(
      [centeredLength / 2, 0, 0],
      rotate([0, Math.PI / 2, 0], cameraHole35mm()),
    );
    body = subtract(body, cam);

    //Camera sensor screw mount
    const sensorScrewMount = cameraMount();
    body = union(body, sensorScrewMount);


    const caseScrewMounts = union(
      translate(
        [15, outerWidth / 2,lowerBodyOuterHeight() - (outerHeight / 2)],
        rotate([Math.PI, 0, Math.PI / 2], screwHoleHalfCircularWithSupport()),
      ),
      translate(
        [15, -outerWidth / 2, lowerBodyOuterHeight() - (outerHeight / 2)],
        rotate([Math.PI, 0, -Math.PI / 2], screwHoleHalfCircularWithSupport()),
      ),
      translate(
        [-30, outerWidth / 2, lowerBodyOuterHeight() - (outerHeight / 2)],
        rotate([Math.PI, 0, Math.PI / 2], screwHoleHalfCircularWithSupport()),
      ),
      translate(
        [-30, -outerWidth / 2, lowerBodyOuterHeight() - (outerHeight / 2)],
        rotate([Math.PI, 0, -Math.PI / 2], screwHoleHalfCircularWithSupport()),
      ),
      translate(
        [-outerLength / 2, 0, lowerBodyOuterHeight() - (outerHeight / 2)],
        rotate([Math.PI, 0, -Math.PI], screwHoleHalfCircularWithSupport()),
      ),
      translate(
        [outerLength / 2 - (centeredLength - upperBodyCenteredLength), -outerWidth / 2, (outerHeight - lowerBodyOuterHeight()) / 3],
        rotate([-Math.PI / 2, 0, -Math.PI / 2 ], screwHoleHalfCircularWithSupport()),
      ),
      translate(
        [outerLength / 2 - (centeredLength - upperBodyCenteredLength), outerWidth / 2, (outerHeight - lowerBodyOuterHeight()) / 3],
        rotate([Math.PI / 2, 0, Math.PI / 2 ], screwHoleHalfCircularWithSupport()),
      ),
    );

    return union(body, caseScrewMounts);
  }

  function upperBodyWithCap() {
    return union(
      upperBody(),
      translate([10, 0, 3], cameraCap()),
    );
  }

  function upperBody() {

    let body = subtract(fullBody(), lowerBody());
    // body = subtract(body, ropeJoint());

    // Case screw mounts on the top side, face down to limit water ingress.
    const screwMountZOffset = 6 + lowerBodyOuterHeight() - outerHeight / 2;
    const caseScrewMounts = union(
      translate(
        [15, outerWidth / 2, screwMountZOffset],
        rotate([Math.PI, 0, Math.PI / 2], screwMountHalfCircularWithSupport()),
      ),
      translate(
        [15, -outerWidth / 2, screwMountZOffset],
        rotate([Math.PI, 0, -Math.PI / 2], screwMountHalfCircularWithSupport()),
      ),
      translate(
        [-30, outerWidth / 2, screwMountZOffset],
        rotate([Math.PI, 0, Math.PI / 2], screwMountHalfCircularWithSupport()),
      ),
      translate(
        [-30, -outerWidth / 2, screwMountZOffset],
        rotate([Math.PI, 0, -Math.PI / 2], screwMountHalfCircularWithSupport()),
      ),
      translate(
        [-outerLength / 2, 0, screwMountZOffset],
        rotate([Math.PI, 0, -Math.PI], screwMountHalfCircularWithSupport()),
      ),
      translate(
        [outerLength / 2 - (centeredLength - upperBodyCenteredLength) - 6.1, -outerWidth / 2, (outerHeight - lowerBodyOuterHeight()) / 3],
        rotate([-Math.PI / 2, 0, -Math.PI / 2 ], screwMountHalfCircularWithSupport()),
      ),
      translate(
        [outerLength / 2 - (centeredLength - upperBodyCenteredLength) - 6.1, outerWidth / 2, (outerHeight - lowerBodyOuterHeight()) / 3],
        rotate([Math.PI / 2, 0, Math.PI / 2 ], screwMountHalfCircularWithSupport()),
      ),
    );

    // Now we need to add 2 M2.5 screw mounts  on each side to support the cap.
    // We also need to provide 45° edge support for 3d printing convenience.
    // In this case we need to add support on the top of the screw mounts.
    // Because we will print that piece upside down.....

    const capScrewMounts = union(
      translate(
        [15, outerWidth / 2, outerHeight / 4],
        rotate([Math.PI / 2, 0, Math.PI], screwMountM2_5({ additionalHeight: 5 })),
      ),
      translate(
        [-15, outerWidth / 2, outerHeight / 4],
        rotate([Math.PI / 2, 0, Math.PI], screwMountM2_5({ additionalHeight: 5 })),
      ),
      translate(
        [15, -(outerWidth / 2), outerHeight / 4],
        rotate([Math.PI / 2, 0, 0], screwMountM2_5({ additionalHeight: 5 })),
      ),
      translate(
        [-15, -(outerWidth / 2), outerHeight / 4],
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
        translate([0, 0, 6], rotate([0, 0, 0], inner)),
        translate([0, 0, 0], outer),
      ),
      cuboid({ size: [100, 100, 100], center: [0, 50, 0] }),
    );
  }

  // return thread2Parts();

  // return bottleCap({
  //   majorRadius: usbHoleScrewOuterRadius,
  //   pitch: 2,
  //   clearance: 0.5,
  //   innerBoreRadius: usbHoleScrewInnerRadius,
  // });

  // return lowerBodyWithJoint();
  // return rotate([0, Math.PI / 2, 0], fullPiece());
  // return cameraCap();
  // return upperBody();
  // return translate([0, 0, 25], lowerBodyWithJoint());
  // console.log(measureArea(test));
  // return ropeJoint();
  // return cameraHole();
  // return screwMount1_4();
  // return raspberryZeroMount();
  // return translate([0, 0, 20], lowerBodyWithJoint());
  // return union(lowerBodyWithJoint(), upperBody());
  // return upperBody();
  // return upperBodyWithCap();
  return printable();
};
