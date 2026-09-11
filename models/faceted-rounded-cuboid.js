const {
  geometries: { geom2 },
  extrusions: { extrudeFromSlices, slice },
  maths: { mat4 },
  primitives: { roundedRectangle },
} = require("@jscad/modeling");

/**
 * Creates a rounded XY footprint with straight walls and planar top/bottom
 * facets. Unlike roundedCuboid, this avoids curved Z overhangs.
 */
function facetedRoundedCuboid({
  size,
  center = [0, 0, 0],
  roundRadius,
  facetHeight,
  facetInset,
  segments,
}) {
  const [length, width, height] = size;
  const [centerX, centerY, centerZ] = center;
  const bottomZ = centerZ - height / 2;
  const facetTopZ = bottomZ + facetHeight;
  const topZ = centerZ + height / 2;
  const topFacetBottomZ = topZ - facetHeight;

  const fullFootprint = roundedRectangle({
    size: [length, width],
    roundRadius,
    segments,
  });
  const insetFootprint = roundedRectangle({
    size: [length - 2 * facetInset, width - 2 * facetInset],
    roundRadius: roundRadius - facetInset,
    segments,
  });

  const insetSlice = slice.fromSides(geom2.toSides(insetFootprint));
  const fullSlice = slice.fromSides(geom2.toSides(fullFootprint));
  const atPosition = (profileSlice, z) =>
    slice.transform(
      mat4.fromTranslation(mat4.create(), [centerX, centerY, z]),
      profileSlice,
    );

  return extrudeFromSlices(
    {
      numberOfSlices: 4,
      callback: (_progress, index) => {
        if (index === 0) return atPosition(insetSlice, bottomZ);
        if (index === 1) return atPosition(fullSlice, facetTopZ);
        if (index === 2) return atPosition(fullSlice, topFacetBottomZ);
        return atPosition(insetSlice, topZ);
      },
    },
    insetSlice,
  );
}

module.exports = { facetedRoundedCuboid };
