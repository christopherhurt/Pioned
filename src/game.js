import { ImageLoader, Styles, send, postChat, createCanvas } from './utils';
import { Keyboard, Keys } from './keyboard';
import { GameMap } from './map';
import { TILES, TILEMAP, BASES, FRAMES, DROPS, SPRITES } from './tiles';
import { Inventory } from './inventory';
import { Player, Camera } from './game-objects';
import { Modes, Context } from './context';
import { RefreshManager  } from './refresh';

const TSIZE = 16;
const DSIZE = 64;
const RATIO = DSIZE / TSIZE;
const PLAYER_REAL_WIDTH = 10;
const PLAYER_REAL_HEIGHT = 8;
const PLAYER_SRC_WIDTH = 14;
const PLAYER_SRC_HEIGHT = 16;
const PLAYER_DISPLAY_WIDTH = PLAYER_SRC_WIDTH * RATIO;
const PLAYER_DISPLAY_HEIGHT = DSIZE;

export class Game {
  constructor(ctx, canvasWidth, canvasHeight) {
    this.ctx = ctx;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
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
      Keys.ENTER,
    ]);
    this.menuRepeatDelay = 100;

    this.context = new Context(Modes.GAME);

    this.refreshManager = new RefreshManager();
    this.refreshManager.register('sprite', 2, 200);
    this.refreshManager.register('map', 3, 1500);
    this.refreshManager.register('menu', 2, 100);

    // Create a canvas for each layer
    this.layerCanvas = this.map.layers.map(() => createCanvas(this.canvasWidth, this.canvasHeight));
    this.playerCanvas = createCanvas(this.canvasWidth, this.canvasHeight);
    this.inventoryCanvas = createCanvas(this.canvasWidth, this.canvasHeight);
    this.menuCanvas = createCanvas(this.canvasWidth, this.canvasHeight);

    this.tileMap = this.loader.get('tiles');
    this.tileMap.width = 14;

    this.spriteMap = this.loader.get('sprites');
    this.spriteMap.width = 9;

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
          case 'startingPos': {
            const { x: xLoc, y: yLoc } = data;

            const DEFAULT_SPEED = 4 * this.map.dsize;
            const width = PLAYER_REAL_WIDTH * RATIO;
            const height = PLAYER_REAL_HEIGHT * RATIO;
            this.player = new Player(xLoc, yLoc, width, height, this.map.width, this.map.height, this.map.dsize, DEFAULT_SPEED);
            send(this.socket, 'newPlayer', this.player);

            resolve();
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

    let prevElapsed = 0;
    let frameCount = 0;
    let el = 0;

    const tick = (elapsed) => {
      window.requestAnimationFrame(tick);

      let delta = elapsed - prevElapsed;

      if (delta) {
        frameCount++;
        el += delta;
        if (el >= 1000) {
          this.fps = frameCount;
          frameCount = 0;
          el -= 1000;
        }
      }

      // Compute delta time in seconds -- also cap it
      // Maximum delta of 250 ms
      delta = Math.min(0.25, delta / 1000.0);
      prevElapsed = elapsed;

      this.refreshManager.update('sprite');
      this.refreshManager.update('map');
      this.refreshManager.updateIfFalse('menu');

      this.update(delta);
      this.render();
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
        if (this.context.trySwitchModes(Modes.GAME, this.keyboard.isDown([Keys.I, Keys.ENTER]))) { break; };
        this._updateInventory(delta);
        break;
    }
  }

  _updateMenu(delta) {

  }

  _updateInventory(delta) {
    const itemIDS = this.inventory.getItemIDS();

    const up = this.keyboard.isDownRepeat([Keys.UP, Keys.W], this.menuRepeatDelay);
    const down = this.keyboard.isDownRepeat([Keys.DOWN, Keys.S], this.menuRepeatDelay);

    if (up || down) {
      if (this.refreshManager.get('menu')) {
        this.refreshManager.reset('menu');

        let i = itemIDS.indexOf(this.inventory.selected);

        if (up) {
          if (i > 0) {
            i--;
          }
        } else {
          if (i < itemIDS.length - 1) {
            i++;
          }
        }

        const newId = itemIDS[i];
        this.inventory.select(newId);
      }
    }
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

      this.player.move(delta, dirx, diry, this.map);
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

    // Check current island
    const isCol = parseInt((this.player.x + this.player.width / 2) / this.map.width * this.map.islands[0].length);
    const isRow = parseInt((this.player.y + this.player.height / 2) / this.map.height * this.map.islands.length);
    const currIsland = this.map.islands[isRow][isCol];

    const pCol = parseInt((this.player.x + this.player.width / 2) / this.map.dsize);
    const pRow = parseInt((this.player.y + this.player.height / 2) / this.map.dsize);
    const currTile = this.map.getTile(0, pCol, pRow);
    const landID = TILES['land'];

    if (currIsland != 0 && currTile == landID && !this.player.hasVisitedIsland(currIsland)) {
      this.player.markIslandVisited(currIsland);
      postChat('Island ' + currIsland + ' visited!');
    }

    // Place object
    const item = this.inventory.selected;
    if (this.keyboard.isDown(Keys.K) && item !== this.inventory.NONE) {
      const [ x, y ] = this.player.selectCoords;
      const col = x / this.map.dsize | 0;
      const row = y / this.map.dsize | 0;

      const base = this.map.getTile(0, col, row);
      const obj = this.map.getTile(1, col, row);

      if (obj === 0
        && (!(item in BASES) || base === TILES[BASES[item]])
        && this.inventory.verify(item, 1)) {

        let objID = item;
        if (item === 'wood') {
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
        }

        this.inventory.remove(item, 1);

        this.map.setTile(1, col, row, TILES[objID]);
        send(this.socket, 'tileUpdate', { layer: 1, col, row, type: TILES[objID] });

        this.hasScrolled = true;
      }
    }

    // Take object
    if (this.keyboard.isDown(Keys.L)) {
      const [ x, y ] = this.player.selectCoords;
      const col = x / this.map.dsize | 0;
      const row = y / this.map.dsize | 0;

      const obj = this.map.getTile(1, col, row);
      if (obj !== 0) {
        this.map.setTile(1, col, row, 0);
        send(this.socket, 'tileUpdate', { layer: 1, col, row, type: 0 });

        if (row > 0) {
          this.map.setTile(2, col, row - 1, 0);
          send(this.socket, 'tileUpdate', { layer: 2, col, row: row - 1, type: 0 });
        }

        // Get drops
        if (DROPS[obj] !== null) {
          const [ drop, num ] = DROPS[obj];
          this.inventory.add(drop, num);
        }

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

    let fontSize = 50;
    ctx.font = `${fontSize}px ${Styles.fontFamily}`;
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
    const sideMargin = width * 0.1;
    x += sideMargin;
    y += height * 0.15;

    let fontSize = 50;
    ctx.font = `${fontSize}px ${Styles.fontFamily}`;
    ctx.fillStyle = Styles.light;
    ctx.fillText('Inventory', x, y);

    fontSize = 25;
    ctx.font = `${fontSize}px ${Styles.fontFamily}`;
    const separation = fontSize * 1.5;
    y += separation * 2;

    const items = this.inventory.items;
    for (let id in items) {
      const num = items[id];

      // Skip empty values
      if (num === 0) {
        continue;
      }

      ctx.fillStyle = (id === this.inventory.selected) ? Styles.special : Styles.light;
      ctx.fillText(id.toUpperCase(), x, y);
      if (id !== this.inventory.NONE) {
        ctx.fillText(num, x + width * 0.5, y);
      }

      y += separation;
    }
  }

  _drawPlayer(player) {
    const ctx = this.playerCanvas.getContext('2d');

    const x = -this.camera.x + player.x;
    const y = -this.camera.y + player.y;

    const image = this.spriteMap;

    // Only animate player if moving
    const index = player.moving ? this.refreshManager.index('sprite') + 1 : 0;
    const tile = SPRITES[player.sprite][player.dir * 3 + index];
    const tileX = (tile - 1) % image.width;
    const tileY = (tile - 1) / image.width | 0;

    const sourceXOffset = (this.map.tsize - PLAYER_SRC_WIDTH) / 2;
    const targetXOffset = -((PLAYER_SRC_WIDTH - PLAYER_REAL_WIDTH) / 2 * RATIO);
    const targetYOffset = -((PLAYER_SRC_HEIGHT - PLAYER_REAL_HEIGHT) * RATIO);

    ctx.drawImage(
      image, // image
      tileX * (1 + this.map.tsize) + 1 + sourceXOffset, // source x
      tileY * (1 + this.map.tsize) + 1, // source y
      PLAYER_SRC_WIDTH, // source width
      PLAYER_SRC_HEIGHT, // source height
      Math.round(x) + targetXOffset, // target x
      Math.round(y) + targetYOffset, // target y
      PLAYER_DISPLAY_WIDTH, // target width
      PLAYER_DISPLAY_HEIGHT, // target height
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

  _drawPlayers() {
    const ctx = this.playerCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Draw each other player
    for (let key in this.players) {
      this._drawPlayer(this.players[key]);
    }

    if (!this.player.moving) {
      // Draw select tile
      this._drawSelect();
    }

    // Draw player
    this._drawPlayer(this.player);
  }

  _drawMap() {
    this.map.layers.forEach((layer, index) => this._drawLayer(index));
  }

  _drawLayer(layer) {
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

        let image = this.tileMap;
        let tileIndex = TILEMAP[tile];

        if (tileIndex < 0) {
          image = this.spriteMap;
          tileIndex = FRAMES[-tileIndex][this.refreshManager.index('map')];
        }

        const tileX = (tileIndex - 1) % image.width;
        const tileY = (tileIndex - 1) / image.width | 0;

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

  render() {
    // Clear previous frame
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Redraw map if there has been scroll
    if (this.hasScrolled || this.refreshManager.get('map')) {
      this.hasScrolled = false;
      this._drawMap();
      this._drawPlayers();
    }

    // Redraw players if they moved
    if (this.playersMoved || this.refreshManager.get('sprite')) {
      this.playersMoved = false;
      this._drawPlayers();
    }

    // Draw the map layers into game context
    const last = this.layerCanvas.length - 1;
    for (let i = 0; i < last; i++) {
      this.ctx.drawImage(this.layerCanvas[i], 0, 0);
    }
    this.ctx.drawImage(this.playerCanvas, 0, 0);

    // Draw final object layer above player
    this.ctx.drawImage(this.layerCanvas[last], 0, 0);

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

    // Display fps
    this.ctx.fillStyle = 'red';
    const fontSize = 24;
    this.ctx.font = `${fontSize}px ${Styles.fontFamily}`;
    this.ctx.fillText(`fps: ${this.fps | 0}`, this.canvasWidth * 0.90, this.canvasHeight * 0.05);
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
    this.render();
  }
}
