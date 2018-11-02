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
  constructor(width, height, mapWidth, mapHeight, speed) {
    super(0, 0, width, height);
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
  }

  move(delta, dirx, diry) {
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

    // Move player
    this.x += dirx * this.speed * delta;
    this.y += diry * this.speed * delta;
    // Clamp values
    this.x = Math.max(0, Math.min(this.x, this.maxX));
    this.y = Math.max(0, Math.min(this.y, this.maxY));

    // Update select tile
    this.selectCoords = [
      (this.x + this.width / 2) + (dirOffset[0] * this.width),
      (this.y + this.height / 2) + (dirOffset[1] * this.height),
    ];
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

