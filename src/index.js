import { Game } from './game';

window.onload = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const canvas = document.getElementById('canvas');
  canvas.width = width
  canvas.height = height;
  // Show canvas after size adjustments
  canvas.style.opacity = 1;

  const ctx = canvas.getContext('2d');
  const game = new Game(ctx, width, height);

  window.addEventListener('resize', async (evt) => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width
    canvas.height = height;

    game.resize(width, height);
  });

  game.run();

};
