/*
        Map generation for Pioned
        Based on example from:
                http://www.mrspeaker.net/2010/12/13/terrainer-terrain-generator/
                */

import { TILES } from './tiles'

/* Create and return generated tile map array */
export function createMap(mainTile, fillTile, seedSize, mainTileChance, passes, smoothing, objects) {
  // Getting IDs of tiles used to generate map
  const mainID = TILES[mainTile];
  const fillID = TILES[fillTile];

  if(mainID == undefined || fillID == undefined) {
    throw 'Invalid tile name when generating map';
  }

  if(smoothing < 0 || smoothing > 9) {
    throw 'Smoothing for map generation should be between 0 and 9';
  }

  // Generating initial seed array
  if(seedSize < 1) throw 'Seed size of map generation must be positive';
  if(mainTileChance < 0 || mainTileChance > 1) throw 'Main tile probability in map generation must be between 0 and 1';

  let lay1 = seedGen(mainID, fillID, seedSize, mainTileChance);

  // Iterating to produce greater map detail
  for(let i = 0; i < passes; i++) {
    lay1 = iterateMapGen(lay1, mainID, fillID, smoothing);
  }

  // Construct second layer, randomly consists listed objects
  const lay2 = constructObjectLayer(lay1, mainID, objects);

  // Reorganize and combine layers to create final map
  const data1 = [];
  const data2 = [];

  for(let i = 0; i < lay1.length; i++) {
    for(let j = 0; j < lay1[0].length; j++) {
      data1.push(lay1[i][j]);
      data2.push(lay2[i][j]);
    }
  }

  const map = [];
  map.push(data1);
  map.push(data2);

  return map;
}

/* Default seed value */
function seedGen(mainID, fillID, seedSize, mainTileChance) {
  const seed = [];

  for(let i = 0; i < seedSize; i++) {
    seed[i] = [];

    for(let j = 0; j < seedSize; j++) {
      seed[i][j] = Math.random() < mainTileChance ? mainID : fillID;
    }
  }

  return seed;
}

/* Iterates on map array to produce greater detail */
function iterateMapGen(map, mainID, fillID, smoothing) {
  // Expand map so each tile becomes four tiles
  const expansion = [];

  for(let i = 0; i < map.length; i++) {
    const row = [];

    for(let j = 0; j < map[0].length; j++) {
      row.push(map[i][j]);
      row.push(map[i][j]);
    }

    expansion.push(row);
    expansion.push(row);
  }

  // Copy expanded map to keep original static
  const mapCopy = [];

  for(let i = 0; i < expansion.length; i++) {
    const row = [];

    for(let j = 0; j < expansion[0].length; j++) {
      row.push(expansion[i][j]);
    }

    mapCopy.push(row);
  }

  // Refine map to create smooth edges
  for(let i = 0; i < mapCopy.length; i++) {
    for(let j = 0; j < mapCopy[0].length; j++) {
      const surroundingMain = surroundingMainTiles(expansion, mainID, i, j);
      const surroundingTotal = surroundingTotalTiles(expansion, i, j);

      let newTile;
      if(surroundingTotal - surroundingMain > smoothing || Math.random() * surroundingTotal >= surroundingMain) {
        newTile = fillID;
      } else {
        newTile = mainID;
      }

      mapCopy[i][j] = newTile;
    }
  }

  return mapCopy;
}

/* Determines number of surrounding main tiles at given (x, y) location on map (including (x, y) itself) */
function surroundingMainTiles(map, mainID, x, y) {
  let count = 0;

  for(let i = -1; i <= 1; i++) {
    for(let j = -1; j <= 1; j++) {
      const xIndex = x + i;
      const yIndex = y + j;

      if(xIndex >= 0 && xIndex < map.length && yIndex >= 0 && yIndex < map[0].length && map[xIndex][yIndex] == mainID) {
        count++;
      }
    }
  }

  return count;
}

/* Determines total number of surrounding tiles on map at (x, y), will always be 9 unless tile is on the edge of the map */
function surroundingTotalTiles(map, x, y) {
  let count = 0;

  for(let i = -1; i <= 1; i++) {
    for(let j = -1; j <= 1; j++) {
      const xIndex = x + i;
      const yIndex = y + j;

      if(xIndex >= 0 && xIndex < map.length && yIndex >= 0 && yIndex < map[0].length) {
        count++;
      }
    }
  }

  return count;
}

/* Creates second map layer consisting of overlaid objects */
function constructObjectLayer(bottomLayer, mainID, objects) {
  // Generate key array, necessary for ordering
  const keys = [];

  for(const key in objects) {
    keys.push(key);
  }

  // Constructing layer using listed objects and relative probabilities
  const lay = [];

  for(let i = 0; i < bottomLayer.length; i++) {
    const row = [];

    for(let j = 0; j < bottomLayer[0].length; j++) {
      if(bottomLayer[i][j] == mainID) {
        const keyIndex = parseInt(Math.random() * keys.length);
        const key = keys[keyIndex];
        const prob = objects[key];

        if(prob == undefined || prob < 0 || prob > 1) {
          throw 'Relative object probabilities must be between 0 and 1';
        }

        const keyID = TILES[key];

        if(keyID == undefined) {
          throw 'Object name in map generation does not exist';
        }

        if(Math.random() < prob) {
          row.push(keyID);
        } else {
          row.push(0);
        }
      } else {
        row.push(0);
      }
    }

    lay.push(row);
  }

  return lay;
}
