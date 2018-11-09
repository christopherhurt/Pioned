import { PLAYERS } from './tiles';

export class GameObject {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

export class Player extends GameObject {
  constructor(xLoc, yLoc, width, height, mapWidth, mapHeight, dsize, speed) {
    const x = xLoc * dsize + dsize / 2 - width / 2;
    const y = yLoc * dsize + dsize / 2 - height / 2;

    super(x, y, width, height);
    this.maxX = mapWidth - width;
    this.maxY = mapHeight - height;
    this.speed = speed;

    // Assign random player
    const i = Math.random() * PLAYERS.length | 0;
    this.sprite = PLAYERS[i];

    // Direction
    this.dir = 3; // Start facing down
    const dirOffset = [0, 1];
    // Update select tile
    this.selectCoords = [
      (this.x + this.width / 2) + (dirOffset[0] * this.width),
      (this.y + this.height / 2) + (dirOffset[1] * this.height),
    ];

    this.moving = false;

    // Assign random color
    const r = Math.random() * 255 | 0;
    const g = Math.random() * 255 | 0;
    const b = Math.random() * 255 | 0;
    this.color = `rgb(${r}, ${g}, ${b})`;

    this.visitedIslands = [];
    this.contactedPlayers = [];
    
    const objective = generateObjective();
    this.objectiveId = objective['id'];
    this.objectiveData = objective['data'];
    postChat('New objective "' + getObjectiveName(objectiveId) + '": ' + getObjectiveDescription(objectiveId, objectiveData));
  }

  move(delta, dirx, diry, map) {
    let dirOffset;
    if (diry === -1) {
      this.dir = 0; // Up
      dirOffset = [0, -1];
    } else if (diry === 1) {
      this.dir = 3; // Down
      dirOffset = [0, 1];
    } else if (dirx === -1) {
      this.dir = 1; // Left
      dirOffset = [-1, 0];
    } else if (dirx === 1) {
      this.dir = 2; // Right
      dirOffset = [1, 0];
    }

    // Make diagonal movement same speed as horizontal and vertical movement
    if (dirx && diry) {
      dirx *= Math.sqrt(2) / 2;
      diry *= Math.sqrt(2) / 2;
    }

    // Move player and do collision detection
    this.collide(dirx, diry, map, delta);

    // Clamp values
    this.x = Math.max(0, Math.min(this.x, this.maxX));
    this.y = Math.max(0, Math.min(this.y, this.maxY));

    // Update select tile
    this.selectCoords = [
      (this.x + this.width / 2) + (dirOffset[0] * this.width),
      (this.y + this.height / 2) + (dirOffset[1] * this.height),
    ];
  }

  collide(dirx, diry, map, delta) {
    const collideWidth = this.width;
    const collideHeight = this.height;

    this.x += dirx * this.speed * delta;

    let leftCol = map.getCol(this.x);
    let rightCol = map.getCol(this.x + collideWidth);
    let topRow = map.getRow(this.y);
    let bottomRow = map.getRow(this.y + collideHeight);

    if (dirx) {
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

    this.y += diry * this.speed * delta;

    leftCol = map.getCol(this.x);
    rightCol = map.getCol(this.x + collideWidth);
    topRow = map.getRow(this.y);
    bottomRow = map.getRow(this.y + collideHeight);

    if (diry) {
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
    this.x = Math.max(0, Math.min(this.x, this.maxX));
    this.y = Math.max(0, Math.min(this.y, this.maxY));
  }
}
