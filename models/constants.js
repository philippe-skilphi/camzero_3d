// Camera case main dimensions
// We consider xyz as lwh, length width height

const { union } = require("@jscad/modeling/src/operations/booleans");

// Tessellation quality (curve smoothness). Low by default for fast iteration.
// Set SEG for higher fidelity, e.g. `SEG=128 npm run export:stl` for final exports.
const segments = Math.max(8, Number(process.env.SEG) || 32);
// Helical-thread angular resolution; scales with SEG (48 at SEG=128).
const threadSegmentsPerRotation = Math.max(8, Math.round((segments * 48) / 128));

const wallThickness = 4;
const roundedRadius = 5;
const largeRoundedRadius = 10;

const innerLength = 100;
const innerWidth = 54;
const innerHeight = 45;

const upperBodyInnerLength = 85;
const upperBodyOuterLength = upperBodyInnerLength + wallThickness;
const upperBodyCenteredLength = (upperBodyOuterLength + upperBodyInnerLength) / 2;

const upperToLowerHeightRatio = 0.4

const cameraMountHoleSpacing = 27;

const usbHoleRelativeX = -32;
const usbHoleScrewOuterRadius = 13.5;
const usbHoleScrewInnerRadius = 12.5;

const outerLength = innerLength + 2 * wallThickness;
const outerWidth = innerWidth + 2 * wallThickness;
const outerHeight = innerHeight + 2 * wallThickness;

const centeredWidth = (outerWidth + innerWidth) / 2;
const centeredLength = (outerLength + innerLength) / 2;
const centeredHeight = (outerHeight + innerHeight) / 2;

const ropeDimensions = { centeredLength, centeredWidth, centeredHeight };

const capDistanceToBody = 5
const capThickness = 3;
const capFrontOverflow = 10

const cameraCapTopLength = outerLength + capFrontOverflow;
const cameraCapBottomLength = outerLength; 
const cameraCapOuterWidth = outerWidth + 2 * (capDistanceToBody + capThickness);
const cameraCapInnerWidth = cameraCapOuterWidth - 2 * capThickness;
const cameraCapHeight = outerHeight / 2 + 5;

const usbPortLength = 19.5;
const usbPortWidth = 10;
const usbEnclosureHeight = 6;
const usbEnclosureInnerRadius = 12;

module.exports = {
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
