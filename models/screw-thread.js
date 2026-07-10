const {
  primitives: { polygon, cylinder, cylinderElliptic, cuboid },
  booleans: { union, subtract },
  transforms: { translate, rotate },
  extrusions: { extrudeHelical },
  maths: {
    constants: { TAU },
  },
} = require("@jscad/modeling");

const { segments, threadSegmentsPerRotation } = require("./constants");

const DEFAULTS = {
  majorRadius: 9,
  pitch: 3,
  depth: 1.2,
  turns: 3.5,
  flank: 0.25,
  clearance: 0.2,
  segmentsPerRotation: threadSegmentsPerRotation,
  flangeHeight: 14,
  flangeRadius: 11,
  wall: 2,
  topThickness: 2,
  gripRibs: true,
  gripRibCount: 12,
  innerBoreRadius: 7,
};

const CYLINDER_SEGMENTS = segments;

function resolveParams(opts = {}) {
  const params = { ...DEFAULTS, ...opts };
  params.minorRadius = params.majorRadius - params.depth;
  params.threadHeight = params.turns * params.pitch;
  params.leadInHeight = params.pitch * 0.5;
  params.boreRadius = params.majorRadius + params.clearance;
  params.innerPassRadius = params.boreRadius - params.depth;
  params.outerRadius = params.boreRadius + params.wall;
  return params;
}

/**
 * Trapezoidal thread tooth cross-section for extrudeHelical.
 * X = radial distance from Z axis, Y = vertical (helix axis) direction.
 */
function threadProfile({ minorRadius, depth, pitch, flank = 0.25 } = {}) {
  const majorRadius = minorRadius + depth;
  const halfPitch = pitch / 2;
  const flankOffset = halfPitch * flank;

  return polygon({
    points: [
      [minorRadius, -halfPitch],
      [majorRadius, -flankOffset],
      [majorRadius, flankOffset],
      [minorRadius, halfPitch],
    ],
  });
}

function helicalThread({
  minorRadius,
  depth,
  pitch,
  turns,
  flank = 0.25,
  segmentsPerRotation = threadSegmentsPerRotation,
  startAngle = 0,
} = {}) {
  return extrudeHelical(
    {
      angle: turns * TAU,
      pitch,
      segmentsPerRotation,
      startAngle,
    },
    threadProfile({ minorRadius, depth, pitch, flank }),
  );
}

function leadInChamfer({
  majorRadius,
  minorRadius,
  height,
  segments = CYLINDER_SEGMENTS,
} = {}) {
  const inner = cylinderElliptic({
    endRadius: [majorRadius, majorRadius],
    startRadius: [minorRadius - 2, minorRadius - 2],
    height: height + 0.2,
    segments,
  });

  // Only taper the thread annulus; do not cut into the core or flange top.
  const outer = cylinder({
    radius: majorRadius + 10,
    height: height,
    segments,
  });

  return subtract(outer, inner);
}

function capLeadInChamfer({
  innerPassRadius,
  boreRadius,
  height,
  segments = CYLINDER_SEGMENTS,
} = {}) {
  const outer = cylinderElliptic({
    startRadius: [boreRadius + 0.5, boreRadius + 0.5],
    endRadius: [boreRadius, boreRadius],
    height,
    segments,
  });

  const inner = cylinder({
    radius: innerPassRadius - 0.01,
    height: height + 0.2,
    segments,
  });

  return subtract(outer, inner);
}

function gripRibsShape({
  outerRadius,
  capHeight,
  count = 12,
  ribWidth = 1.5,
  ribDepth = 0.8,
} = {}) {
  const ribs = [];
  const ribHeight = capHeight * 0.9;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * TAU;
    const radialCenter = outerRadius + ribDepth / 2.2;
    const x = Math.cos(angle) * radialCenter;
    const y = Math.sin(angle) * radialCenter;

    // Each rib also has a 45° chamfer on the top and bottom.
    // Better for grip and allow easier 3D printing.

    ribs.push(
      translate(
        [x, y, capHeight / 2.1],
        rotate(
          [0, 0, angle],
          subtract(
            cuboid({ size: [ribDepth, ribWidth, ribHeight] }),
            translate(
              [0.7, 0, -ribHeight / 2],
              rotate(
                [0, Math.PI / 4, 0],
                cuboid({ size: [ribDepth * 2, ribWidth, ribDepth * 2] }),
              ),
            ),
          ),
        ),
      ),
    );
  }

  return union(...ribs);
}

