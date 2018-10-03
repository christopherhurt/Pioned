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
    window.addEventListener('keydown', this._onKeyDown.bind(this));
    window.addEventListener('keyup', this._onKeyUp.bind(this));

    keys.forEach(key => {
      this._keys[key] = false;
    });
  }

  _onKeyDown(event) {
    var keyCode = event.keyCode;
    if (keyCode in this._keys) {
      event.preventDefault();
      this._keys[keyCode] = true;
    }
  }

  _onKeyUp(event) {
    var keyCode = event.keyCode;
    if (keyCode in this._keys) {
      event.preventDefault();
      this._keys[keyCode] = false;
    }
  }

  isDown(keyCode) {
    if (!keyCode in this._keys) {
      throw new Error(`Keycode ${keyCode} is not being listened to`);
    }
    return this._keys[keyCode];
  }
}
