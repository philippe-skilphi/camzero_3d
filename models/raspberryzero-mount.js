const {
  booleans: { union },
  transforms: { translate },
} = require("@jscad/modeling");
const { screwMountM2_5 } = require("./screwery");

const raspberryPi0Length = 58;
const raspberryPi0Width = 22;
const additionalHeight = 12;
const thickness = 2;

function raspberryZeroMount() {
  return union(
    translate([raspberryPi0Length / 2, raspberryPi0Width / 2, 0], screwMountM2_5({additionalHeight, thickness})),
    translate([-raspberryPi0Length / 2, raspberryPi0Width / 2, 0], screwMountM2_5({additionalHeight, thickness})),
    translate([raspberryPi0Length / 2, -raspberryPi0Width / 2, 0], screwMountM2_5({additionalHeight, thickness})),
    translate([-raspberryPi0Length / 2, -raspberryPi0Width / 2, 0], screwMountM2_5({additionalHeight, thickness})),
  )
}

module.exports = { raspberryZeroMount };