function bottleCap(opts = {}) {
  const params = resolveParams(opts);
  const {
    minorRadius,
    majorRadius,
    depth,
    pitch,
    turns,
    flank,
    segmentsPerRotation,
    threadHeight,
    leadInHeight,
    flangeHeight,
    flangeRadius,
    innerBoreRadius,
    outerRadius,
    gripRibCount,
  } = params;

  if (innerBoreRadius > 0 && innerBoreRadius >= minorRadius) {
    throw new Error(
      `innerBoreRadius (${innerBoreRadius}) must be smaller than minorRadius (${minorRadius})`,
    );
  }

  const threadOverlap = pitch / 2;
  const coreHeight = threadHeight;

  const flange = translate(
    [0, 0, flangeHeight / 2],
    cylinder({
      radius: flangeRadius,
      height: flangeHeight,
      segments: CYLINDER_SEGMENTS,
    }),
  );

  const core = translate(
    [0, 0, flangeHeight + coreHeight / 2],
    cylinder({
      radius: minorRadius,
      height: coreHeight,
      segments: CYLINDER_SEGMENTS,
    }),
  );

  // Overlap the helix into the flange so the profile root meets the core base.
  const thread = translate(
    [0, 0, flangeHeight - threadOverlap],
    helicalThread({
      minorRadius,
      depth,
      pitch,
      turns,
      flank,
      segmentsPerRotation,
    }),
  );

  // return thread;
  // return union(core, flange);
  let neck = union(flange, core, thread);
  // let neck = union(flange, core);

  // Add a lead in chamfer to the neck to make it easier to insert the screw.
  const leadIn = translate(
    [0, 0, flangeHeight - threadOverlap + coreHeight - leadInHeight],
    rotate(
      [0, Math.PI, 0],
      leadInChamfer({
        majorRadius,
        minorRadius,
        height: leadInHeight,
      }),
    ),
  );

  // return union(neck, leadIn);
  neck = subtract(neck, leadIn);

  if (innerBoreRadius > 0) {
    const boreHeight = flangeHeight + coreHeight + 0.1;
    const bore = translate(
      [0, 0, 2 + boreHeight / 2],
      cylinder({
        radius: innerBoreRadius,
        height: boreHeight,
        segments: CYLINDER_SEGMENTS,
      }),
    );
   neck = subtract(neck, bore);
  }

  // remove the excedent material on top and bottom of the neck
  const top = cuboid({
    size: [flangeRadius * 3, flangeRadius * 3, coreHeight],
    center: [0, 0, coreHeight * 1.25 + flangeHeight],
  });
  const bottom = cuboid({
    size: [flangeRadius * 3, flangeRadius * 3, coreHeight],
    center: [0, 0, -coreHeight / 2],
  }); 

  //return union(top, bottom, neck);
  neck = subtract(neck, top);
  neck = subtract(neck, bottom);

  const grips = gripRibsShape({
    outerRadius: flangeRadius,
    capHeight: flangeHeight,
    count: gripRibCount,
  });
  neck = union(neck, grips);

  return neck;
}

function innerScrewCylinder(opts = {}) {
  const params = resolveParams(opts);
  const { threadHeight, outerRadius, topThickness } = params;

  const capHeight = threadHeight + topThickness;

  const outer = translate(
    [0, 0, capHeight / 2],
    cylinder({
      radius: outerRadius,
      height: capHeight,
      segments: CYLINDER_SEGMENTS,
    }),
  );
  return outer;
}

function innerCylinderHeight(opts = {}) {
  const params = resolveParams(opts);
  const { threadHeight, topThickness } = params;
  return threadHeight + topThickness;
}

function innerScrew(opts = {}) {
  const params = resolveParams(opts);
  const {
    minorRadius,
    depth,
    pitch,
    turns,
    flank,
    segmentsPerRotation,
    clearance,
    threadHeight,
    leadInHeight,
    boreRadius,
    innerPassRadius,
    outerRadius,
    topThickness,
    gripRibs,
    gripRibCount,
  } = params;

  const capHeight = threadHeight + topThickness;
  const threadOverlap = pitch / 2;

  const outer = translate(
    [0, 0, capHeight / 2],
    cylinder({
      radius: outerRadius,
      height: capHeight,
      segments: CYLINDER_SEGMENTS,
    }),
  );

  // Bore to the inner pass radius so the thread-cut helix has wall material to carve.
  const bore = translate(
    [0, 0, threadHeight / 2],
    cylinder({
      radius: innerPassRadius,
      height: threadHeight + 0.1,
      segments: CYLINDER_SEGMENTS,
    }),
  );

  let shell = subtract(outer, bore);

  const threadCut = translate(
    [0, 0, -threadOverlap],
    helicalThread({
      minorRadius: minorRadius + clearance,
      depth,
      pitch,
      turns,
      flank,
      segmentsPerRotation,
    }),
  );

  shell = subtract(shell, threadCut);

  const leadIn = translate(
    [0, 0, leadInHeight / 2],
    capLeadInChamfer({
      innerPassRadius,
      boreRadius,
      height: leadInHeight,
    }),
  );

  shell = subtract(shell, leadIn);

  if (gripRibs) {
    shell = union(
      shell,
      gripRibsShape({
        outerRadius,
        capHeight,
        count: gripRibCount,
      }),
    );
  }

  return shell;
}

function fullPiece() {
  const params = DEFAULTS;
  //params.depth = 2;
  const cap = bottleCap(params);
  const neck = innerScrew(params);
  const spacing = (params.majorRadius + params.clearance + params.wall) * 2 + 8;

  return union(cap, translate([spacing, 0, 0], neck));
}

module.exports = {
  DEFAULTS,
  threadProfile,
  helicalThread,
  bottleCap,
  fullPiece,
  innerScrewCylinder,
  innerCylinderHeight,
  innerScrew,
};
