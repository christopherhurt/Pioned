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
