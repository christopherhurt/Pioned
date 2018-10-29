import WebSocket from 'ws';
import { send } from './src/utils';
import { createMap } from './src/map-gen.js';

let index = 0;
const players = {};

const MAP_BASE = 12;
const MAP_ITER = 3;
const MAP_SIZE = MAP_BASE * Math.pow(2, MAP_ITER);
const MAP_LAND_PROB = 0.3;
const MAP_SMOOTHNESS = 5;
const MAP_OBJECTS = { 'tree' : 0.25, 'coastLeft' : 0.1 };

const map = {
  cols: MAP_SIZE,
  rows: MAP_SIZE,
  tsize: 8, // Tile size
  dsize: 64, // Display size
  layers: createMap('land', 'water', MAP_BASE, MAP_LAND_PROB, MAP_ITER, MAP_SMOOTHNESS, MAP_OBJECTS)
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
