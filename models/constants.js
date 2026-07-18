// Camera case main dimensions
// We consider xyz as lwh, length width height

const { requireCamModelFromEnv } = require("../camera-model");

// Tessellation quality (curve smoothness). Low by default for fast iteration.
// Set SEG for higher fidelity, e.g. `SEG=128 npm run export:stl -- tangxi` for final exports.
const segments = Math.max(8, Number(process.env.SEG) || 32);
// Helical-thread angular resolution; scales with SEG (48 at SEG=128).
const threadSegmentsPerRotation = Math.max(8, Math.round((segments * 48) / 128));

const camModel = requireCamModelFromEnv();

const wallThickness = 6;
const roundedRadius = 8;
const largeRoundedRadius = 10;

const modelDimensions = {
  tangxi: {
    innerLength: 105,
    innerWidth: 54,
    innerHeight: 45,
    upperBodyInnerLength: 85,
    upperToLowerHeightRatio: 0.4,
    usbHoleRelativeX: -32,
    usbHoleRelativeY: -12,
  },
  sainsmart: {
    innerLength: 100,
    innerWidth: 45,
    innerHeight: 40,
    upperBodyInnerLength: 75,
    upperToLowerHeightRatio: 0.333,
    usbHoleRelativeX: -28,
    usbHoleRelativeY: -10,
  },
};

const {
  innerLength,
  innerWidth,
  innerHeight,
  upperBodyInnerLength,
  upperToLowerHeightRatio,
  usbHoleRelativeX,
  usbHoleRelativeY,
} = modelDimensions[camModel];

const upperBodyOuterLength = upperBodyInnerLength + wallThickness;
const upperBodyCenteredLength = (upperBodyOuterLength + upperBodyInnerLength) / 2;

const cameraMountHoleSpacing = 29;

const usbHoleScrewOuterRadius = 13.5;
const usbHoleScrewInnerRadius = 12.5;

const outerLength = innerLength + 2 * wallThickness;
const outerWidth = innerWidth + 2 * wallThickness;
const outerHeight = innerHeight + 2 * wallThickness;

const centeredWidth = (outerWidth + innerWidth) / 2;
const centeredLength = (outerLength + innerLength) / 2;
const centeredHeight = (outerHeight + innerHeight) / 2;

const ropeDimensions = { centeredLength, centeredWidth, centeredHeight };

const capDistanceToBody = 9;
const capThickness = 3;
const capFrontOverflow = 10;

const cameraCapTopLength = outerLength + capFrontOverflow;
const cameraCapBottomLength = outerLength;
const cameraCapOuterWidth = outerWidth + 2 * (capDistanceToBody + capThickness);
const cameraCapInnerWidth = cameraCapOuterWidth - 2 * capThickness;
const cameraCapHeight = outerHeight / 2 + 5;

const usbPortLength = 19.5;
const usbPortWidth = 10;
const usbEnclosureHeight = 6;
const usbEnclosureInnerRadius = 12;

/** Placement offsets and strategies that differ between camera models. */
const modelLayouts = {
  tangxi: {
    gx12: { x: -6, y: -18 },
    hasPowerConverter: true,
    powerConverter: { x: 16, y: -18 },
    bottomScrewMount: { x: 4, y: 0 },
    raspberryPi: { x: -17, y: 10 },
    usbHole: { x: usbHoleRelativeX, y: usbHoleRelativeY },
    // Proportion of outerLength; evaluated at use site with outerLength.
    sideScrewXFactor: -0.2,
    sideScrewXAbsolute: null,
    // "matingFace" uses cut-path horizontal step; "splitZ" uses ratio-based split.
    screwZStrategy: "matingFace",
    cameraCapTranslate: [10, 0, 3],
    capScrewX: [19, -11],
    cameraMountCall: { innerLength: innerLength / 2, totalHeight: 13 },
    cutFrontBodyOffset: 2,
  },
  sainsmart: {
    gx12: { x: 0, y: -14 },
    hasPowerConverter: false,
    powerConverter: { x: 16, y: -12 },
    bottomScrewMount: { x: 10, y: 10 },
    raspberryPi: { x: -15, y: 5 },
    usbHole: { x: usbHoleRelativeX, y: usbHoleRelativeY },
    sideScrewXFactor: null,
    sideScrewXAbsolute: -20,
    screwZStrategy: "splitZ",
    cameraCapTranslate: [12, 0, 3],
    capScrewX: [17, -13],
    cameraMountCall: null,
    cutFrontBodyOffset: 1,
  },
};

const layout = modelLayouts[camModel];

function sideScrewX() {
  if (layout.sideScrewXAbsolute != null) {
    return layout.sideScrewXAbsolute;
  }
  return layout.sideScrewXFactor * outerLength;
}

module.exports = {
  camModel,
  layout,
  sideScrewX,
  segments,
  threadSegmentsPerRotation,
  innerLength,
  innerWidth,
  innerHeight,
  wallThickness,
  roundedRadius,
  largeRoundedRadius,
  cameraMountHoleSpacing,
  usbHoleRelativeX,
  usbHoleRelativeY,
  usbHoleScrewOuterRadius,
  usbHoleScrewInnerRadius,
  outerLength,
  outerWidth,
  outerHeight,
  centeredWidth,
  centeredLength,
  centeredHeight,
  ropeDimensions,
  cameraCapTopLength,
  cameraCapBottomLength,
  cameraCapHeight,
  cameraCapOuterWidth,
  cameraCapInnerWidth,
  capThickness,
  capDistanceToBody,
  usbPortLength,
  usbPortWidth,
  usbEnclosureHeight,
  usbEnclosureInnerRadius,
  upperBodyInnerLength,
  upperBodyOuterLength,
  upperBodyCenteredLength,
  upperToLowerHeightRatio,
};
