import { ImageLoader, Keyboard, Keys, send, postChat, createCanvas } from './utils';
import { GameMap } from './map';
import { TILES, SPRITES } from './tiles';
import { Inventory } from './inventory';
import { Player, Camera } from './game-objects';
import { Modes, Context } from './context';

const Styles = {
  light: 'white',
  lightBG: 'rgba(255,255,255,0.8)',
  darkBG: 'rgba(0,0,0,0.8)',
  largeFont: '50px Roboto Slab',
  mediumFont: '25px Roboto Slab',
};

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
      Keys.L,
      Keys.I,
      Keys.ESC,
    ]);

    this.context = new Context(Modes.GAME);

    // Create a canvas for each layer
    this.layerCanvas = this.map.layers.map(() => createCanvas(this.canvasWidth, this.canvasHeight));
    this.playerCanvas = createCanvas(this.canvasWidth, this.canvasHeight);
    this.inventoryCanvas = createCanvas(this.canvasWidth, this.canvasHeight);
    this.menuCanvas = createCanvas(this.canvasWidth, this.canvasHeight);

    this.tileMap = this.loader.get('tiles');
    this.tileMap.width = 14;

    this.spriteMap = this.loader.get('sprites');
    this.spriteMap.width = 9;

    const DEFAULT_SPEED = 4 * this.map.dsize;
    this.player = new Player(this.map.dsize, this.map.dsize, this.map.width, this.map.height, DEFAULT_SPEED);
    send(this.socket, 'newPlayer', this.player);

    this.camera = new Camera(this.canvasWidth, this.canvasHeight, this.map.width, this.map.height);
    this.camera.update(this.player);

    this.inventory = new Inventory();

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
        postChat('Connected!', 'success');
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
            postChat('Downloaded map!', 'success');
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
    switch (this.context.getMode()) {
      case Modes.MENU:
        if (this.context.trySwitchModes(Modes.GAME, this.keyboard.isDown(Keys.ESC))) { break; };
        this._updateMenu(delta);
        break;
      case Modes.GAME:
        if (this.context.trySwitchModes(Modes.MENU, this.keyboard.isDown(Keys.ESC))) { break; };
        if (this.context.trySwitchModes(Modes.INVENTORY, this.keyboard.isDown(Keys.I))) { break; };
        this._updateGame(delta);
        break;
      case Modes.INVENTORY:
        if (this.context.trySwitchModes(Modes.GAME, this.keyboard.isDown(Keys.I))) { break; };
        this._updateInventory(delta);
        break;
    }
  }

  _updateMenu(delta) {

  }

  _updateInventory(delta) {

  }

  _updateGame(delta) {
    // Handle camera movement with arrow keys
    let dirx = 0;
    let diry = 0;
    if (this.keyboard.isDown([Keys.LEFT, Keys.A])) { dirx = -1; }
    if (this.keyboard.isDown([Keys.RIGHT, Keys.D])) { dirx = 1; }
    if (this.keyboard.isDown([Keys.UP, Keys.W])) { diry = -1; }
    if (this.keyboard.isDown([Keys.DOWN, Keys.S])) { diry = 1; }

    if (dirx || diry) {
      this.hasScrolled = true;
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

    // Place bridge
    if (this.keyboard.isDown(Keys.K)) {
      const [ x, y ] = this.player.selectCoords;
      const col = x / this.map.dsize | 0;
      const row = y / this.map.dsize | 0;

      const base = this.map.getTile(0, col, row);
      const obj = this.map.getTile(1, col, row);

      if (base === TILES['water'] && obj === 0 && this.inventory.verify('wood', 1)) {
        let objID;
        switch (this.player.dir) {
          case 0: // Up
          case 3: // Down
            objID = 'bridge';
            break;
          case 1: // Left
          case 2: // Right
            objID = 'side_bridge';
            break;
        }

        this.map.setTile(1, col, row, TILES[objID]);
        send(this.socket, 'tileUpdate', { layer: 1, col, row, type: TILES[objID] });

        this.inventory.remove('wood', 1);
        this.hasScrolled = true;
      }
    }

    // Take tree
    if (this.keyboard.isDown(Keys.L)) {
      const [ x, y ] = this.player.selectCoords;
      const col = x / this.map.dsize | 0;
      const row = y / this.map.dsize | 0;

      const obj = this.map.getTile(1, col, row);
      if (obj === TILES['tree_bottom'] || obj === TILES['apple_tree_bottom']) {
        this.map.setTile(1, col, row, 0);
        send(this.socket, 'tileUpdate', { layer: 1, col, row, type: 0 });

        if (row > 0) {
          this.map.setTile(2, col, row - 1, 0);
          send(this.socket, 'tileUpdate', { layer: 2, col, row: row - 1, type: 0 });
        }

        this.inventory.add('wood', 2);
        this.hasScrolled = true;
      }
    }
  }

  _drawMenu() {
    const ctx = this.menuCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    const width = this.canvasWidth * 0.60;
    const height = this.canvasHeight * 0.75;

    let x = (this.canvasWidth - width) / 2;
    let y = (this.canvasHeight - height) / 2;

    ctx.fillStyle = Styles.darkBG;
    ctx.fillRect(
      x,
      y,
      width,
      height,
    );

    // Margins
    x += width * 0.1;
    y += height * 0.15;

    ctx.font = Styles.largeFont;
    ctx.fillStyle = Styles.light;
    ctx.fillText('Menu', x, y);
  }

  _drawInventory() {
    const ctx = this.inventoryCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    const width = this.canvasWidth * 0.60;
    const height = this.canvasHeight * 0.75;

    let x = (this.canvasWidth - width) / 2;
    let y = (this.canvasHeight - height) / 2;

    ctx.fillStyle = Styles.darkBG;
    ctx.fillRect(
      x,
      y,
      width,
      height,
    );

    // Margins
    x += width * 0.1;
    y += height * 0.15;

    ctx.font = Styles.largeFont;
    ctx.fillStyle = Styles.light;
    ctx.fillText('Inventory', x, y);

    ctx.font = Styles.mediumFont;
    const separation = 35;
    y += 65;

    const items = this.inventory.getItems();
    for (let item in items) {
      const num = items[item];

      // Skip empty values
      if (num === 0) {
        continue;
      }

      ctx.fillText(
        `${item.toUpperCase()} : ${num}`,
        x,
        y,
      );

      y += separation;
    }
  }

  _drawPlayer(player, spriteIndex) {
    const ctx = this.playerCanvas.getContext('2d');

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
  }

  _drawSelect() {
    const ctx = this.playerCanvas.getContext('2d');

    let [ selectX, selectY ] = this.player.selectCoords;
    selectX -= selectX % this.map.dsize;
    selectY -= selectY % this.map.dsize;

    const x = -this.camera.x + selectX;
    const y = -this.camera.y + selectY;
    ctx.strokeStyle = Styles.lightBG;
    ctx.strokeRect(
      Math.round(x),
      Math.round(y),
      this.map.dsize,
      this.map.dsize
    );
  }

  _drawPlayers(spriteIndex) {
    const ctx = this.playerCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Draw each other player
    for (let key in this.players) {
      this._drawPlayer(this.players[key], spriteIndex);
    }

    if (!this.player.moving) {
      // Draw select tile
      this._drawSelect();
    }

    // Draw player
    this._drawPlayer(this.player, spriteIndex);
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

    switch (this.context.getMode()) {
      case Modes.MENU:
        this._drawMenu();
        this.ctx.drawImage(this.menuCanvas, 0, 0);
        break;
      case Modes.INVENTORY:
        this._drawInventory();
        this.ctx.drawImage(this.inventoryCanvas, 0, 0);
        break;
    }

    // Uncomment the below code once collision detection for trees is finished
    // =======================================================================

//  // Draw map layers (except last object layer)
//  const last = this.layerCanvas.length - 1;
//  for (let i = 0; i < last; i++) {
//    this.ctx.drawImage(this.layerCanvas[i], 0, 0);
//  }

//  // Draw players
//  this.ctx.drawImage(this.playerCanvas, 0, 0);

//  // Draw last object layer
//  this.ctx.drawImage(this.layerCanvas[last], 0, 0);
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;

    this.layerCanvas = this.map.layers.map(() => createCanvas(width, height));
    this.playerCanvas = createCanvas(width, height);

    this.camera.width = width;
    this.camera.height = height;
    this.camera.maxX = this.map.width - width;
    this.camera.maxY = this.map.height - height;
    this.camera.update(this.player);

    // Re-render
    this.hasScrolled = true;
    this.render(this.prevMapSpriteIndex, this.prevPlayerSpriteIndex);
  }
}
