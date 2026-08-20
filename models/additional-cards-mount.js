const {
  booleans: { union },
  transforms: { translate },
} = require("@jscad/modeling");
const { screwMountM2_5 } = require("./screwery");

const HolesSpacing = 23;
const additionalHeight = 12;
const thickness = 1.5;

function additionalCardsMount() {
  return union(
    translate([HolesSpacing / 2, 0, 0], screwMountM2_5({additionalHeight, thickness})),
    translate([-HolesSpacing / 2, 0, 0], screwMountM2_5({additionalHeight, thickness})),
  )
}

module.exports = { additionalCardsMount };