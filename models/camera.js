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
  screwMountM2,
  screwMountM2_5,
  screwMount1_4,
  screwMount1_4Body,
} = require("./screwery");
const { cameraMount } = require("./camera-mount");
const { raspberryZeroMount } = require("./raspberryzero-mount");
const { powerConverterMount } = require("./power-converter-mount");

module.exports.main = () => {
  // Camera case main dimensions
  // We consider xyz as lwh, length width height

  const innerLength = 90;
  const innerWidth = 45;
  const innerHeight = 45;

  const wallThickness = 4;
  const roundedRadius = 2.5;

  const cameraMountHoleSpacing = 27;
  const cameraSensorLength = 18;

  const outerLength = innerLength + 2 * wallThickness;
  const outerWidth = innerWidth + 2 * wallThickness;
  const outerHeight = innerHeight + 2 * wallThickness;

  const centeredWidth = (outerWidth + innerWidth) / 2;
  const centeredLength = (outerLength + innerLength) / 2;
  const centeredHeight = (outerHeight + innerHeight) / 2;

  const ropeDimensions = { centeredLength, centeredWidth, centeredHeight };

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
      center: [(outerWidth / 2) * -1, 0, outerHeight / 2],
      roundRadius: roundedRadius,
    });

    // Camera hole
    return subtract(fullBody(), toRemove)
  }

  function upperBody() {
    // Raspberry Pi 0 mount
    const raspberryPi0MountPiece = translate(
      [-12, 0, innerHeight / 2],
      rotate([0, Math.PI , 0], raspberryZeroMount())
    );
    return union(subtract(fullBody(), lowerBody()), raspberryPi0MountPiece);
  }

  function lowerBodyWithJoint() {
    const cam = translate(
      [47, 0, 0],
      rotate([0, Math.PI / 2, 0], cameraHole33mm()),
    );

    //Camera sensor screw mount
    const sensorScrewMount = cameraMount({
      innerLength: innerLength / 2,
      cameraMountHoleSpacing,
    });

    // Camera body 1/4 screw mount on the bottom
    const bottomScrewMount = translate(
      [18, 0, -outerHeight / 2],
      screwMount1_4(),
    );
    const bottomScrewMountBody = translate(
      [18, 0, -outerHeight / 2],
      screwMount1_4Body(),
    );

    // Gx12 bottom hole.
    const gx12BottomHole = translate(
      [-5, 0, -outerHeight / 2],
      cylinder({ radius: 6, height: 10, segments: 128 }),
    );

    // Power converter mount
    const powerConverterMountPiece = translate(
      [-5, 14, -innerHeight / 2],
      rotate([ 0,0, Math.PI / 2], powerConverterMount())
    );

    // Camera body 1/4 screw mount on the top
    return union(
      subtract(lowerBody(), ropeJoint(ropeDimensions), cam, bottomScrewMountBody, gx12BottomHole),
      sensorScrewMount,
      bottomScrewMount,
      powerConverterMountPiece,
    );
  }

  function upperBodyWithJoint() {
    return subtract(upperBody(), ropeJoint(ropeDimensions));
  }

  // return upperBodyWithJoint();
  return lowerBodyWithJoint();
  // return ropeJointAngle(0, 0, 0);
  // return ropeJoint(ropeDimensions);
  // return cameraHole();
  //return screwMount1_4();
  // return raspberryZeroMount();
};
