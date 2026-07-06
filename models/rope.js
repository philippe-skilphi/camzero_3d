const {
  primitives: { cuboid, cylinder, torus },
  booleans: { union, subtract },
  transforms: { translate, rotate },
} = require("@jscad/modeling");
const { centeredLength, centeredWidth, centeredHeight } = require("./constants");

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

  const cyl = cylinder({ radius: 0.5, height: width });

  if (orientation === "x") {
    return rotate([Math.PI / 2, 0, 0], cyl);
  } else if (orientation === "y") {
    return rotate([0, Math.PI / 2, 0], cyl);
  } else if (orientation === "z") {
    return rotate([0, 0, Math.PI / 2], cyl);
  } else {
    throw new Error("Invalid orientation");
  }
}

/**
 * @param {*} orientation
 * @returns
 */
function ropeJointAngle(x = 0, y = 0, z = 0) {
  const angleBody = torus({ innerRadius: 0.5, outerRadius: 2.5 });
  // Remove cubes to keep only a 90 degree angle
  const toRemove = [
    translate([-2, 0, 0], cuboid({ size: [4, 8, 6] })),
    translate([-3, -3, 0], cuboid({ size: [14, 6, 6] })),
  ];

  const angle = subtract(angleBody, ...toRemove);
  return rotate([x, y, z], angle);
}

function ropeJoint() {
  const angleLength = 1.5;
  const xSegmentLength = (centeredLength * 3) / 4;
  const xSegmentLengthMinusAngles = xSegmentLength - 2 * angleLength;
  const ySegmentLengthMinusAngles = centeredWidth - 4;
  const zSegmentLengthMinusAngles = centeredHeight / 2 - 2 * angleLength - 2;

  return rotate(
    [0, 0, Math.PI / 2],
    translate(
      [0.2, 9.5, -0.2],
      union(
        translate(
          [centeredWidth / 2 , 0.75, 0],
          ropeJointSegment(xSegmentLengthMinusAngles, "x"),
        ),
        translate(
          [centeredWidth / 2 - 2.5, xSegmentLength / 2 - 0.75, 0],
          ropeJointAngle(0, 0, 0),
        ),
        translate(
          [0, xSegmentLength / 2 + 1.75, 0],
          ropeJointSegment(ySegmentLengthMinusAngles, "y"),
        ),
        translate(
          [-centeredWidth / 2 + 2.5, xSegmentLength / 2 - 0.75, 0],
          ropeJointAngle(0, Math.PI, 0),
        ),
        translate(
          [-centeredWidth / 2, 0.75, 0],
          ropeJointSegment(xSegmentLengthMinusAngles, "x"),
        ),
        translate(
          [-centeredWidth / 2, -xSegmentLength / 2 + angleLength + 1, angleLength + 1],
          ropeJointAngle(0, Math.PI / 2, Math.PI),
        ),
        translate(
          [
            -centeredWidth / 2,
            -xSegmentLength / 2,
            zSegmentLengthMinusAngles / 2 + angleLength + 1,
          ],
          ropeJointSegment(zSegmentLengthMinusAngles, "z"),
        ),
        translate(
          [
            -centeredWidth / 2 + angleLength + 1,
            -xSegmentLength / 2,
            zSegmentLengthMinusAngles + angleLength + 1,
          ],
          ropeJointAngle(0, Math.PI * 1.5, Math.PI / 2),
        ),
        translate(
          [
            0,
            -xSegmentLength / 2,
            zSegmentLengthMinusAngles + angleLength * 2 + 2,
          ],
          ropeJointSegment(ySegmentLengthMinusAngles, "y"),
        ),
        translate(
          [
            centeredWidth / 2 - angleLength - 1,
            -xSegmentLength / 2,
            zSegmentLengthMinusAngles + angleLength + 1,
          ],
          ropeJointAngle(Math.PI, Math.PI * 1.5, Math.PI / 2),
        ),
        translate(
          [
            centeredWidth / 2,
            -xSegmentLength / 2,
            zSegmentLengthMinusAngles / 2 + angleLength + 1,
          ],
          ropeJointSegment(zSegmentLengthMinusAngles, "z"),
        ),
        translate(
          [centeredWidth / 2, -xSegmentLength / 2 + angleLength + 1, angleLength + 1],
          ropeJointAngle(0, Math.PI / 2, Math.PI),
        ),
      ),
    ),
  );
}

module.exports = {
  ropeJointSegment,
  ropeJointAngle,
  ropeJoint,
};
