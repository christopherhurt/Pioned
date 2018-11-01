/* Lookup table to map tile name to tile map ID */
export const TILES = {
  'water': -1,
  'land': 44,
  'tree_bottom': 15,
  'tree_top': 1,
  'apple_tree_bottom': 16,
  'apple_tree_top': 2,
  'yellow_flower': 5,
};

export const PLAYERS = [
  'girl_player',
  'man1_player',
  'man2_player',
];

/* Lookup table for sprites */
export const SPRITES = {
  'water': [35, 44, 53],
  'girl_player': [
    25, 26, 27, // Down
    16, 17, 18, // Left
    13, 14, 15, // Right
    7, 8, 9, // Up
  ],
  'man1_player': [
    19, 20, 21, // Down
    10, 11, 12, // Left
    4, 5, 6, // Right
    1, 2, 3, // Up
  ],
  'man2_player': [
    46, 47, 48, // Down
    37, 38, 39, // Left
    22, 23, 24, // Right
    28, 29, 30, // Up
  ],
};
