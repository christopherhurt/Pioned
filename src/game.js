import { ImageLoader, Keyboard, Keys } from './utils';

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
const mapWidth = map.cols * map.tsize;
const mapHeight = map.rows * map.tsize;

const DEFAULT_SPEED = 4 * map.tsize; // Pixels per second

class GameObject {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

class Player extends GameObject {
  constructor(width, height, speed = DEFAULT_SPEED) {
    super(0, 0, width, height);
    this.maxX = mapWidth - width;
    this.maxY = mapHeight - height;
    this.speed = speed;
  }

  move(delta, dirx, diry) {
    // Move player
    this.x += dirx * this.speed * delta;
    this.y += diry * this.speed * delta;
    // Clamp values
    this.x = Math.max(0, Math.min(this.x, this.maxX));
    this.y = Math.max(0, Math.min(this.y, this.maxY));
  }
}

class Camera {
  constructor(width, height) {
    this.x = 0;
    this.y = 0;
    this.width = width;
    this.height = height;
    this.maxX = mapWidth - width;
    this.maxY = mapHeight - height;
  }

  update(gameObject) {
    // Center camera on game object
    this.x = gameObject.x - this.width / 2;
    this.y = gameObject.y - this.height / 2;
    // Clamp values
    this.x = Math.max(0, Math.min(this.x, this.maxX));
    this.y = Math.max(0, Math.min(this.y, this.maxY));
  }
}

export class Game {
  constructor(ctx, canvasWidth, canvasHeight) {
    this.ctx = ctx;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.previousElapsed = 0;
    this.loader = new ImageLoader();
    this.keyboard = new Keyboard();
  }

  async load() {
    await Promise.all([
      this.loader.load('tiles', 'assets/tiles.png'),
    ]);
  }

  async init() {
    await this.load();
    this.keyboard.listenForEvents([
      Keys.LEFT,
      Keys.RIGHT,
      Keys.UP,
      Keys.DOWN,
    ]);

    const createCanvas = () => {
      const c = document.createElement('canvas');
      c.width = this.canvasWidth;
      c.height = this.canvasHeight;
      return c;
    };

    // Create a canvas for each layer
    this.layerCanvas = map.layers.map(createCanvas);
    this.playerCanvas = createCanvas();

    this.tileAtlas = this.loader.get('tiles');
    this.camera = new Camera(this.canvasWidth, this.canvasHeight);
    this.mainCharacter = new Player(40, 40);
    this.camera.update(this.mainCharacter);

    // initial draw of the map
    this._drawMap();
    this._drawPlayers();
  }

  async run() {
    await this.init();

    const tick = (elapsed) => {
      window.requestAnimationFrame(tick);

      // Clear previous frame
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

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
      this.hasScrolled = true;

      // Make diagonal movement same speed as horizontal and vertical movement
      if (dirx && diry) {
        dirx *= Math.sqrt(2) / 2;
        diry *= Math.sqrt(2) / 2;
      }

      this.mainCharacter.move(delta, dirx, diry);
      this.camera.update(this.mainCharacter);
    }
  }

  _drawPlayers() {
    const ctx = this.playerCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    const x = -this.camera.x + this.mainCharacter.x;
    const y = -this.camera.y + this.mainCharacter.y;

    ctx.fillStyle = 'blue';
    ctx.fillRect(
      Math.round(x),
      Math.round(y),
      this.mainCharacter.width,
      this.mainCharacter.height
    );
  }

  _drawMap() {
    map.layers.forEach((layer, index) => this._drawLayer(index));
  }

  _drawLayer(layer) {
    const ctx = this.layerCanvas[layer].getContext('2d');
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    const startCol = this.camera.x / map.tsize | 0;
    const startRow = this.camera.y / map.tsize | 0;
    const numCols = this.camera.width / map.tsize + 1;
    const numRows = this.camera.height / map.tsize + 1;

    const offsetX = -this.camera.x + startCol * map.tsize;
    const offsetY = -this.camera.y + startRow * map.tsize;

    for (let i = 0; i < numCols; i++) {
      for (let j = 0; j < numRows; j++) {
        const tile = getTile(layer, startCol + i, startRow + j);
        const x = i * map.tsize + offsetX;
        const y = j * map.tsize + offsetY;
        if (tile) { // 0 => empty tile
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
