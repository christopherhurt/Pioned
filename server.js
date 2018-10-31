import WebSocket from 'ws';
import { send } from './src/utils';
import { GameMap } from './src/map';
import { createMap } from './src/map-gen';

let index = 0;
const players = {};

const MAP_BASE = 12;
const MAP_ITER = 3;
const MAP_SIZE = MAP_BASE * Math.pow(2, MAP_ITER);
const MAP_LAND_PROB = 0.3;
const MAP_SMOOTHNESS = 5;
const MAP_OBJECTS = { 'tree' : 0.25, 'coastLeft' : 0.1 };

const layers = createMap('land', 'water', MAP_BASE, MAP_LAND_PROB, MAP_ITER, MAP_SMOOTHNESS, MAP_OBJECTS);
const map = new GameMap(MAP_SIZE, MAP_SIZE, 8, 64, layers);

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
      case 'newPlayer': {
        players[socket.id] = data;
        wss.broadcastOthers(socket, 'newPlayer', { id: socket.id, player: data });
        break;
      }
      case 'playerMoved': {
        const { x, y } = data;
        const player = players[socket.id];
        player.x = x;
        player.y = y;
        wss.broadcastOthers(socket, 'playerMoved', { id: socket.id, x, y });
        break;
      }
      case 'tileUpdate': {
        const { layer, col, row, type } = data;
        map.setTile(layer, col, row, type);
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
