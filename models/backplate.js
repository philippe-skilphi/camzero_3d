const {
  primitives: { cuboid, roundedCuboid, roundedRectangle, cylinder },
  booleans: { union, subtract },
  transforms: { translate, rotate },
  extrusions: { extrudeLinear },
} = require("@jscad/modeling");

module.exports.main = () => {
  // --- Raspberry Pi zero 2 screw holes dimensions ---


  const raspberryPLate = () => {
    const screwHoleHalfCircularRadius = 1.25;
    const widthBetweenHoles = 24;
    const lengthBetweenHoles = 58;
    const thickness = 3;
  
    const supportWidth = widthBetweenHoles + 10;
    const supportLength = lengthBetweenHoles + 10;
  
    const support = roundedCuboid({
      size: [supportWidth, supportLength, thickness],
      roundRadius: 0.5,
    });
  
    const supportHoles = [
      translate([widthBetweenHoles / 2, lengthBetweenHoles / 2], cylinder({ radius: screwHoleHalfCircularRadius, height: thickness, segments: 32 })),
      translate([widthBetweenHoles / 2, -lengthBetweenHoles / 2], cylinder({ radius: screwHoleHalfCircularRadius, height: thickness, segments: 32 })),
      translate([-widthBetweenHoles / 2, lengthBetweenHoles / 2], cylinder({ radius: screwHoleHalfCircularRadius, height: thickness, segments: 32 })),
      translate([-widthBetweenHoles / 2, -lengthBetweenHoles / 2], cylinder({ radius: screwHoleHalfCircularRadius, height: thickness, segments: 32 })),
    ];
  
    return translate([0, 10, 1.2], rotate([0, 0, Math.PI / 2], subtract(support, ...supportHoles)));
  }

  const supportPlate = () => {
    const thickness = 1.2;
    const width = 90;
    const length = 75;  
    const screwHoleHalfCircularRadius = 1;

    const support = roundedCuboid({
      center: [0, 0, 0],
      size: [width, length, thickness],
      roundRadius: 0.1,
    });

    const extrudedCameraRibbon = cuboid({
      size: [3, 20, thickness*2], 
      center: [40, 10, 0],
    });

        
    return subtract(support, extrudedCameraRibbon);
  }

  const cameraPlate = () => {
    const lengthBetweenHoles = 34;
    const thickness = 3;
    const screwHoleHalfCircularRadius = 1;
    const extrusionSize = 12;
    

    const support = roundedCuboid({
      center: [0, 0, 0],
      size: [lengthBetweenHoles + 5, lengthBetweenHoles + 5, thickness],
      roundRadius: 0.1,
    });

    const cameraHoles = [
      translate([lengthBetweenHoles / 2, lengthBetweenHoles / 2, 0], cylinder({ radius: screwHoleHalfCircularRadius, height: thickness, segments: 32 })),
      translate([lengthBetweenHoles / 2, -lengthBetweenHoles / 2, 0], cylinder({ radius: screwHoleHalfCircularRadius, height: thickness, segments: 32 })),
      translate([-lengthBetweenHoles / 2, lengthBetweenHoles / 2, 0], cylinder({ radius: screwHoleHalfCircularRadius, height: thickness, segments: 32 })),
      translate([-lengthBetweenHoles / 2, -lengthBetweenHoles / 2, 0], cylinder({ radius: screwHoleHalfCircularRadius, height: thickness, segments: 32 })),
    ];

    // const extrusionCuboids = [
    //   translate([8, 8, 0],roundedCuboid({ size: [extrusionSize, extrusionSize, thickness], center: [0, 0, 0], roundRadius: 10 })),
    // ];

    const extrusionCylinders = [
      translate([8, 8, 0], cylinder({ radius: extrusionSize / 2, height: thickness, segments: 32 })),
      translate([8, -8, 0], cylinder({ radius: extrusionSize / 2, height: thickness, segments: 32 })),
      translate([-8, 8, 0], cylinder({ radius: extrusionSize / 2, height: thickness, segments: 32 })),
      translate([-8, -8, 0], cylinder({ radius: extrusionSize / 2, height: thickness, segments: 32 })),
    ];

    return translate([0, 37.5, 0], rotate([Math.PI / 2, Math.PI / 2, 0], subtract(support, ...cameraHoles, ...extrusionCylinders)));
  }

  return union(raspberryPLate(), supportPlate(), cameraPlate());
};
