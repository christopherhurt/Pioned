const _fontFamily = 'Roboto Slab, sans-serif';
const _normal = 18;
const _medium = 24;
const _medium2 = 32;
const _large = 50;
export const Styles = {
  light: 'white',
  special: 'rgb(23,139,251)',
  special2: 'rgb(23,251,135)',
  important: 'red',
  lightBG: 'rgba(255,255,255,0.8)',
  darkBG: 'rgba(0,0,0,0.8)',
  fontFamily: _fontFamily,
  fontSize: _normal,
  mediumFontSize: _medium,
  mediumFontSize2: _medium2,
  largeFontSize: _large,
  font: `${_normal}px ${_fontFamily}`,
  mediumFont: `${_medium}px ${_fontFamily}`,
  largeFont: `${_large}px ${_fontFamily}`,
};

export function drawTextWithBackground(text, ctx, x, y, fontSize=Styles.fontSize, color=Styles.light, background=Styles.darkBG, align='left') {
  ctx.font = `${fontSize}px ${Styles.fontFamily}`;
  const textWidth = ctx.measureText(text).width;

  const bgWidth = textWidth + fontSize * 0.5;
  const bgHeight = fontSize * 1.7;

  // Alignment
  const awords = align.split(/[ ,]+/);
  if (awords.includes('center')) {
    x -= bgWidth / 2;
  } else if (awords.includes('right')) {
    x -= bgWidth;
  }
  if (awords.includes('above')) {
    y -= bgHeight;
  }

  ctx.fillStyle = background;
  ctx.fillRect(
    x,
    y,
    bgWidth,
    bgHeight,
  );

  ctx.fillStyle = color;
  ctx.fillText(text, x + fontSize * 0.25, y + fontSize * 1.2);

  return [bgWidth, bgHeight];
}

function _intersects(x1, y1, w1, h1, x2, y2, w2, h2) {
  return x1 <= x2 + w2 && x1 + w1 >= x2 && y1 <= y2 + h2 && y1 + h1 >= y2;
}

export function intersects(o1, o2) {
  return _intersects(o1.x, o1.y, o1.width, o1.height, o2.x, o2.y, o2.width, o2.height);
}

export function copyArray(arr) {
  const copy = [];

  for(let i = 0; i < arr.length; i++) {
    const row = [];

    for(let j = 0; j < arr[0].length; j++) {
      row.push(arr[i][j]);
    }

    copy.push(row);
  }

  return copy;
}

export function fillZeros(width, height) {
  return Array(height).fill().map(() => Array(width).fill(0));
}

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fadeOut(elem) {
  elem.style.opacity = 1;
  while (elem.style.opacity > 0) {
    elem.style.opacity -= 0.1
    await sleep(40);
  }
}

export async function postChat(message, type) {
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
  const chatWrap = document.getElementById('chat-wrap');
  chatWrap.scrollTop = chatWrap.scrollHeight;

  await sleep(10000);
  await fadeOut(div);
  chat.removeChild(div);
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
