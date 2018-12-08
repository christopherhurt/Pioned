import { SPRITE_DIMENSIONS } from './tiles';
import { clamp, sign } from './utils';
import { TSIZE, DSIZE, RATIO } from './globals';

export class GameObject {
  constructor(x, y, width, height, mapWidth, mapHeight, speedFactor = 4) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.maxX = mapWidth - width;
    this.maxY = mapHeight - height;

    this.sprite = null;
    this.moving = false;
    this.numFrames = 3;

    // Direction
    this.dir = 3; // Start facing down
    this.dirOffset = [0, 1];

    // Speed
    this.baseSpeed = this.speed = speedFactor * DSIZE;
    this.speedBonus = 0;
  }

  clampXY() {
    this.x = clamp(this.x, 0, this.maxX);
    this.y = clamp(this.y, 0, this.maxY);
  }

  move(delta, dirx, diry, map, collide = true) {
    if (diry === -1) {
      this.dir = 0; // Up
      this.dirOffset = [0, -1];
    } else if (diry === 1) {
      this.dir = 3; // Down
      this.dirOffset = [0, 1];
    } else if (dirx === -1) {
      this.dir = 1; // Left
      this.dirOffset = [-1, 0];
    } else if (dirx === 1) {
      this.dir = 2; // Right
      this.dirOffset = [1, 0];
    }

    // Make diagonal movement same speed as horizontal and vertical movement
    if (dirx && diry) {
      dirx *= Math.sqrt(2) / 2;
      diry *= Math.sqrt(2) / 2;
    }

    // Move X
    this.x += dirx * this.speed * delta;

    if (collide && dirx) {
      this.collideX(map);
    }

    // Move Y
    this.y += diry * this.speed * delta;

    if (collide && diry) {
      this.collideY(map);
    }

    this.clampXY();
  }

  collideX(map) {
    const collideWidth = this.width;
    const collideHeight = this.height;

    const leftCol = map.getCol(this.x);
    const rightCol = map.getCol(this.x + collideWidth);
    const topRow = map.getRow(this.y);
    const bottomRow = map.getRow(this.y + collideHeight);

    // Check top row
    if (map.isSolidTile(leftCol, topRow)) {
      this.x = Math.max(this.x, (leftCol + 1) * DSIZE);
    } else if (map.isSolidTile(rightCol, topRow)) {
      this.x = Math.min(this.x, rightCol * DSIZE - this.width);
    } else if (this.y + collideHeight > (topRow + 1) * DSIZE) { // Check bottom row
      if (map.isSolidTile(leftCol, bottomRow)) {
        this.x = Math.max(this.x, (leftCol + 1) * DSIZE);
      } else if (map.isSolidTile(rightCol, bottomRow)) {
        this.x = Math.min(this.x, rightCol * DSIZE - this.width);
      }
    }
  }

  collideY(map) {
    const collideWidth = this.width;
    const collideHeight = this.height;

    const leftCol = map.getCol(this.x);
    const rightCol = map.getCol(this.x + collideWidth);
    const topRow = map.getRow(this.y);
    const bottomRow = map.getRow(this.y + collideHeight);

    // Check left col
    if (map.isSolidTile(leftCol, topRow)) {
      this.y = Math.max(this.y, (topRow + 1) * DSIZE);
    } else if (map.isSolidTile(leftCol, bottomRow)) {
      this.y = Math.min(this.y, bottomRow * DSIZE - this.height);
    } else if (this.x + collideWidth > (leftCol + 1) * DSIZE) { // Check right col
      if (map.isSolidTile(rightCol, topRow)) {
        this.y = Math.max(this.y, (topRow + 1) * DSIZE);
      } else if (map.isSolidTile(rightCol, bottomRow)) {
        this.y = Math.min(this.y, bottomRow * DSIZE - this.height);
      }
    }
  }

  giveSpeedBonus(percent) {
    this.speedBonus += percent;
    this.speed = this.baseSpeed * (1 + this.speedBonus / 100.0);
  }
}

export class Player extends GameObject {
  constructor(x, y, width, height, sprite, mapWidth, mapHeight, name) {
    super(x, y, width, height, mapWidth, mapHeight);

    this.name = name;

    this.sprite = sprite;

    this.updateSelectTile();

    this.visitedIslands = [];
    this.contactedPlayers = [];

    this.pet = null;

    // Level
    this.level = 0;
  }

  updateSelectTile() {
    this.selectCoords = [
      (this.x + this.width / 2) + (this.dirOffset[0] * this.width),
      (this.y + this.height / 2) + (this.dirOffset[1] * this.height),
    ];
  }

  move(delta, dirx, diry, map) {
    super.move(delta, dirx, diry, map);
    this.updateSelectTile();
  }

  getCurrentIsland(map) {
    const col = (this.x + this.width / 2) / map.width * map.islands[0].length | 0;
    const row = (this.y + this.height / 2) / map.height * map.islands.length | 0;
    return map.islands[row][col];
  }

  markIslandVisited(island) {
    if(!this.visitedIslands.includes(island)) {
      this.visitedIslands.push(island);
    }
  }

  hasVisitedIsland(island) {
    return this.visitedIslands.includes(island);
  }
}

export class Pet extends GameObject {
  constructor(x, y, sprite, mapWidth, mapHeight) {
    const dims = SPRITE_DIMENSIONS[sprite];
    const width = dims.realDisplayWidth;
    const height = dims.realDisplayHeight;

    super(x, y, width, height, mapWidth, mapHeight);

    this.sprite = sprite;
    if (sprite === 'butterfly') {
      this.moving = true;
    }
  }

  follow(obj, delta, map) {
    // Go towards these values
    const gotoX = obj.x - obj.dirOffset[0] * DSIZE;
    const gotoY = obj.y - obj.dirOffset[1] * DSIZE;

    const dirx = sign(gotoX - this.x);
    const diry = sign(gotoY - this.y);

    this.move(delta, dirx, diry, map, this.sprite !== 'butterfly');

    // Don't go past
    if (sign(gotoX - this.x) !== dirx) {
      this.x = gotoX;
    };
    if (sign(gotoY - this.y) !== diry) {
      this.y = gotoY;
    };

    this.clampXY();
  }
}

export class Camera extends GameObject {
  constructor(width, height, mapWidth, mapHeight) {
    super(0, 0, width, height, mapWidth, mapHeight);
  }

  update(obj) {
    // Center camera on center of game object
    this.x = (obj.x + obj.width / 2) - this.width / 2;
    this.y = (obj.y + obj.height / 2) - this.height / 2;
    this.clampXY();
  }
}
