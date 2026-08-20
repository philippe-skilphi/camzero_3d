// Camera case main dimensions
// We consider xyz as lwh, length width height

const { requireCamModelFromEnv } = require("../camera-model");

// Tessellation quality (curve smoothness). Low by default for fast iteration.
// Set SEG for higher fidelity, e.g. `SEG=128 npm run export:stl -- tangxi` for final exports.
const segments = Math.max(8, Number(process.env.SEG) || 32);
// Helical-thread angular resolution; scales with SEG (48 at SEG=128).
const threadSegmentsPerRotation = Math.max(8, Math.round((segments * 48) / 128));

const camModel = requireCamModelFromEnv();

const wallThickness = 5;
const roundedRadius = 8;
const largeRoundedRadius = 10;

// Sharp outer-bottom facet: 60° above the floor with a 4 mm vertical rise.
const lowerFacetAngle = Math.PI / 3;
const lowerFacetHeight = 4;
const lowerFacetInset = lowerFacetHeight / Math.tan(lowerFacetAngle);
const lowerFacetLength = lowerFacetHeight / Math.sin(lowerFacetAngle);

const modelDimensions = {
  tangxi: {
    innerLength: 105,
    innerWidth: 54,
    innerHeight: 45,
    upperBodyInnerLength: 85,
  },
  sainsmart: {
    innerLength: 105,
    innerWidth: 55,
    innerHeight: 40,
    upperBodyInnerLength: 75,
  },
};

const {
  innerLength,
  innerWidth,
  innerHeight,
  upperBodyInnerLength,
} = modelDimensions[camModel];

const upperBodyOuterLength = upperBodyInnerLength + wallThickness;
const upperBodyCenteredLength = (upperBodyOuterLength + upperBodyInnerLength) / 2;

const cameraMountHoleSpacing = 29;
const cameraVerticalOffset = 5;
const frontSeamCurveWidth = 42;

const usbHoleScrewOuterRadius = 13.5;
const usbHoleScrewInnerRadius = 12.5;

const outerLength = innerLength + 2 * wallThickness;
const outerWidth = innerWidth + 2 * wallThickness;
const outerHeight = innerHeight + 2 * wallThickness;
const facetTopZ = -outerHeight / 2 + lowerFacetHeight;

const centeredWidth = (outerWidth + innerWidth) / 2;
const centeredLength = (outerLength + innerLength) / 2;
const centeredHeight = (outerHeight + innerHeight) / 2;

const ropeDimensions = { centeredLength, centeredWidth, centeredHeight };

const capDistanceToBody = 9;
const capThickness = 3;
const capFrontOverflow = 10;
const capBackOverflow = 10;

const cameraCapTopLength = outerLength + capFrontOverflow + capBackOverflow;
const cameraCapBottomLength = outerLength + capBackOverflow;
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
    bottomScrewMount: { x: 6, y: 12 },
    raspberryPi: { x: -17, y: 10 },
    usbHole: { x: -36, y: -15 },
    caseScrewX: [-0.2 * outerLength, 16.25],
    frontSeamDip: 2,
    cameraCapTranslate: [10, 0, 3],
    capScrewX: [19, -11],
    cameraMountCall: { innerLength: innerLength / 2, totalHeight: 13 },
    cutFrontBodyOffset: 2,
    // additionalCardsMount: { x: -30, y: -6.5 },
  },
  sainsmart: {
    gx12: { x: 28, y: -16 },
    hasPowerConverter: true,
    powerConverter: { x: -4, y: -17 },
    bottomScrewMount: { x: 26, y: 18 },
    raspberryPi: { x: -16, y: 10 },
    usbHole: { x: -35, y: -16 },
    caseScrewX: [-25, 25],
    frontSeamDip: 4.25,
    cameraCapTranslate: [2, 0, 3],
    capScrewX: [20, -10],
    cameraMountCall: null,
    cutFrontBodyOffset: 1,
    // additionalCardsMount: { x: -8.5, y: -8 },
  },
};

const layout = modelLayouts[camModel];

module.exports = {
  camModel,
  layout,
  segments,
  threadSegmentsPerRotation,
  innerLength,
  innerWidth,
  innerHeight,
  wallThickness,
  roundedRadius,
  largeRoundedRadius,
  lowerFacetAngle,
  lowerFacetHeight,
  lowerFacetInset,
  lowerFacetLength,
  cameraMountHoleSpacing,
  cameraVerticalOffset,
  frontSeamCurveWidth,
  usbHoleScrewOuterRadius,
  usbHoleScrewInnerRadius,
  outerLength,
  outerWidth,
  outerHeight,
  facetTopZ,
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
};
