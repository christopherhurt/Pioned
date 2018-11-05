/*
        Map generation for Pioned
        Based on example from:
                http://www.mrspeaker.net/2010/12/13/terrainer-terrain-generator/
                */

import { TILES } from './tiles'

/* Find random starting location for a newly-added player */
export function findStartingCoordinates(layers, mapSize, spawnTile, colliderObjects) {
  // Getting ID of tile player can spawn on
  const spawnID = TILES[spawnTile];
  
  if(spawnID == undefined) {
    throw 'Invalid spawn tile name when finding player starting coordinates';
  }
  
  // Getting IDs of collider objects that can't be spawned on
  const colliderIDs = [];
  
  for(let i = 0; i < colliderObjects.length; i++) {
    const colliderID = TILES[colliderObjects[i]];
    
    if(colliderID == undefined) {
      throw 'Invalid tile name for collider object when finding player starting coordinates';
    }
    
    colliderIDs.push(colliderID);
  }
  
  // Finding random location on map until it's a spawnable tile
  let spawnFound = false;
  let x = -1;
  let y = -1;
  while(!spawnFound) {
    x = parseInt(Math.random() * mapSize);
    y = parseInt(Math.random() * mapSize);
    
    const tileIndex = y * mapSize + x;
    if(layers[0][tileIndex] == spawnID) {
      spawnFound = true;
      
      // Making sure player is not spawned on top of a collider object
      for(let i = 1; i < layers.length; i++) {
        const layer = layers[i];
        
        for(let j = 0; j < colliderIDs.length; j++) {
          if(layer[tileIndex] == colliderIDs[j]) {
            spawnFound = false;
            break;
          }
        }
        
        if(!spawnFound) {
          break;
        }
      }
    }
  }
  
  return { 'x': x, 'y': y };
}

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
  const objLayers = constructObjectLayers(lay1, mainID, objects);

  // Reorganize and combine layers to create final map
  const numLayers = 1 + objLayers.length;
  const map = Array(numLayers).fill().map(() => []);

  for(let i = 0; i < lay1.length; i++) {
    for(let j = 0; j < lay1[0].length; j++) {
      map[0].push(lay1[i][j]);
      for (let k = 0; k < objLayers.length; k++) {
        map[k + 1].push(objLayers[k][i][j]);
      }
    }
  }

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
function constructObjectLayers(bottomLayer, mainID, objects) {
  // Generate key array, necessary for ordering
  const keys = [];

  for(const key in objects) {
    keys.push(key);
  }

  const rows = bottomLayer.length;
  const cols = bottomLayer[0].length;

  // Initialize 2d array with zeros
  // Thank you https://stackoverflow.com/a/46792350/1313757
  const lay1 = Array(rows).fill().map(() => Array(cols).fill(0));
  const lay2 = Array(rows).fill().map(() => Array(cols).fill(0));

  // Constructing layer using listed objects and relative probabilities
  for(let i = 0; i < rows; i++) {
    for(let j = 0; j < cols; j++) {
      if(bottomLayer[i][j] === mainID && lay1[i][j] === 0) {
        const keyIndex = parseInt(Math.random() * keys.length);
        const key = keys[keyIndex];
        const obj = objects[key];
        const prob = obj['prob'];

        if(prob === undefined || prob < 0 || prob > 1) {
          throw 'Relative object probabilities must be between 0 and 1';
        }

        const keyID = TILES[key];

        if(keyID === undefined) {
          throw 'Object name in map generation does not exist';
        }

        if(Math.random() < prob) {
          if ('rules' in obj) {
            const rules = obj['rules'];

            // Verify rules
            let allow = true;
            for (const rule in rules) {
              const [ I, J ] = rules[rule];
              const y = i + I;
              const x = j + J;
              if (x < 0 || x >= cols || y < 0 || y >= rows // Check bounds
                || lay2[y][x] !== 0) { // Check that layer 2 is empty
                allow = false;
                break;
              }
            }

            // If rules allow, add to layer and follow rules
            if (allow) {
              lay1[i][j] = keyID;
              // Add other tiles
              for (const rule in rules) {
                const [ I, J ] = rules[rule];
                const y = i + I;
                const x = j + J;
                const ruleID = TILES[rule];
                lay2[y][x] = ruleID;
              }
            }
          } else { // No rules, simply add to layer
            lay1[i][j] = keyID;
          }
        }
      }
    }
  }

  return [lay1, lay2];
}
