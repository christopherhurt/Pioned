import WebSocket from 'ws';
import { send } from './src/utils';

let index = 0;
const players = {};

const map = {
  cols: 12,
  rows: 12,
  tsize: 8, // Tile size
  dsize: 64, // Display size
  layers: [[
    33, 33, 1, 417, 417, 417, 417, 1, 1, 1, 1, 1,
    33, 33, 1, 417, 417, 417, 417, 1, 1, 1, 1, 1,
    33, 33, 1, 417, 417, 417, 1, 1, 1, 1, 1, 1,
    33, 33, 1, 417, 417, 417, 1, 1, 1, 1, 1, 1,
    33, 33, 1, 417, 417, 417, 1, 1, 1, 1, 1, 1,
    33, 33, 1, 1, 417, 417, 2, 1, 1, 1, 1, 1,
    33, 33, 2, 2, 417, 417, 1, 1, 1, 1, 1, 1,
    33, 33, 2, 2, 417, 417, 1, 1, 1, 1, 1, 1,
    33, 1, 1, 1, 417, 417, 1, 1, 1, 1, 1, 1,
    33, 1, 1, 1, 417, 417, 1, 1, 1, 1, 1, 1,
    33, 1, 1, 1, 417, 417, 1, 1, 1, 1, 1, 1,
    33, 1, 1, 1, 417, 417, 1, 1, 1, 1, 1, 3
  ], [
    15, 15, 0, 10, 11, 11, 12, 0, 0, 0, 0, 0,
    15, 15, 0, 42, 0, 0, 0, 0, 0, 0, 0, 0,
    15, 15, 0, 42, 0, 0, 0, 0, 0, 0, 0, 0,
    15, 15, 0, 42, 0, 0, 0, 0, 0, 5, 0, 0,
    15, 0, 0, 74, 0, 0, 0, 0, 0, 0, 0, 0,
    15, 0, 0, 0, 42, 0, 0, 0, 0, 0, 0, 0,
    15, 0, 0, 0, 42, 0, 0, 0, 0, 0, 0, 0,
    15, 0, 0, 0, 42, 0, 0, 0, 0, 0, 0, 0,
    15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    15, 0, 0, 0, 5, 4, 4, 4, 4, 4, 4, 0,
    15, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0
  ]],
};
map.width = map.cols * map.dsize;
map.height = map.rows * map.dsize;
const setTile = (layer, col, row, type) => map.layers[layer][row * map.cols + col] = type;

const wss = new WebSocket.Server({ port: 5000 });

// Broadcast to all.
wss.broadcast = (type, data) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      send(client, type, data);
    }
  });
};

// Broadcast to everyone else.
wss.broadcastOthers = (socket, type, data) => {
  wss.clients.forEach(client => {
    if (client !== socket && client.readyState === WebSocket.OPEN) {
      send(client, type, data);
    }
  });
}

wss.on('connection', socket => {
  socket.id = index++;
  send(socket, 'selfid', socket.id);
  send(socket, 'map', map);
  send(socket, 'players', players);

  wss.broadcastOthers(socket, 'info', `Player${socket.id} joined!`);

  socket.on('message', message => {
    const { type, data } = JSON.parse(message);
    switch (type) {
      case 'playerUpdate': {
        players[socket.id] = data;
        wss.broadcastOthers(socket, 'playerUpdate', { id: socket.id, player: data });
        break;
      }
      case 'tileUpdate': {
        const { layer, col, row, type } = data;
        setTile(layer, col, row, type);
        wss.broadcastOthers(socket, 'tileUpdate', data);
        break;
      }
    }
  });

  socket.on('close', () => {
    delete players[socket.id];
    wss.broadcastOthers(socket, 'deletePlayer', socket.id);
    wss.broadcastOthers(socket, 'info', `Player${socket.id} disconnected.`);
  });
});
