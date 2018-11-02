export function send(socket, type, data) {
  socket.send(JSON.stringify({type, data}));
}

export function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  return canvas;
};

export function postChat(message, type='info') {
  const div = document.createElement('div');
  div.className = 'chat-message';
  switch(type) {
    case 'info':
      div.className += ' chat-info-message';
      break;
    case 'debug':
      div.className += ' chat-debug-message';
      break;
    case 'error':
      div.className += ' chat-error-message';
      break;
    case 'success':
      div.className += ' chat-success-message';
      break;
  }
  div.innerText = message;

  const chat = document.getElementById('chat');
  chat.appendChild(div);
  // Scroll to bottom
  chat.scrollTop = chat.scrollHeight;
}

export class ImageLoader {
  constructor() {
    this.images = {};
  }

  load(key, src) {
    const img = new Image();
    const p = new Promise((resolve, reject) => {
      img.onload = () => {
        this.images[key] = img;
        resolve(img);
      };
      img.onerror = () => reject(`Could not load image: ${src}`);
    });
    img.src = src;
    return p;
  }

  get(key) {
    return this.images[key];
  }
}

export class Keyboard {
  constructor() {
    this._keys = {};
  }

  listenForEvents(keys) {
    window.addEventListener('keydown', evt => this._onKeyDown(evt));
    window.addEventListener('keyup', evt => this._onKeyUp(evt));

    keys.forEach(key => {
      this._keys[key] = false;
    });
  }

  _onKeyDown(event) {
    const keyCode = event.keyCode;
    if (keyCode in this._keys) {
      event.preventDefault();
      this._keys[keyCode] = true;
    }
  }

  _onKeyUp(event) {
    const keyCode = event.keyCode;
    if (keyCode in this._keys) {
      event.preventDefault();
      this._keys[keyCode] = false;
    }
  }

  _isDown(keyCode) {
    if (!keyCode in this._keys) {
      throw new Error(`Keycode ${keyCode} is not being listened to`);
    }
    return this._keys[keyCode];
  }

  isDown(input) {
    if (Array.isArray(input)) {
      return input.some(key => this._isDown(key));
    }
    else {
      return this._isDown(input);
    }
  }
}

export const Keys = {
  ESC: 27,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  0: 48,
  1: 49,
  2: 50,
  3: 51,
  4: 52,
  5: 53,
  6: 54,
  7: 55,
  8: 56,
  9: 57,
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,
};
