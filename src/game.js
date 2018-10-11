import { ImageLoader, Keyboard, Keys, messageFormat } from './utils';

const map = {
  cols: 12,
  rows: 12,
  tsize: 8, // Tile size
  dsize: 64, // Display size
  layers: [[
    33, 33, 1, 417, 417, 417, 417, 1, 1, 1, 1, 1,
    33, 33, 1, 417, 417, 417, 417, 1, 1, 1, 1, 1,
    33, 33, 1, 417, 417, 417, 1, 1, 1, 1, 1, 1,
    33, 33, 1, 417, 417, 417, 1, 1, 1, 1, 1, 1,
    33, 33, 1, 417, 417, 417, 1, 1, 1, 1, 1, 1,
    33, 33, 1, 1, 417, 417, 2, 1, 1, 1, 1, 1,
    33, 33, 2, 2, 417, 417, 1, 1, 1, 1, 1, 1,
    33, 33, 2, 2, 417, 417, 1, 1, 1, 1, 1, 1,
    33, 1, 1, 1, 417, 417, 1, 1, 1, 1, 1, 1,
    33, 1, 1, 1, 417, 417, 1, 1, 1, 1, 1, 1,
    33, 1, 1, 1, 417, 417, 1, 1, 1, 1, 1, 1,
    33, 1, 1, 1, 417, 417, 1, 1, 1, 1, 1, 3
  ], [
    15, 15, 0, 10, 11, 11, 12, 0, 0, 0, 0, 0,
    15, 15, 0, 42, 0, 0, 0, 0, 0, 0, 0, 0,
    15, 15, 0, 42, 0, 0, 0, 0, 0, 0, 0, 0,
    15, 15, 0, 42, 0, 0, 0, 0, 0, 5, 0, 0,
    15, 0, 0, 74, 0, 0, 0, 0, 0, 0, 0, 0,
    15, 0, 0, 0, 42, 0, 0, 0, 0, 0, 0, 0,
    15, 0, 0, 0, 42, 0, 0, 0, 0, 0, 0, 0,
    15, 0, 0, 0, 42, 0, 0, 0, 0, 0, 0, 0,
    15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    15, 0, 0, 0, 5, 4, 4, 4, 4, 4, 4, 0,
    15, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0
  ]],
};
const getTile = (layer, col, row) => map.layers[layer][row * map.cols + col];
const mapWidth = map.cols * map.dsize;
const mapHeight = map.rows * map.dsize;

const DEFAULT_SPEED = 4 * map.dsize; // Pixels per second

export class GameObject {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

export class Player extends GameObject {
  constructor(width, height, speed = DEFAULT_SPEED) {
    super(0, 0, width, height);
    this.maxX = mapWidth - width;
    this.maxY = mapHeight - height;
    this.speed = speed;

    // Assign random color
    const r = Math.random() * 255 | 0;
    const g = Math.random() * 255 | 0;
    const b = Math.random() * 255 | 0;
    this.color = `rgb(${r}, ${g}, ${b})`;
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

  async init() {
    await this.load();
    this.keyboard.listenForEvents([
      Keys.LEFT,
      Keys.RIGHT,
      Keys.UP,
      Keys.DOWN,
    ]);

    const createCanvas = () => {
      const canvas = document.createElement('canvas');
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;

      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      return canvas;
    };

    // Create a canvas for each layer
    this.layerCanvas = map.layers.map(createCanvas);
    this.playerCanvas = createCanvas();

    this.tileMap = this.loader.get('tiles');
    this.tileMap.width = 32;

    this.selfPlayer = new Player(40, 40);
    this.camera = new Camera(this.canvasWidth, this.canvasHeight);
    this.camera.update(this.selfPlayer);

    this.selfid = -1;
    this.players = {};

    this.socketSetup();

    // initial draw of the map
    this._drawMap();
    this._drawPlayers();
  }

  async load() {
    await Promise.all([
      this.loader.load('tiles', 'assets/tilesetP8.png'),
    ]);
  }

  socketSetup() {
    // Connect to server
    this.socket = new WebSocket("ws://chrishurt.us:5000");

    this.socket.onopen = event => {
      this.socket.send(messageFormat('playerUpdate', this.selfPlayer));
    };

    this.socket.onmessage = event => {
      const { type, data } = JSON.parse(event.data);
      switch (type) {
        case 'selfid':
          this.selfid = data;
          break;
        case 'players':
          for (let key in data) {
            this.players[key] = Object.assign(new Player, data[key]);
          }
          this.playersMoved = true;
          break;
        case 'playerUpdate':
          this.players[data.id] = Object.assign(new Player, data.player);
          this.playersMoved = true;
          break;
        case 'deletePlayer':
          delete this.players[data];
          this.playersMoved = true;
          break;
        case 'info':
          console.log('info:', data);
          break;
      }
    };
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

      this.selfPlayer.move(delta, dirx, diry);
      this.socket.send(messageFormat('playerUpdate', this.selfPlayer));
      this.camera.update(this.selfPlayer);
    }
  }

  _drawPlayers() {
    const ctx = this.playerCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    const drawPlayer = player => {
      const x = -this.camera.x + player.x;
      const y = -this.camera.y + player.y;

      // Border around player
      ctx.fillStyle = 'black';
      ctx.strokeRect(
        Math.round(x),
        Math.round(y),
        player.width,
        player.height
      );

      ctx.fillStyle = player.color;
      ctx.fillRect(
        Math.round(x),
        Math.round(y),
        player.width,
        player.height
      );
    };

    for (let key in this.players) {
      drawPlayer(this.players[key]);
    }
    drawPlayer(this.selfPlayer);
  }

  _drawMap() {
    map.layers.forEach((layer, index) => this._drawLayer(index));
  }

  _drawLayer(layer) {
    const ctx = this.layerCanvas[layer].getContext('2d');
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    const startCol = this.camera.x / map.dsize | 0;
    const startRow = this.camera.y / map.dsize | 0;
    const numCols = this.camera.width / map.dsize + 1;
    const numRows = this.camera.height / map.dsize + 1;

    const offsetX = -this.camera.x + startCol * map.dsize;
    const offsetY = -this.camera.y + startRow * map.dsize;

    for (let i = 0; i < numCols; i++) {
      for (let j = 0; j < numRows; j++) {
        const tile = getTile(layer, startCol + i, startRow + j);
        // Empty tile
        if (tile === 0) {
          continue;
        }

        const tileX = (tile - 1) % this.tileMap.width;
        const tileY = (tile - 1) / this.tileMap.width | 0;

        const x = i * map.dsize + offsetX;
        const y = j * map.dsize + offsetY;

        ctx.drawImage(
          this.tileMap, // image
          tileX * map.tsize, // source x
          tileY * map.tsize, // source y
          map.tsize, // source width
          map.tsize, // source height
          Math.round(x), // target x
          Math.round(y), // target y
          map.dsize, // target width
          map.dsize // target height
        );
      }
    }
  }

  render() {
    // Redraw map if there has been scroll
    if (this.hasScrolled) {
      this.hasScrolled = false;
      this._drawMap();
      this._drawPlayers();
    }

    // Redraw players if they moved
    if (this.playersMoved) {
      this.playersMoved = false;
      this._drawPlayers();
    }

    // Draw the map layers into game context
    this.ctx.drawImage(this.layerCanvas[0], 0, 0);
    this.ctx.drawImage(this.layerCanvas[1], 0, 0);
    this.ctx.drawImage(this.playerCanvas, 0, 0);
  }
}
