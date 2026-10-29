// World size and layout constants, in world units (1 unit = 1 css px at zoom 1).
export const W = 3450;
export const H = 760;
/** Building base line; cats walk on the pavement below it. */
export const GROUND = 470;
/** Depth band of the pavement that cats roam in. */
export const LANE: [number, number] = [500, 548];
/** Code-drawn cats are authored ~110 units tall; this sets their size on the street. */
export const CAT_SCALE = 0.74;
export const OUT = '#4A3B33';
