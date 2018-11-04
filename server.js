import WebSocket from 'ws';
import { send } from './src/utils';
import { GameMap } from './src/map';
import { findStartingCoordinates, createMap } from './src/map-gen';

let index = 0;
const players = {};

const MAP_BASE = 12;
const MAP_ITER = 3;
const MAP_SIZE = MAP_BASE * Math.pow(2, MAP_ITER);
const MAP_LAND_PROB = 0.3;
const MAP_SMOOTHNESS = 5;
const TILE_SIZE = 16;
const MAP_OBJECTS = {
  'apple_tree_bottom': {
    'rules': {
      'apple_tree_top': [-1, 0], // y, x
    },
    'prob': 0.05,
  },
  'tree_bottom': {
    'rules': {
      'tree_top': [-1, 0], // y, x
    },
    'prob': 0.25,
  },
  'yellow_flower': {
    'prob': 0.1,
  },
  'red_flower': {
    'prob': 0.03,
  },
  'white_flower': {
    'prob': 0.02,
  },
  'stump': {
    'prob': 0.01,
  },
};

const layers = createMap('land', 'water', MAP_BASE, MAP_LAND_PROB, MAP_ITER, MAP_SMOOTHNESS, MAP_OBJECTS);
const map = new GameMap(MAP_SIZE, MAP_SIZE, TILE_SIZE, 64, layers);

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
        const player = data;
        const spawnLoc = findStartingCoordinates(layers[0], MAP_SIZE, 'land');
        const xLoc = spawnLoc['x'];
        const yLoc = spawnLoc['y'];
        
        // TODO: make sure this conversion is correct
        player.x = xLoc * TILE_SIZE + TILE_SIZE / 2 - player.width / 2;
        player.y = yLoc * TILE_SIZE + TILE_SIZE / 2 - player.height / 2;
        
        players[socket.id] = player;
        wss.broadcastOthers(socket, 'newPlayer', { id: socket.id, player: data });
        send(socket, 'startingPos', player);
        break;
      }
      case 'playerMoved': {
        const { id, x, y, dir, moving } = data;
        const player = players[socket.id];
        player.x = x;
        player.y = y;
        player.dir = dir;
        player.moving = moving;
        wss.broadcastOthers(socket, 'playerMoved', { id: socket.id, x, y, dir, moving });
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
