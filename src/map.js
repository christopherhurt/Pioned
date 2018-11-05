export class GameMap {
  constructor(cols, rows, tsize, dsize, layers, islands) {
    this.cols = cols;
    this.rows = rows;
    this.tsize = tsize;
    this.dsize = dsize;
    this.layers = layers;
    this.width = cols * dsize;
    this.height = rows * dsize;
    this.islands = islands;
  }
  
  getTile(layer, col, row) {
    return this.layers[layer][row * this.cols + col];
  }

  setTile(layer, col, row, type) {
    this.layers[layer][row * this.cols + col] = type;
  }
}
