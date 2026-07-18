const {
  primitives: { roundedCuboid, cylinder, cuboid, torus },
  booleans: { subtract, union },
  transforms: { translate, rotate, center },
  measurements: { measureArea, measureBoundingBox },
  geometries: { geom2 },
  maths: { vec2 },
  extrusions: { extrudeLinear },
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
  lowerBodyOuterHeight,
  getSizes,
  getLowerUpperCutPath,
  cutSeparationZAtX,
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
  sideScrewX,
  segments,
  innerLength,
  innerWidth,
  innerHeight,
  roundedRadius,
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

const cameraMount =
  camModel === "sainsmart" ? cameraMountSainsmart : cameraMountTangxi;

module.exports.main = () => {
  /**
   * Shared frame for the ±Y diagonal screw pair (hole on lower, mount on upper).
   * Same axis for both so they stay coaxial; upper is offset along the cut normal.
   */
  function diagonalScrewFrame() {
    const cutPath = getLowerUpperCutPath();
    const diagAngle = Math.atan2(
      cutPath.diagonalEnd[1] - cutPath.diagonalStart[1],
      cutPath.diagonalEnd[0] - cutPath.diagonalStart[0],
    );
    // Toward upper / gap in the XZ plane.
    const diagN = [-Math.sin(diagAngle), 0, Math.cos(diagAngle)];
    // Fraction along the diagonal from fillet → top (keep clear of the top corner).
    const t = 0.28;
    const x =
      cutPath.diagonalStart[0] +
      t * (cutPath.diagonalEnd[0] - cutPath.diagonalStart[0]);
    const z = cutSeparationZAtX(x);
    // Same 6 mm offset used on the horizontal upper mounts (along the screw axis).
    const upperOffset = 6;
    return { diagAngle, diagN, x, z, upperOffset };
  }

  /** Horizontal case-screw Z: mating-face step (tangxi) or ratio-based splitZ (sainsmart). */
  function horizontalScrewZ() {
    if (layout.screwZStrategy === "splitZ") {
      return lowerBodyOuterHeight() - outerHeight / 2;
    }
    return getLowerUpperCutPath().horizontalStart[1];
  }

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
    const { removePolygonPoints } = getLowerUpperCutPath();
    const toRemove2D = geom2.fromPoints(
      removePolygonPoints.map((p) => vec2.fromValues(p[0], p[1])),
    );
    const toRemove = extrudeLinear({ height: outerWidth }, toRemove2D);
    return subtract(
      fullBody(),
      translate([0, outerWidth / 2, 0], rotate([Math.PI / 2, 0, 0], toRemove)),
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

    // Power converter mount (Tangxi only)
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

    // Camera sensor hole
    const cam = translate(
      [centeredLength / 2, 0, 0],
      rotate([0, Math.PI / 2, 0], cameraHole35mm()),
    );
    body = subtract(body, cam);

    // Camera sensor screw mount
    const sensorScrewMount = layout.cameraMountCall
      ? cameraMount(layout.cameraMountCall)
      : cameraMount();
    body = union(body, sensorScrewMount);

    const matingFaceZ = horizontalScrewZ();
    const sideX = sideScrewX();
    const { diagAngle, x: diagonalScrewX, z: diagonalScrewZ } =
      diagonalScrewFrame();

    // Wall attachment like the horizontal holes, then tip around Y onto the diagonal.
    const diagonalHole = (ySign) =>
      translate(
        [diagonalScrewX, (ySign * outerWidth) / 2, diagonalScrewZ],
        rotate(
          [0, -diagAngle, 0],
          rotate(
            [Math.PI, 0, (ySign * Math.PI) / 2],
            screwHoleHalfCircularWithSupport(),
          ),
        ),
      );

    const caseScrewMounts = union(
      translate(
        [sideX, outerWidth / 2, matingFaceZ],
        rotate([Math.PI, 0, Math.PI / 2], screwHoleHalfCircularWithSupport()),
      ),
      translate(
        [sideX, -outerWidth / 2, matingFaceZ],
        rotate([Math.PI, 0, -Math.PI / 2], screwHoleHalfCircularWithSupport()),
      ),
      translate(
        [-outerLength / 2, 0, matingFaceZ],
        rotate([Math.PI, 0, -Math.PI], screwHoleHalfCircularWithSupport()),
      ),
      diagonalHole(-1),
      diagonalHole(1),
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

    // Case screw mounts on the top side, face down to limit water ingress.
    const screwMountZOffset = 6 + horizontalScrewZ();
    const sideX = sideScrewX();
    const {
      diagAngle,
      diagN,
      x: diagonalScrewX,
      z: diagonalScrewZ,
      upperOffset,
    } = diagonalScrewFrame();

    // Same tilt as the lower holes; origin offset along diagN into the upper body.
    const diagonalMount = (ySign) =>
      translate(
        [
          diagonalScrewX + upperOffset * diagN[0],
          (ySign * outerWidth) / 2,
          diagonalScrewZ + upperOffset * diagN[2],
        ],
        rotate(
          [0, -diagAngle, 0],
          rotate(
            [Math.PI, 0, (ySign * Math.PI) / 2],
            screwMountHalfCircularWithSupport(),
          ),
        ),
      );

    const caseScrewMounts = union(
      translate(
        [sideX, outerWidth / 2, screwMountZOffset],
        rotate([Math.PI, 0, Math.PI / 2], screwMountHalfCircularWithSupport()),
      ),
      translate(
        [sideX, -outerWidth / 2, screwMountZOffset],
        rotate([Math.PI, 0, -Math.PI / 2], screwMountHalfCircularWithSupport()),
      ),
      translate(
        [-outerLength / 2, 0, screwMountZOffset],
        rotate([Math.PI, 0, -Math.PI], screwMountHalfCircularWithSupport()),
      ),
      diagonalMount(-1),
      diagonalMount(1),
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
      translate([0, 0, 25], union(lowerBodyWithJoint(), upperBody())),
      translate([0, -100, 10], upperBodyWithCap()),
      translate([0, 70, 0], thread2Parts()),
      translate([-150, 0, 25], union(lowerBodyWithJoint(), upperBodyWithCap())),
      translate([-150, -100, 10], upperBody()),
      translate([-150, 100, 25], lowerBodyWithJoint()),
    );
  }

  // return lowerBody();
  // return upperBody();
  // return fullBody();
  // return rotate([0, Math.PI / 2, 0], fullPiece());
  // return cameraCap();
  // return upperBody();
  // return translate([0, 0, 25], lowerBodyWithJoint());
  // console.log(measureArea(test));
  // return ropeJoint();
  // return cameraHole();
  // return screwMount1_4();
  // return raspberryZeroMount();
  // return translate([0, 0, 40], lowerBodyWithJoint());
  // return union(lowerBodyWithJoint(), upperBody());
  // return upperBodyWithCap();
  // return thread2Parts();
  // return trapezoidalSegment(10);
  // return translate([0, 0, 50], subtract(lowerBody(), trapezoidalRopeTrap()));
  return printAllChecks();
  return printable();
};
