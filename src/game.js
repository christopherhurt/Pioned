import { ImageLoader, Keyboard, Keys, send, postChat } from './utils';
import { GameMap } from './map';
import { TILES, PLAYERS, SPRITES } from './tiles';

export class GameObject {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

export class Player extends GameObject {
  constructor(width, height, mapWidth, mapHeight, speed) {
    super(0, 0, width, height);
    this.maxX = mapWidth - width;
    this.maxY = mapHeight - height;
    this.speed = speed;

    // Assign random player
    const i = Math.random() * PLAYERS.length | 0;
    this.sprite = PLAYERS[i];
    this.dir = 3; // Start facing down
    this.moving = false;

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
  constructor(width, height, mapWidth, mapHeight) {
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
    try {
      await Promise.all([
        this.socketSetup(),
        this.loader.load('tiles', 'assets/Map.png'),
        this.loader.load('sprites', 'assets/Sprites.png'),
      ]);
    }
    catch (err) {
      postChat(err, 'error')
      return false;
    }

    this.keyboard.listenForEvents([
      Keys.LEFT,
      Keys.RIGHT,
      Keys.UP,
      Keys.DOWN,
      Keys.W,
      Keys.A,
      Keys.S,
      Keys.D,
      Keys.K,
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
    this.layerCanvas = this.map.layers.map(createCanvas);
    this.playerCanvas = createCanvas();

    this.tileMap = this.loader.get('tiles');
    this.tileMap.width = 14;

    this.spriteMap = this.loader.get('sprites');
    this.spriteMap.width = 9;

    const DEFAULT_SPEED = 4 * this.map.dsize;
    this.player = new Player(this.map.dsize, this.map.dsize, this.map.width, this.map.height, DEFAULT_SPEED);
    send(this.socket, 'newPlayer', this.player);

    this.camera = new Camera(this.canvasWidth, this.canvasHeight, this.map.width, this.map.height);
    this.camera.update(this.player);

    // Initial draw of the map
    this._drawMap(0);
    this._drawPlayers(0);

    return true;
  }

  socketSetup() {
    return new Promise((resolve, reject) => {
      postChat('Connecting to server...');
      this.socket = new WebSocket("ws://localhost:5000");

      this.socket.onopen = event => {
        postChat('Connected!');
        postChat('Downloading map...');
      };

      this.socket.onclose = event => {
        postChat('Disconnected from server.', 'error')
      };

      this.socket.onerror = event => {
        reject('Could not connect to server.');
      };

      this.socket.onmessage = event => {
        const { type, data } = JSON.parse(event.data);
        switch (type) {
          case 'selfid': {
            this.selfid = data;
            break;
          }
          case 'map': {
            this.map = Object.assign(new GameMap, data);
            postChat('Downloaded map!');
            resolve();
            break;
          }
          case 'players': {
            this.players = {};
            for (let key in data) {
              this.players[key] = Object.assign(new Player, data[key]);
            }
            this.playersMoved = true;
            break;
          }
          case 'newPlayer': {
            const { id, player } = data;
            this.players[id] = Object.assign(new Player, player);
            this.playersMoved = true;
            break;
          }
          case 'playerMoved': {
            const { id, x, y, dir, moving } = data;
            const player = this.players[id];
            player.x = x;
            player.y = y;
            player.dir = dir;
            player.moving = moving;
            this.playersMoved = true;
            break;
          }
          case 'tileUpdate': {
            const { layer, col, row, type } = data;
            this.map.setTile(layer, col, row, type);
            this.hasScrolled = true;
            break;
          }
          case 'deletePlayer': {
            delete this.players[data];
            this.playersMoved = true;
            break;
          }
          case 'info': {
            postChat(data);
            break;
          }
        }
      };
    });
  }

  async run() {
    const success = await this.init();
    if (!success) {
      return;
    }

    // Frames for each (moving) sprite
    const mapSpriteFrames = 3;
    const playerSpriteFrames = 2;
    // SRR = Sprite Refresh Rate (update every x seconds)
    const mapSRR = 1.5;
    const playerSRR = 0.2;
    const mapUpdateMS = 1000.0 * mapSRR * mapSpriteFrames;
    const playerUpdateMS = 1000.0 * playerSRR * playerSpriteFrames;

    const tick = (elapsed) => {
      window.requestAnimationFrame(tick);

      // Clear previous frame
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

      // Compute delta time in seconds -- also cap it
      // Maximum delta of 250 ms
      const delta = Math.min(0.25, (elapsed - this.previousElapsed) / 1000.0);
      this.previousElapsed = elapsed;

      const time = new Date().getTime();
      const mapSpriteIndex = (time % mapUpdateMS) / mapUpdateMS * mapSpriteFrames | 0;
      const playerSpriteIndex = (time % playerUpdateMS) / playerUpdateMS * playerSpriteFrames | 0;

      this.update(delta);
      this.render(mapSpriteIndex, playerSpriteIndex);
    };

    tick();
  }

  update(delta) {
    // Handle camera movement with arrow keys
    let dirx = 0;
    let diry = 0;
    if (this.keyboard.isDown([Keys.LEFT, Keys.A])) { dirx = -1; }
    if (this.keyboard.isDown([Keys.RIGHT, Keys.D])) { dirx = 1; }
    if (this.keyboard.isDown([Keys.UP, Keys.W])) { diry = -1; }
    if (this.keyboard.isDown([Keys.DOWN, Keys.S])) { diry = 1; }

    if (dirx || diry) {
      if (diry === -1) {
        this.player.dir = 0; // Up
      } else if (diry === 1) {
        this.player.dir = 3; // Down
      } else if (dirx === -1) {
        this.player.dir = 1; // Left
      } else if (dirx === 1) {
        this.player.dir = 2; // Right
      }

      this.hasScrolled = true;

      // Make diagonal movement same speed as horizontal and vertical movement
      if (dirx && diry) {
        dirx *= Math.sqrt(2) / 2;
        diry *= Math.sqrt(2) / 2;
      }

      this.player.moving = true;
      this.player.move(delta, dirx, diry);
      send(this.socket, 'playerMoved', {
        x: this.player.x,
        y: this.player.y,
        dir: this.player.dir,
        moving: this.player.moving,
      });
      this.camera.update(this.player);
    }
    else if (this.player.moving) {
      this.player.moving = false;
      send(this.socket, 'playerMoved', {
        x: this.player.x,
        y: this.player.y,
        dir: this.player.dir,
        moving: this.player.moving,
      });
    }

    // Place tree
    if (this.keyboard.isDown(Keys.K)) {
      const tree = 15;
      const ocean = 417;

      const col = this.player.x / this.map.dsize | 0;
      const row = this.player.y / this.map.dsize | 0;

      const base = this.map.getTile(0, col, row);
      const top = this.map.getTile(1, col, row);

      if (base !== ocean && top !== tree) {
        this.map.setTile(1, col, row, tree);
        send(this.socket, 'tileUpdate', { layer: 1, col, row, type: tree });
        this.hasScrolled = true;
      }
    }
  }

  _drawPlayers(spriteIndex) {
    const ctx = this.playerCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    const drawPlayer = player => {
      const x = -this.camera.x + player.x;
      const y = -this.camera.y + player.y;

      const image = this.spriteMap;

      // Only animate player if moving
      const index = player.moving ? spriteIndex + 1 : 0;
      const tile = SPRITES[player.sprite][player.dir * 3 + index];
      const tileX = (tile - 1) % image.width;
      const tileY = (tile - 1) / image.width | 0;

      ctx.drawImage(
        image, // image
        tileX * (1 + this.map.tsize) + 1, // source x
        tileY * (1 + this.map.tsize) + 1, // source y
        this.map.tsize, // source width
        this.map.tsize, // source height
        Math.round(x), // target x
        Math.round(y), // target y
        player.width, // target width
        player.height // target height
      );
    };

    for (let key in this.players) {
      drawPlayer(this.players[key]);
    }
    drawPlayer(this.player);
  }

  _drawMap(spriteIndex) {
    this.map.layers.forEach((layer, index) => this._drawLayer(index, spriteIndex));
  }

  _drawLayer(layer, spriteIndex) {
    const ctx = this.layerCanvas[layer].getContext('2d');
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    const startCol = this.camera.x / this.map.dsize | 0;
    const startRow = this.camera.y / this.map.dsize | 0;
    const numCols = this.camera.width / this.map.dsize + 1;
    const numRows = this.camera.height / this.map.dsize + 1;

    const offsetX = -this.camera.x + startCol * this.map.dsize;
    const offsetY = -this.camera.y + startRow * this.map.dsize;

    for (let i = 0; i < numCols; i++) {
      for (let j = 0; j < numRows; j++) {
        let tile = this.map.getTile(layer, startCol + i, startRow + j);
        if (tile === 0) { // Empty tile
          continue;
        }

        let image;
        if (tile === TILES['water']) {
          image = this.spriteMap;
          tile = SPRITES['water'][spriteIndex];
        }
        else {
          image = this.tileMap;
        }

        const tileX = (tile - 1) % image.width;
        const tileY = (tile - 1) / image.width | 0;

        const x = i * this.map.dsize + offsetX;
        const y = j * this.map.dsize + offsetY;

        ctx.drawImage(
          image, // image
          tileX * (1 + this.map.tsize) + 1, // source x
          tileY * (1 + this.map.tsize) + 1, // source y
          this.map.tsize, // source width
          this.map.tsize, // source height
          Math.round(x), // target x
          Math.round(y), // target y
          this.map.dsize, // target width
          this.map.dsize // target height
        );
      }
    }
  }

  render(mapSpriteIndex, playerSpriteIndex) {
    // Redraw map if there has been scroll
    if (mapSpriteIndex !== this.prevMapSpriteIndex || this.hasScrolled) {
      this.hasScrolled = false;
      this._drawMap(mapSpriteIndex);
      this._drawPlayers(playerSpriteIndex);
    }

    // Redraw players if they moved
    if (playerSpriteIndex !== this.prevPlayerSpriteIndex || this.playersMoved) {
      this.playersMoved = false;
      this._drawPlayers(playerSpriteIndex);
    }

    this.prevMapSpriteIndex = mapSpriteIndex;
    this.prevPlayerSpriteIndex = playerSpriteIndex;

    // Draw the map layers into game context
    for (let i = 0; i < this.layerCanvas.length; i++) {
      this.ctx.drawImage(this.layerCanvas[i], 0, 0);
    }
    this.ctx.drawImage(this.playerCanvas, 0, 0);
  }
}
