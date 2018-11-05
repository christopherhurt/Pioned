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
    const key = event.keyCode;
    if (key in this._keys) {
      event.preventDefault();
      if (this._keys[key] === false) {
        this._keys[key] = 0;
      }
    }
  }

  _onKeyUp(event) {
    const key = event.keyCode;
    if (key in this._keys) {
      event.preventDefault();
      this._keys[key] = false;
    }
  }

  _isDown(key) {
    if (!key in this._keys) {
      throw new Error(`Keycode ${key} is not being listened to`);
    }
    return this._keys[key] !== false;
  }

  _isDownRepeat(key, delay) {
    if (this._isDown(key)) {
      const time = new Date().getTime();
      if (time - this._keys[key] > delay) {
        this._keys[key] = time;
        return true;
      }
    }
    return false;
  }

  isDown(input) {
    if (Array.isArray(input)) {
      return input.some(key => this._isDown(key));
    }
    else {
      return this._isDown(input);
    }
  }

  isDownRepeat(input, delay) {
    if (Array.isArray(input)) {
      return input.some(key => this._isDownRepeat(key, delay));
    }
    else {
      return this._isDownRepeat(input, delay);
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
