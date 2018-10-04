import { ImageLoader, Keyboard } from './utils';

const map = {
  cols: 12,
  rows: 12,
  tsize: 64,
  layers: [[
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3,
    3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3,
    3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3,
    3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3,
    3, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 3,
    3, 1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 3,
    3, 1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 3,
    3, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 3,
    3, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 3,
    3, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 3,
    3, 3, 3, 1, 1, 2, 3, 3, 3, 3, 3, 3
  ], [
    4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4,
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4,
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4,
    4, 0, 0, 5, 0, 0, 0, 0, 0, 5, 0, 4,
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4,
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4,
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4,
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4,
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4,
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4,
    4, 4, 4, 0, 5, 4, 4, 4, 4, 4, 4, 4,
    4, 4, 4, 0, 0, 3, 3, 3, 3, 3, 3, 3
  ]],
};
const getTile = (layer, col, row) => map.layers[layer][row * map.cols + col];

const Keys = {
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  DOWN: 40,
};

class Player {
  constructor(map, width, height, size) {
    this.x = width / 2;
    this.y = height / 2;
    this.size = size;
    this.maxX = width - size;
    this.maxY = height - size;
    this.SPEED = 256; // Pixels per second
  }

  move(delta, dirx, diry) {
    // Move player
    this.x += dirx * this.SPEED * delta;
    this.y += diry * this.SPEED * delta;
    // Clamp values
    this.x = Math.max(0, Math.min(this.x, this.maxX));
    this.y = Math.max(0, Math.min(this.y, this.maxY));
  }
}

class Camera {
  constructor(map, width, height) {
    this.x = width * 0.25;
    this.y = height * 0.25;
    this.width = width;
    this.height = height;
    this.maxX = map.cols * map.tsize - width;
    this.maxY = map.rows * map.tsize - height;
    this.SPEED = 256; // Pixels per second
  }

  move(delta, dirx, diry) {
    // Move camera
    this.x += dirx * this.SPEED * delta;
    this.y += diry * this.SPEED * delta;
    // Clamp values
    this.x = Math.max(0, Math.min(this.x, this.maxX));
    this.y = Math.max(0, Math.min(this.y, this.maxY));
  }
}

export class Game {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.previousElapsed = 0;
    this.loader = new ImageLoader();
    this.keyboard = new Keyboard();
  }

  async load() {
    await this.loader.load('tiles', 'assets/tiles.png');
  }

  async init() {
    await this.load();
    this.keyboard.listenForEvents([
      Keys.LEFT,
      Keys.RIGHT,
      Keys.UP,
      Keys.DOWN,
    ]);

    this.tileAtlas = this.loader.get('tiles');
    this.camera = new Camera(map, this.width, this.height);

    const createCanvas = () => {
      const c = document.createElement('canvas');
      c.width = this.width;
      c.height = this.height;
      return c;
    };

    // Create a canvas for each layer
    this.layerCanvas = map.layers.map(createCanvas);
    this.playerCanvas = createCanvas();

    this.mainCharacter = new Player(map, this.width, this.height, 40);

    // initial draw of the map
    this._drawMap();
    this._drawPlayers();
  }

  async run() {
    await this.init();

    const tick = (elapsed) => {
      window.requestAnimationFrame(tick);

      // Clear previous frame
      this.ctx.clearRect(0, 0, this.width, this.height);

      // Compute delta time in seconds -- also cap it
      // Maximum delta of 250 ms
      const delta = Math.min(0.25, (elapsed - this.previousElapsed) / 1000.0);
      this.previousElapsed = elapsed;

      this.update(delta);
      this.render();
    };

    tick();
  }

  update(delta) {
    this.hasScrolled = false;
    // Handle camera movement with arrow keys
    let dirx = 0;
    let diry = 0;
    if (this.keyboard.isDown(Keys.LEFT)) { dirx = -1; }
    if (this.keyboard.isDown(Keys.RIGHT)) { dirx = 1; }
    if (this.keyboard.isDown(Keys.UP)) { diry = -1; }
    if (this.keyboard.isDown(Keys.DOWN)) { diry = 1; }

    if (dirx || diry) {
      // Make diagonal movement same speed as horiz or vert
      if (dirx && diry) {
        dirx *= Math.sqrt(2) / 2;
        diry *= Math.sqrt(2) / 2;
      }

      this.camera.move(delta, dirx, diry);
      this.mainCharacter.move(delta, dirx, diry);
      this.hasScrolled = true;
    }
  }

  _drawPlayers() {
    const ctx = this.playerCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.fillStyle = 'blue';
    ctx.fillRect(
      this.mainCharacter.x | 0, // x
      this.mainCharacter.y | 0, // y
      this.mainCharacter.size, // width
      this.mainCharacter.size // height
    );
  }

  _drawMap() {
    map.layers.forEach((layer, index) => this._drawLayer(index));
  }

  _drawLayer(layer) {
    const ctx = this.layerCanvas[layer].getContext('2d');
    ctx.clearRect(0, 0, this.width, this.height);

    const startCol = Math.floor(this.camera.x / map.tsize);
    const endCol = startCol + (this.camera.width / map.tsize);
    const startRow = Math.floor(this.camera.y / map.tsize);
    const endRow = startRow + (this.camera.height / map.tsize);
    const offsetX = -this.camera.x + startCol * map.tsize;
    const offsetY = -this.camera.y + startRow * map.tsize;

    for (let c = startCol; c <= endCol; c++) {
      for (let r = startRow; r <= endRow; r++) {
        const tile = getTile(layer, c, r);
        const x = (c - startCol) * map.tsize + offsetX;
        const y = (r - startRow) * map.tsize + offsetY;
        if (tile !== 0) { // 0 => empty tile
          ctx.drawImage(
            this.tileAtlas, // image
            (tile - 1) * map.tsize, // source x
            0, // source y
            map.tsize, // source width
            map.tsize, // source height
            Math.round(x), // target x
            Math.round(y), // target y
            map.tsize, // target width
            map.tsize // target height
          );
        }
      }
    }
  }

  render() {
    // Redraw map if there has been scroll
    if (this.hasScrolled) {
      this._drawMap();
      this._drawPlayers();
    }

    // Draw the map layers into game context
    this.ctx.drawImage(this.layerCanvas[0], 0, 0);
    this.ctx.drawImage(this.layerCanvas[1], 0, 0);
    this.ctx.drawImage(this.playerCanvas, 0, 0);
  }
}
