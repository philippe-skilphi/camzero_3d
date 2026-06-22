const {
  primitives: { roundedCuboid, cylinder },
  booleans: { subtract, union },
  transforms: { translate, rotate },
} = require("@jscad/modeling");
const { ropeJoint } = require("./rope");
const {
  cameraHole,
  cameraHole33mm,
  cameraHole31_6mm,
  cameraHole30mm,
} = require("./camera-hole");
const {
  screwMount1_4,
  screwMount1_4Body,
  screwMountHalfCircular,
  screwHoleHalfCircular,
  screwMountM2_5,
} = require("./screwery");
const { cameraMount } = require("./camera-mount");
const { raspberryZeroMount } = require("./raspberryzero-mount");
const { powerConverterMount } = require("./power-converter-mount");
const { bottleNeck, cap } = require("./screw-thread");
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
      // center: [(outerWidth / 2) * -1, 0, outerHeight / 2],
      center: [(centeredLength / 4) * -1, 0, outerHeight / 2],
      roundRadius: roundedRadius,
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
      rotate([0, Math.PI / 2, 0], cameraHole30mm()),
    );
    body = subtract(body, cam);

    //Camera sensor screw mount
    const sensorScrewMount = cameraMount({
      innerLength: innerLength / 2,
    });
    body = union(body, sensorScrewMount);

    // Gx12 bottom hole.
    const gx12BottomHole = translate(
      [-5, 0, -outerHeight / 2],
      cylinder({ radius: 6, height: 10, segments: 128 }),
    );
    body = subtract(body, gx12BottomHole);

    // Power converter mount
    const powerConverterMountPiece = translate(
      [-15, 14, -innerHeight / 2],
      rotate([0, 0, Math.PI / 2], powerConverterMount()),
    );
    body = union(body, powerConverterMountPiece);

    // Raspberry Pi 0 mount
    const raspberryPi0MountPiece = translate(
      [-12, -8, -innerHeight / 2],
      rotate([0, 0, 0], raspberryZeroMount()),
    );
    body = union(body, raspberryPi0MountPiece);

    // Camera body 1/4 screw mount on the bottom
    // First we need to substract the whole area then add the screw mount shape
    const bottomScrewMountBody = translate(
      [18, 0, -outerHeight / 2],
      screwMount1_4Body(),
    );
    body = subtract(body, bottomScrewMountBody);

    const bottomScrewMount = translate(
      [18, 0, -outerHeight / 2],
      screwMount1_4(),
    );
    body = union(body, bottomScrewMount);

    // Usb screw neck
    const neck = translate(
      [usbHoleRelativeX, 0, -centeredHeight / 2],
      rotate(
        [Math.PI, 0, 0],
        bottleNeck({
          majorRadius: usbHoleScrewOuterRadius,
          pitch: 2,
          clearance: 0.5,
          innerBoreRadius: usbHoleScrewInnerRadius,
        }),
      ),
    );

    // Usb hole 17.6 by 9
    const usbHole = translate(
      [usbHoleRelativeX, 0, -centeredHeight / 2],
      rotate(
        [0, 0, Math.PI / 2],
        roundedCuboid({
          size: [17.6, 9, 6],
          roundRadius: 1,
        }),
      ),
    );

    // Case screw threads hole, using M3 * 6mm
    // on the x axis 2 screws per side, one in the middle, one at 3/4
    // on the y axis, one in the middle.

    // const caseScrewThreadsHoleBody = translate([0, outerWidth / 2 + 1.5, -6], screwMountM3Body());
    // body = subtract(body, caseScrewThreadsHoleBody);

    // const caseScrewThreadsHole = translate([0, outerWidth / 2 + 1.5, -6], screwMountM3());
    // body = union(body, caseScrewThreadsHole);

    body = subtract(union(body, neck), usbHole);

    const caseScrewMounts = union(
      translate(
        [10, outerWidth / 2, 0],
        rotate([Math.PI, 0, Math.PI / 2], screwHoleHalfCircular()),
      ),
      translate(
        [10, -outerWidth / 2, 0],
        rotate([Math.PI, 0, -Math.PI / 2], screwHoleHalfCircular()),
      ),
      translate(
        [-25, outerWidth / 2, 0],
        rotate([Math.PI, 0, Math.PI / 2], screwHoleHalfCircular()),
      ),
      translate(
        [-25, -outerWidth / 2, 0],
        rotate([Math.PI, 0, -Math.PI / 2], screwHoleHalfCircular()),
      ),
      translate(
        [-outerLength / 2, 0, 0],
        rotate([Math.PI, 0, -Math.PI], screwHoleHalfCircular()),
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
        rotate([Math.PI, 0, Math.PI / 2], screwMountHalfCircular()),
      ),
      translate(
        [10, -outerWidth / 2, 6],
        rotate([Math.PI, 0, -Math.PI / 2], screwMountHalfCircular()),
      ),
      translate(
        [-25, outerWidth / 2, 6],
        rotate([Math.PI, 0, Math.PI / 2], screwMountHalfCircular()),
      ),
      translate(
        [-25, -outerWidth / 2, 6],
        rotate([Math.PI, 0, -Math.PI / 2], screwMountHalfCircular()),
      ),
      translate(
        [-outerLength / 2, 0, 6],
        rotate([Math.PI, 0, -Math.PI], screwMountHalfCircular()),
      ),
    );

    // Now we need to add 2 M2.5 screw mounts  on each side to support the cap.
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
    const capPiece = cap({
      majorRadius: usbHoleScrewOuterRadius,
      pitch: 2,
      clearance: 0.5,
    });
    return union(
      translate([0, -innerWidth * 2,(outerHeight / 2) + 7], lowerBodyWithJoint()),
      translate(
        [0, innerWidth * 2, outerHeight / 2],
        rotate(
          [0, Math.PI, Math.PI],
          upperBodyWithJoint(),
        ),
      ),
      translate([50, 0, 9], rotate([Math.PI, 0,0], capPiece)),
      translate([-50, 0, cameraCapHeight], 
        rotate([0, Math.PI, Math.PI], cameraCap()),
      ),
    );
  }

  return printable();

  //return cameraCap();
  // return upperBodyWithJoint();
  // return lowerBodyWithJoint();
  // return ropeJointAngle(0, 0, 0);
  // return ropeJoint();
  // return cameraHole();
  // return screwMount1_4();
  // return raspberryZeroMount();
  // return lowerBodyWithJoint();
  // return union(lowerBodyWithJoint(), upperBodyWithJoint());

  // return upperBodyWithCap();
};
