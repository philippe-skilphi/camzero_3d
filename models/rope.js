const {
  primitives: { cuboid, cylinder, torus },
  booleans: { union, subtract },
  transforms: { translate, rotate, center },
  measurements: { measureBoundingBox },
  geometries: { geom3: {clone} },
} = require("@jscad/modeling");
const {
  centeredWidth,
  centeredHeight,
  roundedRadius,
  largeRoundedRadius,
  outerHeight,
  upperBodyOuterLength,
  upperBodyCenteredLength
} = require("./constants");
const { lowerBodyOuterHeight, getSizes } = require("./utils");

const jointRadius = 0.5;

/**
 * @param {*} width
 * @param {} orientation
 * @returns
 */
function ropeJointSegment(width, orientation) {
  // orientation should be 'x', 'y' or 'z'
  // if orientation is 'x', the cylinder should be parallel to the x-axis
  // if orientation is 'y', the cylinder should be parallel to the y-axis
  // if orientation is 'z', the cylinder should be parallel to the z-axis

  let cyl = cylinder({ radius: 0.5, height: width });

  if (orientation === "x") {
    cyl = rotate([0, Math.PI / 2, 0], cyl);
  } else if (orientation === "y") {
    cyl = rotate([Math.PI / 2, 0, 0], cyl);
  } else if (orientation === "z") {
    cyl = rotate([0, 0, Math.PI / 2], cyl);
  } else {
    throw new Error("Invalid orientation");
  }
  return center({ axes: [true, true, true] }, cyl);
}

/**
 * @param {*} orientation
 * @returns
 */
function ropeJointAngle(
  x = 0,
  y = 0,
  z = 0,
  outerRadius = roundedRadius / 2,
  innerRadius = 0.5,
) {
  const angleBody = torus({
    innerRadius: innerRadius,
    outerRadius: outerRadius,
  });
  const fullRadius = innerRadius + outerRadius;
  // Remove cubes to keep only a 90 degree angle
  const toRemove = [
    translate(
      [0, -fullRadius / 2, 0],
      cuboid({ size: [2 * fullRadius, fullRadius, 2 * innerRadius] }),
    ),
    translate(
      [-fullRadius / 2, fullRadius / 2, 0],
      cuboid({ size: [fullRadius, fullRadius, 2 * innerRadius] }),
    ),
  ];

  const angle = subtract(angleBody, ...toRemove);
  return center({ axes: [true, true, true] }, rotate([x, y, z], angle));
}

