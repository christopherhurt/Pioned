import { SOLID, TILES } from './tiles';
import { fillZeros } from './utils';
import { DSIZE } from './globals';

export class GameMap {
  constructor(cols, rows, layers, islands, numIslands) {
    this.cols = cols;
    this.rows = rows;
    this.layers = layers;
    this.width = cols * DSIZE;
    this.height = rows * DSIZE;
    this.islands = islands;
    this.numIslands = numIslands;
  }

  getTile(layer, col, row) {
    return this.layers[layer][row * this.cols + col];
  }

  setTile(layer, col, row, type) {
    this.layers[layer][row * this.cols + col] = type;
  }

  getCol(x) {
    return x / DSIZE | 0;
  }

  getRow(y) {
    return y / DSIZE | 0;
  }

  getX(col) {
    return col * DSIZE;
  }

  getY(row) {
    return row * DSIZE;
  }

  isSolidTile(col, row) {
    const base = this.getTile(0, col, row);
    const obj = this.getTile(1, col, row);

    // Can walk on structures above water
    if (obj !== 0 && !SOLID[obj]) {
      return false;
    }

    return SOLID[base] || SOLID[obj];
  }
}
