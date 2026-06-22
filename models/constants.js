// Camera case main dimensions
// We consider xyz as lwh, length width height

const innerLength = 90;
const innerWidth = 45;
const innerHeight = 45;

const wallThickness = 4;
const roundedRadius = 2.5;

const cameraMountHoleSpacing = 27;

const usbHoleRelativeX = -27;
const usbHoleScrewOuterRadius = 13;
const usbHoleScrewInnerRadius = 11.5;

const outerLength = innerLength + 2 * wallThickness;
const outerWidth = innerWidth + 2 * wallThickness;
const outerHeight = innerHeight + 2 * wallThickness;

const centeredWidth = (outerWidth + innerWidth) / 2;
const centeredLength = (outerLength + innerLength) / 2;
const centeredHeight = (outerHeight + innerHeight) / 2;

const ropeDimensions = { centeredLength, centeredWidth, centeredHeight };

const capDistanceToBody = 4
const capThickness = 3;
const capFrontOverflow = 10

const cameraCapTopLength = outerLength + capFrontOverflow;
const cameraCapBottomLength = outerLength; 
const cameraCapOuterWidth = outerWidth + 2 * (capDistanceToBody + capThickness);
const cameraCapInnerWidth = cameraCapOuterWidth - 2 * capThickness;
const cameraCapHeight = outerHeight / 2

module.exports = {
  innerLength,
  innerWidth,
  innerHeight,
  wallThickness,
  roundedRadius,
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
};
