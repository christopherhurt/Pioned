import { TSIZE, DSIZE, RATIO } from './globals';

/* Lookup table to map tile name to tile map ID */
export const TILES = {
  'water': 1,
  'land': 2,
  'tree_bottom': 3,
  'tree_top': 4,
  'apple_tree_bottom': 5,
  'apple_tree_top': 6,
  'yellow_flower': 7,
  'red_flower': 8,
  'white_flower': 9,
  'stump': 10,
  'bridge': 11,
  'side_bridge': 12,
};

// Negative means animated. Check negated index in FRAMES
// E.g., -1 => FRAMES[1]
export const TILEMAP = [
  null,                         // ==== N/A ====
  -1,                           // water
  44,                           // land
  15,                           // tree_bottom
  1,                            // tree_top
  16,                           // apple_tree_bottom
  2,                            // apple_tree_top
  5,                            // yellow_flower
  6,                            // red_flower
  19,                           // white_flower
  18,                           // stump
  25,                           // bridge
  13,                           // side_bridge
];

export const FRAMES = [
  null,                        // ==== N/A ====
  [35, 44, 53],                // water
];

export const DROPS = [
  null,                        // ==== N/A ====
  null,                        // water
  null,                        // land
  ['wood', 1],                 // tree_bottom
  null,                        // tree_top
  ['wood', 1],                 // apple_tree_bottom
  null,                        // apple_tree_top
  ['yellow_flower', 1],        // yellow_flower
  ['red_flower', 1],           // red_flower
  ['white_flower', 1],         // white_flower
  ['wood', 1],                 // stump
  ['wood', 1],                 // bridge
  ['wood', 1],                 // side_bridge
];

export const SOLID = [
  null,                        // ==== N/A ====
  true,                        // water
  false,                       // land
  true,                        // tree_bottom
  false,                       // tree_top
  true,                        // apple_tree_bottom
  false,                       // apple_tree_top
  false,                       // yellow_flower
  false,                       // red_flower
  false,                       // white_flower
  true,                        // stump
  false,                       // bridge
  false,                       // side_bridge
];

export const BASES = {
  'wood': 'water',
  'yellow_flower': 'land',
  'red_flower': 'land',
  'white_flower': 'land',
};

export const PLAYERS = [
  'girl_player',
  'man_hat',
  'man_beard',
];

/* Lookup table for sprites */
export const SPRITES = {
  'girl_player': [
    25, 26, 27, // Down
    16, 17, 18, // Left
    13, 14, 15, // Right
    7, 8, 9, // Up
  ],
  'man_hat': [
    19, 20, 21, // Down
    10, 11, 12, // Left
    4, 5, 6, // Right
    1, 2, 3, // Up
  ],
  'man_beard': [
    46, 47, 48, // Down
    37, 38, 39, // Left
    22, 23, 24, // Right
    28, 29, 30, // Up
  ],
  'butterfly': [
    33, 33, 34, // Down
    42, 42, 43, // Left
    51, 51, 52, // Right
    33, 33, 34, // Up
  ],
};

class SpriteDimensions {
  constructor(realWidth, realHeight, srcWidth, srcHeight) {
    this.srcWidth = srcWidth;
    this.srcHeight = srcHeight;
    this.realWidth = realWidth;
    this.realHeight = realHeight;

    this.displayWidth = srcWidth * RATIO;
    this.displayHeight = srcHeight * RATIO;
    this.realDisplayWidth = realWidth * RATIO;
    this.realDisplayHeight = realHeight * RATIO;
  }
}

export const SPRITE_DIMENSIONS = {
  'girl_player': new SpriteDimensions(10, 8, 14, 16),
  'man_hat': new SpriteDimensions(10, 8, 12, 16),
  'man_beard': new SpriteDimensions(10, 8, 12, 16),
  'butterfly': new SpriteDimensions(10, 9, 7, 16),
};
