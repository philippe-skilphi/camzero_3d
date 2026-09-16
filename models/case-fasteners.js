const {
  booleans: { subtract, union },
  primitives: { cuboid, cylinder },
  transforms: { translate, rotate },
} = require("@jscad/modeling");

const {
  innerHeight,
  innerLength,
  innerWidth,
  outerHeight,
  roundedRadius,
  segments,
} = require("./constants");
const {
  screwHole,
  screwMountHalfCircularWithSupport,
  screwMountHalfCircularWithSupportHeight,
} = require("./screwery");
const { caseSeparationZ } = require("./utils");

const CASE_SCREW_HOLE_RADIUS = 1.9;
const CASE_SCREW_HEAD_RADIUS = 3;
const CASE_SCREW_HEAD_HEIGHT = 2;
const CASE_SCREW_TOP_SHAFT_HEIGHT = 3;
const CASE_SCREW_MOUNT_RADIUS = 2;
const CASE_SCREW_MOUNT_THICKNESS = 2;
const CASE_SCREW_MOUNT_HOLE_HEIGHT = 6;
const FACE_OVERSHOOT = 0.01;

function caseScrewPositions() {
  // Along a corner diagonal, equal X/Y insets place the screw at the same
  // distance from both walls. This is the minimum inset that keeps the full
  // upper bore tangent to, rather than intersecting, the rounded inner wall.
  const cornerInset =
    roundedRadius -
    (roundedRadius - CASE_SCREW_MOUNT_RADIUS / 2) / Math.SQRT2;
  const cornerX = innerLength / 2 - cornerInset;
  const cornerY = innerWidth / 2 - cornerInset;
  const cornerPositions = [-1, 1].flatMap((xSign) =>
    [1, -1].map((ySign) => ({
      x: xSign * cornerX,
      y: ySign * cornerY,
      ySign,
    })),
  );
  const midpointPositions = [1, -1].map((ySign) => ({
    x: 0,
    y: ySign * (innerWidth / 2 - CASE_SCREW_MOUNT_RADIUS),
    ySign,
  }));

  return [...cornerPositions, ...midpointPositions];
}

/**
 * One underside counterbore extending almost to the mating plane. The screw
 * head can travel through the large lower cylinder and seats against the
 * shoulder formed by the short, smaller shaft opening at the top.
 */
function lowerBodyCaseScrewHole() {
  const bottomZ = -outerHeight / 2;
  const topZ = caseSeparationZ() + FACE_OVERSHOOT;
  const totalHeight = topZ - bottomZ + FACE_OVERSHOOT;
  const headClearanceHeight =
    totalHeight - CASE_SCREW_TOP_SHAFT_HEIGHT;
  const centeredCounterbore = translate(
    [-CASE_SCREW_HEAD_RADIUS, 0, 0],
    screwHole({
      holeHeight: CASE_SCREW_TOP_SHAFT_HEIGHT,
      holeRadius: CASE_SCREW_HOLE_RADIUS,
      headHeight: headClearanceHeight,
      headRadius: CASE_SCREW_HEAD_RADIUS,
    }),
  );

  return translate(
    [0, 0, topZ],
    rotate([Math.PI, 0, 0], centeredCounterbore),
  );
}

function lowerBodyCaseScrewHoles() {
  const cutter = lowerBodyCaseScrewHole();
  return union(
    ...caseScrewPositions().map(({ x, y }) =>
      translate([x, y, 0], cutter),
    ),
  );
}

/**
 * Continuous sleeves around the head-clearance tunnels. They bridge the void
 * between the lower floor and the top retaining shoulders.
 */
