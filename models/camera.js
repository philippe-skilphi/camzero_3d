const {
  primitives: { roundedCuboid, cylinder, cuboid },
  booleans: { subtract, union },
  transforms: { translate, rotate },
} = require("@jscad/modeling");

const { ropeJoint } = require("./rope");

const { cameraHole31_6mm } = require("./camera-hole");

const {
  screwMount1_4,
  screwMount1_4Body,
  screwHoleHalfCircularWithSupport,
  screwMountHalfCircularWithSupport,
  screwMountM2_5,
} = require("./screwery");

const { cameraMount } = require("./camera-mount");
const { raspberryZeroMount } = require("./raspberryzero-mount");
const { powerConverterMount } = require("./power-converter-mount");
const { innerScrewCylinder, innerCylinderHeight, innerScrew, fullPiece, bottleCap } = require("./screw-thread");
const { cameraCap } = require("./camera-cap");

const {
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
  centeredHeight,
  capDistanceToBody,
  capThickness,
  cameraCapHeight,
} = require("./constants");

module.exports.main = () => {
  function fullBody() {
    const outerCuboid = roundedCuboid({
      size: [outerLength, outerWidth, outerHeight],
      roundRadius: roundedRadius,
    });

    const innerCuboid = roundedCuboid({
      size: [innerLength, innerWidth, innerHeight],
      roundRadius: roundedRadius,
    });

    return subtract(outerCuboid, innerCuboid);
  }

  function lowerBody() {
    const toRemove = roundedCuboid({
      size: [outerLength, outerWidth + 10, outerHeight],
      center: [(centeredLength / 4) * -1, 0, outerHeight / 2],
      roundRadius: 2.5,
    });

    return subtract(fullBody(), toRemove);
  }

  function upperBody() {
    return subtract(fullBody(), lowerBody());
  }

  function lowerBodyWithJoint() {
    let body = subtract(lowerBody(), ropeJoint());

    // Camera sensor hole
    const cam = translate(
      [47, 0, 0],
      rotate([0, Math.PI / 2, 0], cameraHole31_6mm()),
    );
    body = subtract(body, cam);

    //Camera sensor screw mount
    const sensorScrewMount = cameraMount({
      innerLength: innerLength / 2,
    });
    body = union(body, sensorScrewMount);

    // Gx12 bottom hole.
    const gx12BottomHole = translate(
      [-12, 14, -outerHeight / 2],
      cylinder({ radius: 6, height: 10, segments: 128 }),
    );
    body = subtract(body, gx12BottomHole);

    // Power converter mount
    const powerConverterMountPiece = translate(
      [-2, -20, -innerHeight / 2],
      rotate([0, 0, Math.PI / 2], powerConverterMount()),
    );
    body = union(body, powerConverterMountPiece);

    // Camera body 1/4 screw mount on the bottom
    // First we need to substract the whole area then add the screw mount shape
    const bottomScrewMountBody = translate(
      [9, 0, -outerHeight / 2],
      screwMount1_4Body(),
    );
    body = subtract(body, bottomScrewMountBody);

    const bottomScrewMount = translate(
      [9, 0, -outerHeight / 2],
      screwMount1_4(),
    );
    body = union(body, bottomScrewMount);

    // Raspberry Pi 0 mount
    const raspberryPi0MountPiece = translate(
      [-10, 11, -innerHeight / 2],
      rotate([0, 0, 0], raspberryZeroMount()),
    );
    body = union(body, raspberryPi0MountPiece);

    const innerCylinder = innerScrewCylinder({majorRadius: usbHoleScrewOuterRadius,});
    body = subtract(
      body,
      translate([usbHoleRelativeX, -12, -outerHeight / 2], innerCylinder),
    );

    const innerScrewThreadHole = innerScrew({
      gripRibs: false,
      gripRibCount: 0,
      majorRadius: usbHoleScrewOuterRadius,
    });

    body = union(
      body,
      translate([usbHoleRelativeX, -12, -outerHeight / 2], innerScrewThreadHole),
    );

    // Usb hole 17.6 by 9
    const usbHole = translate(
      [usbHoleRelativeX, -12, -outerHeight / 2 + innerCylinderHeight()],
      rotate(
        [0, 0, 0],
        roundedCuboid({
          size: [17.6, 9, 6],
          roundRadius: 1,
        }),
      ),
    );
    body = subtract(body, usbHole);

    const caseScrewMounts = union(
      translate(
        [10, outerWidth / 2, 0],
        rotate([Math.PI, 0, Math.PI / 2], screwHoleHalfCircularWithSupport()),
      ),
      translate(
        [10, -outerWidth / 2, 0],
        rotate([Math.PI, 0, -Math.PI / 2], screwHoleHalfCircularWithSupport()),
      ),
      translate(
        [-25, outerWidth / 2, 0],
        rotate([Math.PI, 0, Math.PI / 2], screwHoleHalfCircularWithSupport()),
      ),
      translate(
        [-25, -outerWidth / 2, 0],
        rotate([Math.PI, 0, -Math.PI / 2], screwHoleHalfCircularWithSupport()),
      ),
      translate(
        [-outerLength / 2, 0, 0],
        rotate([Math.PI, 0, -Math.PI], screwHoleHalfCircularWithSupport()),
      ),
    );

    return union(body, caseScrewMounts);
  }

  function upperBodyWithCap() {
    return union(
      upperBodyWithJoint(),
      translate([0, 0, capDistanceToBody + capThickness], cameraCap()),
    );
  }

  function upperBodyWithJoint() {
    let body = subtract(upperBody(), ropeJoint());

    // Case screw mounts on the top side, face down to limit water ingress.
    const caseScrewMounts = union(
      translate(
        [10, outerWidth / 2, 6],
        rotate([Math.PI, 0, Math.PI / 2], screwMountHalfCircularWithSupport()),
      ),
      translate(
        [10, -outerWidth / 2, 6],
        rotate([Math.PI, 0, -Math.PI / 2], screwMountHalfCircularWithSupport()),
      ),
      translate(
        [-25, outerWidth / 2, 6],
        rotate([Math.PI, 0, Math.PI / 2], screwMountHalfCircularWithSupport()),
      ),
      translate(
        [-25, -outerWidth / 2, 6],
        rotate([Math.PI, 0, -Math.PI / 2], screwMountHalfCircularWithSupport()),
      ),
      translate(
        [-outerLength / 2, 0, 6],
        rotate([Math.PI, 0, -Math.PI], screwMountHalfCircularWithSupport()),
      ),
    );

    // Now we need to add 2 M2.5 screw mounts  on each side to support the cap.
    // We also need to provide 45° edge support for 3d printing convenience.
    // In this case we need to add support on the top of the screw mounts.
    // Because we will print that piece upside down.....

    const capScrewMounts = union(
      translate(
        [5, outerWidth / 2, outerHeight / 4],
        rotate([Math.PI / 2, 0, Math.PI], screwMountM2_5()),
      ),
      translate(
        [-25, outerWidth / 2, outerHeight / 4],
        rotate([Math.PI / 2, 0, Math.PI], screwMountM2_5()),
      ),
      translate(
        [5, -(outerWidth / 2), outerHeight / 4],
        rotate([Math.PI / 2, 0, 0], screwMountM2_5()),
      ),
      translate(
        [-25, -(outerWidth / 2), outerHeight / 4],
        rotate([Math.PI / 2, 0, 0], screwMountM2_5()),
      ),
    );

    return union(body, caseScrewMounts, capScrewMounts);
  }

  function printable() {
    const capPiece = bottleCap();
    return union(
      translate(
        [0, -innerWidth * 2, outerHeight / 2],
        lowerBodyWithJoint(),
      ),
      translate(
        [0, innerWidth * 2, outerHeight / 2],
        rotate([0, Math.PI, Math.PI], upperBodyWithJoint()),
      ),
      translate([50, 0, 0], rotate([0 , 0, 0], capPiece)),
      translate(
        [-50, 0, cameraCapHeight-1],
        rotate([0, Math.PI, Math.PI], cameraCap()),
      ),
    );
  }

  // return bottleCap({
  //   majorRadius: usbHoleScrewOuterRadius,
  //   pitch: 2,
  //   clearance: 0.5,
  //   innerBoreRadius: usbHoleScrewInnerRadius,
  // });

  // return rotate([0, Math.PI / 2, 0], fullPiece());
  // return cameraCap();
  // return upperBodyWithJoint();
  // return translate([0, 0, outerHeight / 2], lowerBodyWithJoint());
  // return ropeJointAngle(0, 0, 0);
  // return ropeJoint();
  // return cameraHole();
  // return screwMount1_4();
  // return raspberryZeroMount();
  return lowerBodyWithJoint();
  // return union(lowerBodyWithJoint(), upperBodyWithJoint());
  // return upperBodyWithJoint();
  // return upperBodyWithCap();
  return printable();
};
