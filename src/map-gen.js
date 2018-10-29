/*
	Map generation for Pioned
	Based on example from:
		http://www.mrspeaker.net/2010/12/13/terrainer-terrain-generator/
*/

/* Lookup table to map block name to tile map ID */
const BLOCKS = {
	'water' : 417, 'land' : 1, 'tree' : 15, 'coastLeft' : 42
}

/* Create and return generated tile map array */
export function createMap(mainBlock, fillBlock, seedSize, mainBlockChance, passes, smoothing, objects) {
	// Getting IDs of blocks used to generate map
	var mainID = BLOCKS[mainBlock];
	var fillID = BLOCKS[fillBlock];
	
	if(mainID == undefined || fillID == undefined) {
		throw 'Invalid block name when generating map';
	}
	
	if(smoothing < 0 || smoothing > 9) {
		throw 'Smoothing for map generation should be between 0 and 9';
	}
	
	// Generating initial seed array
	if(seedSize < 1) throw 'Seed size of map generation must be positive';
	if(mainBlockChance < 0 || mainBlockChance > 1) throw 'Main block probability in map generation must be between 0 and 1';
	
	var lay1 = seedGen(mainID, fillID, seedSize, mainBlockChance);
	
	// Iterating to produce greater map detail
	for(var i = 0; i < passes; i++) {
		lay1 = iterateMapGen(lay1, mainID, fillID, smoothing);
	}
	
	// Construct second layer, randomly consists listed objects
	var lay2 = constructObjectLayer(lay1, mainID, objects);
	
	// Reorganize and combine layers to create final map
	var data1 = [];
	var data2 = [];
	
	for(var i = 0; i < lay1.length; i++) {
		for(var j = 0; j < lay1[0].length; j++) {
			data1.push(lay1[i][j]);
			data2.push(lay2[i][j]);
		}
	}
	
	var map = [];
	map.push(data1);
	map.push(data2);
	
	return map;
}

/* Default seed value */
function seedGen(mainID, fillID, seedSize, mainBlockChance) {
	var seed = [];
	
	for(var i = 0; i < seedSize; i++) {
		seed[i] = [];
		
		for(var j = 0; j < seedSize; j++) {
			seed[i][j] = Math.random() < mainBlockChance ? mainID : fillID;
		}
	}
	
	return seed;
}

/* Iterates on map array to produce greater detail */
function iterateMapGen(map, mainID, fillID, smoothing) {
	// Expand map so each block becomes four blocks
	var expansion = [];
	
	for(var i = 0; i < map.length; i++) {
		var row = [];
		
		for(var j = 0; j < map[0].length; j++) {
			row.push(map[i][j]);
			row.push(map[i][j]);
		}
		
		expansion.push(row);
		expansion.push(row);
	}
	
	// Copy expanded map to keep original static
	var mapCopy = [];
	
	for(var i = 0; i < expansion.length; i++) {
		var row = [];
		
		for(var j = 0; j < expansion[0].length; j++) {
			row.push(expansion[i][j]);
		}
		
		mapCopy.push(row);
	}
	
	// Refine map to create smooth edges
	for(var i = 0; i < mapCopy.length; i++) {
		for(var j = 0; j < mapCopy[0].length; j++) {
			var surroundingMain = surroundingMainBlocks(expansion, mainID, i, j);
			var surroundingTotal = surroundingTotalBlocks(expansion, i, j);
			
			var newBlock;
			if(surroundingTotal - surroundingMain > smoothing || Math.random() * surroundingTotal >= surroundingMain) {
				newBlock = fillID;
			} else {
				newBlock = mainID;
			}
			
			mapCopy[i][j] = newBlock;
		}
	}
	
	return mapCopy;
}

/* Determines number of surrounding main blocks at given (x, y) location on map (including (x, y) itself) */
function surroundingMainBlocks(map, mainID, x, y) {
	var count = 0;
	
	for(var i = -1; i <= 1; i++) {
		for(var j = -1; j <= 1; j++) {
			var xIndex = x + i;
			var yIndex = y + j;
			
			if(xIndex >= 0 && xIndex < map.length && yIndex >= 0 && yIndex < map[0].length && map[xIndex][yIndex] == mainID) {
				count++;
			}
		}
	}
	
	return count;
}

/* Determines total number of surrounding blocks on map at (x, y), will always be 9 unless block is on the edge of the map */
function surroundingTotalBlocks(map, x, y) {
	var count = 0;
	
	for(var i = -1; i <= 1; i++) {
		for(var j = -1; j <= 1; j++) {
			var xIndex = x + i;
			var yIndex = y + j;
			
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
	var keys = [];
	
	for(var key in objects) {
		keys.push(key);
	}
	
	// Constructing layer using listed objects and relative probabilities
	var lay = [];
	
	for(var i = 0; i < bottomLayer.length; i++) {
		var row = [];
		
		for(var j = 0; j < bottomLayer[0].length; j++) {
			if(bottomLayer[i][j] == mainID) {
				var keyIndex = parseInt(Math.random() * keys.length);
				var key = keys[keyIndex];
				var prob = objects[key];
				
				if(prob == undefined || prob < 0 || prob > 1) {
					throw 'Relative object probabilities must be between 0 and 1';
				}
				
				var keyID = BLOCKS[key];
				
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