function lowerBodyCaseScrewHousings() {
  const bottomZ = -innerHeight / 2 - FACE_OVERSHOOT;
  const topZ = caseSeparationZ();
  const housing = cylinder({
    radius: CASE_SCREW_MOUNT_RADIUS + CASE_SCREW_MOUNT_THICKNESS,
    height: topZ - bottomZ,
    segments,
    center: [0, 0, (bottomZ + topZ) / 2],
  });

  return union(
    ...caseScrewPositions().map(({ x, y }) =>
      translate([x, y, 0], housing),
    ),
  );
}

function cylindricalCornerMountBore() {
  return cylinder({
    radius: CASE_SCREW_MOUNT_RADIUS,
    height: CASE_SCREW_MOUNT_HOLE_HEIGHT + 2 * FACE_OVERSHOOT,
    segments,
    center: [0, 0, CASE_SCREW_MOUNT_HOLE_HEIGHT / 2],
  });
}

function cylindricalCornerMount() {
  const mountHeight = screwMountHalfCircularWithSupportHeight({
    radius: CASE_SCREW_MOUNT_RADIUS,
  });
  const body = cylinder({
    radius: CASE_SCREW_MOUNT_RADIUS + CASE_SCREW_MOUNT_THICKNESS,
    height: mountHeight,
    segments,
    center: [0, 0, mountHeight / 2],
  });
  const supportRelief = translate(
    [
      mountHeight - CASE_SCREW_HEAD_HEIGHT,
      0,
      mountHeight - CASE_SCREW_HEAD_HEIGHT / 2,
    ],
    rotate(
      [0, Math.PI / 4, 0],
      cuboid({
        size: [mountHeight * 2, mountHeight * 2, mountHeight],
      }),
    ),
  );

  return subtract(body, cylindricalCornerMountBore(), supportRelief);
}

/**
 * Remove wall material from the four corner bores before the mounts are
 * unioned into the upper body. The surrounding boss remains overlapped with
 * the shell so the mount stays firmly attached.
 */
function upperBodyCaseScrewMountClearances() {
  const bore = cylindricalCornerMountBore();
  return union(
    ...caseScrewPositions()
      .filter(({ x }) => x !== 0)
      .map(({ x, y }) =>
        translate([x, y, caseSeparationZ()], bore),
      ),
  );
}

/**
 * The four end positions use compact cylindrical bosses. The two midpoint
 * positions retain inward-facing half-circular mounts attached to the walls.
 * Every bore faces downward and every lower face is flush with the seam.
 */
function upperBodyCaseScrewMounts() {
  const mountHeight = screwMountHalfCircularWithSupportHeight({
    radius: CASE_SCREW_MOUNT_RADIUS,
  });
  const z = caseSeparationZ() + mountHeight / 2;
  const downwardMount = rotate(
    [Math.PI, 0, 0],
    screwMountHalfCircularWithSupport({
      radius: CASE_SCREW_MOUNT_RADIUS,
    }),
  );

  return union(
    ...caseScrewPositions().map(({ x, y, ySign }) => {
      if (x !== 0) {
        const inwardYaw = Math.atan2(-ySign, -Math.sign(x));
        return translate(
          [x, y, caseSeparationZ()],
          rotate([0, 0, inwardYaw], cylindricalCornerMount()),
        );
      }

      const wallY = ySign * innerWidth / 2;
      const yaw = ySign > 0 ? -Math.PI / 2 : Math.PI / 2;
      return translate(
        [x, wallY, z],
        rotate([0, 0, yaw], downwardMount),
      );
    }),
  );
}

module.exports = {
  CASE_SCREW_HOLE_RADIUS,
  CASE_SCREW_HEAD_RADIUS,
  CASE_SCREW_HEAD_HEIGHT,
  CASE_SCREW_TOP_SHAFT_HEIGHT,
  CASE_SCREW_MOUNT_RADIUS,
  CASE_SCREW_MOUNT_THICKNESS,
  caseScrewPositions,
  lowerBodyCaseScrewHoles,
  lowerBodyCaseScrewHousings,
  upperBodyCaseScrewMountClearances,
  upperBodyCaseScrewMounts,
};
