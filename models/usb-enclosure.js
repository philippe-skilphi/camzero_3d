const {
  primitives: { cuboid, cylinder },
  booleans: { subtract, union },
  transforms: { translate, rotate },
} = require("@jscad/modeling");

const {
  usbPortLength,
  usbPortWidth,
  usbEnclosureHeight,
  usbEnclosureInnerRadius,
} = require("./constants");



function outerUsbEnclosure() {
  return cuboid({
    size: [17.6, 9, 6],
  });
}