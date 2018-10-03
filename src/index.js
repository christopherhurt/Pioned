import { Game } from './game';

window.onload = () => {
  const width = 512;
  const height = 512;

  const canvas = document.getElementById('canvas');
  canvas.width = width
  canvas.height = height;
  // Show canvas after size adjustments
  canvas.style.opacity = 1;

  const ctx = canvas.getContext('2d');
  const game = new Game(ctx, width, height);
  game.run();
};
