import { PLAYERS } from './tiles';
import { clamp, randChoice } from './utils';

export class GameObject {
  constructor(x, y, width, height, mapWidth, mapHeight, dsize, speedFactor = 4) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.maxX = mapWidth - width;
    this.maxY = mapHeight - height;

    // Direction
    this.dir = 3; // Start facing down
    this.dirOffset = [0, 1];

    // Speed
    this.baseSpeed = this.speed = speedFactor * dsize;
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

    // Clamp values
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
      this.x = Math.max(this.x, (leftCol + 1) * map.dsize);
    } else if (map.isSolidTile(rightCol, topRow)) {
      this.x = Math.min(this.x, rightCol * map.dsize - this.width);
    } else if (this.y + collideHeight > (topRow + 1) * map.dsize) { // Check bottom row
      if (map.isSolidTile(leftCol, bottomRow)) {
        this.x = Math.max(this.x, (leftCol + 1) * map.dsize);
      } else if (map.isSolidTile(rightCol, bottomRow)) {
        this.x = Math.min(this.x, rightCol * map.dsize - this.width);
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
      this.y = Math.max(this.y, (topRow + 1) * map.dsize);
    } else if (map.isSolidTile(leftCol, bottomRow)) {
      this.y = Math.min(this.y, bottomRow * map.dsize - this.height);
    } else if (this.x + collideWidth > (leftCol + 1) * map.dsize) { // Check right col
      if (map.isSolidTile(rightCol, topRow)) {
        this.y = Math.max(this.y, (topRow + 1) * map.dsize);
      } else if (map.isSolidTile(rightCol, bottomRow)) {
        this.y = Math.min(this.y, bottomRow * map.dsize - this.height);
      }
    }
  }

  giveSpeedBonus(percent) {
    this.speedBonus += percent;
    this.speed = this.baseSpeed * (1 + this.speedBonus / 100.0);
  }
}

export class Player extends GameObject {
  constructor(x, y, width, height, mapWidth, mapHeight, dsize, speedFactor, name) {
    super(x, y, width, height, mapWidth, mapHeight, dsize, speedFactor);
    this.name = name;

    // Assign random player sprite
    this.sprite = randChoice(PLAYERS);

    this.updateSelectTile();

    this.moving = false;

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

export class Camera {
  constructor(width, height, mapWidth, mapHeight) {
    this.x = 0;
    this.y = 0;
    this.width = width;
    this.height = height;
    this.maxX = mapWidth - width;
    this.maxY = mapHeight - height;
  }

  update(gameObject) {
    // Center camera on center of game object
    this.x = (gameObject.x + gameObject.width / 2) - this.width / 2;
    this.y = (gameObject.y + gameObject.height / 2) - this.height / 2;
    // Clamp values
    this.x = clamp(this.x, 0, this.maxX);
    this.y = clamp(this.y, 0, this.maxY);
  }
}
