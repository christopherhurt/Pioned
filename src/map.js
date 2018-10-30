export class GameMap {
  constructor(cols, rows, tsize, dsize, layers) {
    this.cols = cols;
    this.rows = rows;
    this.tsize = tsize;
    this.dsize = dsize;
    this.layers = layers;
    this.width = cols * dsize;
    this.height = rows * dsize;
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

  getRow(y){
    return Math.floor(y / this.dsize);
  }

  getX(col){
    return col * this.dsize;
  }
  
  getY(row){
    return row * this.dsize;
  }

  isSolidTileAtXY(x,y){
    var col = Math.floor(x / this.dsize);
    var row = Math.floor(y / this.dsize);
    // tiles 3 and 5 are solid -- the rest are walkable
    // loop through all layers and return TRUE if any tile is solid
    for(let i =0; i < this.layers.length; i++){
      var tile = this.getTile(i, col, row);
      if(tile === 417){return true}
    }
    return false;
  }
}
