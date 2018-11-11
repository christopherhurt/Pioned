import { SOLID, TILES } from './tiles';
import { fillZeros } from './utils';

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

  spawnTrees(map_objects) {
    const rows = this.height;
    const cols = this.width;
    const layer1 = fillZeros(this.width,this.height)
    const layer2 = fillZeros(this.width, this.height)
    for(let i = 0; i < rows; i++) {
      for(let j = 0; j < cols; j++) {
        if(this.getTile(0,j,i) === TILES['land'] && this.getTile(1,j,i) === 0){
          if(Math.random() < map_objects['tree_bottom']['prob']) {
            layer1[i][j] = 1
            layer2[i][j] = 1
            this.setTile(1, j, i, TILES['tree_bottom']);
            if (i > 0) {
              this.setTile(2, j, i-1, TILES['tree_top']);
            }
          }
        }
      }
    }
    //map is a 2d array with 2 rows
    const map = Array(2).fill().map(()=>[]);
    //flattening the layers
    for(let i = 0; i<layer1.length; i++){
      for(let j= 0; j<layer1[0].length; j++){
        map[0].push(layer1[i][j]);
        map[1].push(layer2[i][j]);
      }
    }
    // alternative option
    // const layer1flat = [].concat.apply([], layer1);
    return map;
  }
}
