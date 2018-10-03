//
// Keyboard handler
//

var Keyboard = {};

Keyboard.LEFT = 37;
Keyboard.RIGHT = 39;
Keyboard.UP = 38;
Keyboard.DOWN = 40;

Keyboard._keys = {};

Keyboard.listenForEvents = function (keys) {
  window.addEventListener('keydown', this._onKeyDown.bind(this));
  window.addEventListener('keyup', this._onKeyUp.bind(this));

  keys.forEach(function (key) {
    this._keys[key] = false;
  }.bind(this));
}

Keyboard._onKeyDown = function (event) {
  var keyCode = event.keyCode;
  if (keyCode in this._keys) {
    event.preventDefault();
    this._keys[keyCode] = true;
  }
};

Keyboard._onKeyUp = function (event) {
  var keyCode = event.keyCode;
  if (keyCode in this._keys) {
    event.preventDefault();
    this._keys[keyCode] = false;
  }
};

Keyboard.isDown = function (keyCode) {
  if (!keyCode in this._keys) {
    throw new Error('Keycode ' + keyCode + ' is not being listened to');
  }
  return this._keys[keyCode];
};

//
// Game object
//

var Game = {};

Game.run = function (context) {
  this.ctx = context;
  this._previousElapsed = 0;

  var p = this.load();
  Promise.all(p).then(function (loaded) {
    this.init();
    window.requestAnimationFrame(this.tick);
  }.bind(this));
};

Game.tick = function (elapsed) {
  window.requestAnimationFrame(this.tick);

  // clear previous frame
  this.ctx.clearRect(0, 0, 512, 512);

  // compute delta time in seconds -- also cap it
  var delta = (elapsed - this._previousElapsed) / 1000.0;
  delta = Math.min(delta, 0.25); // maximum delta of 250 ms
  this._previousElapsed = elapsed;

  this.update(delta);
  this.render();
}.bind(Game);

// override these methods to create the demo
Game.init = function () {};
Game.update = function (delta) {};
Game.render = function () {};

//
// start up function
//

function setUpCanvas() {
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');

  // Modify canvas to be high DPI
  // Lovingly adapted from http://stackoverflow.com/a/15666143/1313757
  const dpr = window.devicePixelRatio || 1;
  const bsr = context.webkitBackingStorePixelRatio
    || context.mozBackingStorePixelRatio
    || context.msBackingStorePixelRatio
    || context.oBackingStorePixelRatio
    || context.backingStorePixelRatio
    || 1;
  const ratio = dpr / bsr;

  const width = 512;
  const height = 512;

  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return context;
}

window.onload = () => {
  const context = setUpCanvas();
  Game.run(context);
};