function ropeJoint() {

  const smallAngleXY = ropeJointAngle(0, 0, 0, 7.5, 0.5);
  const smallAngleYZ = ropeJointAngle(0, Math.PI / 2, 0, 7.5, 0.5);
  const largeAngleXZ = ropeJointAngle(-Math.PI / 2, 0, 0, largeRoundedRadius, jointRadius);
  
  const smallAngleXYDimensions = getSizes(smallAngleXY);
  const smallAngleYZDimensions = getSizes(smallAngleYZ);
  const largeAngleXZDimensions = getSizes(largeAngleXZ);
 
  const xSegmentLength = upperBodyOuterLength + 1;
  const xSegmentLengthMinusAngles =
    xSegmentLength - smallAngleXYDimensions.x - largeAngleXZDimensions.x;
  const ySegmentLengthMinusAngles =
    centeredWidth - 2 * smallAngleXYDimensions.y;
  const zSegment = outerHeight - lowerBodyOuterHeight() - 2 * jointRadius;
  const zSegmentLengthMinusAngles =
    zSegment - largeAngleXZDimensions.z - smallAngleYZDimensions.z;

  return translate(
      // [0.2, 9.5, -0.2],
      [-largeAngleXZDimensions.x + 1.7, 0, - 0.2 + lowerBodyOuterHeight() - outerHeight / 2],
      union(
        translate(
          [0, centeredWidth / 2, 0],
          ropeJointSegment(xSegmentLengthMinusAngles, "x"),
        ),
        translate(
          [0, -centeredWidth / 2, 0],
          ropeJointSegment(xSegmentLengthMinusAngles, "x"),
        ),
        translate(
          [
            -xSegmentLengthMinusAngles / 2 - smallAngleXYDimensions.x / 2,
            ySegmentLengthMinusAngles / 2 +
              smallAngleXYDimensions.y / 2 +
              jointRadius,
            0,
          ],
          rotate([0, 0, Math.PI / 2], clone(smallAngleXY)),
        ),
        translate(
          [
            -xSegmentLengthMinusAngles / 2 - smallAngleXYDimensions.x / 2,
            -ySegmentLengthMinusAngles / 2 -
              smallAngleXYDimensions.y / 2 -
              jointRadius,
            0,
          ],
          rotate([0, 0, Math.PI], clone(smallAngleXY)),
        ),
        translate(
          [
            -xSegmentLengthMinusAngles / 2 -
              smallAngleXYDimensions.x +
              jointRadius,
            0,
            0,
          ],
          ropeJointSegment(ySegmentLengthMinusAngles + 2 * jointRadius, "y"),
        ),
        translate(
          [
            largeAngleXZDimensions.x / 2 + xSegmentLengthMinusAngles / 2,
            centeredWidth / 2,
            largeAngleXZDimensions.z / 2 - jointRadius,
          ],
          clone(largeAngleXZ),
        ),
        translate(
          [
            largeAngleXZDimensions.x / 2 + xSegmentLengthMinusAngles / 2,
            -centeredWidth / 2,
            largeAngleXZDimensions.z / 2 - jointRadius,
          ],
          clone(largeAngleXZ),
        ),
        translate(
          [
            -jointRadius +
              xSegmentLengthMinusAngles / 2 +
              largeAngleXZDimensions.x,
            centeredWidth / 2,
            -jointRadius +
              largeAngleXZDimensions.z +
              zSegmentLengthMinusAngles / 2,
          ],
          ropeJointSegment(zSegmentLengthMinusAngles, "z"),
        ),
        translate(
          [
            -jointRadius +
              xSegmentLengthMinusAngles / 2 +
              largeAngleXZDimensions.x,
            -centeredWidth / 2,
            -jointRadius +
              largeAngleXZDimensions.z +
              zSegmentLengthMinusAngles / 2,
          ],
          ropeJointSegment(zSegmentLengthMinusAngles, "z"),
        ),
        translate(
          [
            xSegmentLengthMinusAngles / 2 + largeAngleXZDimensions.x - jointRadius,
            centeredWidth / 2 - smallAngleYZDimensions.y / 2 + jointRadius,
            zSegmentLengthMinusAngles + largeAngleXZDimensions.z + smallAngleYZDimensions.z / 2 - jointRadius, 
          ],
          rotate([Math.PI/2, 0, 0], clone(smallAngleYZ)),
        ),
        translate(
          [
            xSegmentLengthMinusAngles / 2 + largeAngleXZDimensions.x - jointRadius,
            -centeredWidth / 2 + smallAngleYZDimensions.y / 2 - jointRadius,
            zSegmentLengthMinusAngles + largeAngleXZDimensions.z + smallAngleYZDimensions.z / 2 - jointRadius, 
          ],
          rotate([Math.PI, 0, 0], clone(smallAngleYZ)),
        ),
        translate(
          [
            xSegmentLengthMinusAngles / 2 + largeAngleXZDimensions.x - jointRadius,
            0,
            // 3x jointRadius because of the two angles and the bottom segment starts at z: -0.5
            zSegment - 2 * jointRadius,
          ],
          ropeJointSegment(ySegmentLengthMinusAngles + 2 * jointRadius, "y"),
        ),
      ),
    );
}

module.exports = {
  ropeJointSegment,
  ropeJointAngle,
  ropeJoint,
};
