import { SOLID, TILES } from './tiles';
import { fillZeros } from './utils';

export class GameMap {
  constructor(cols, rows, tsize, dsize, layers, islands, numIslands) {
    this.cols = cols;
    this.rows = rows;
    this.tsize = tsize;
    this.dsize = dsize;
    this.layers = layers;
    this.width = cols * dsize;
    this.height = rows * dsize;
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
    return Math.floor(x / this.dsize);
  }

  getRow(y) {
    return Math.floor(y / this.dsize);
  }

  getX(col) {
    return col * this.dsize;
  }

  getY(row) {
    return row * this.dsize;
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
