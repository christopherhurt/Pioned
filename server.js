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
const T_SIZE = 16;
const D_SIZE = 64;
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

const COLLIDER_OBJECTS = [
  'tree_bottom', 'apple_tree_bottom', 'stump'
];

const [layers, islands] = createMap('land', 'water', MAP_BASE, MAP_LAND_PROB, MAP_ITER, MAP_SMOOTHNESS, MAP_OBJECTS);
const map = new GameMap(MAP_SIZE, MAP_SIZE, T_SIZE, D_SIZE, layers, islands);

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

  const spawnLoc = findStartingCoordinates(layers, MAP_SIZE, 'land', COLLIDER_OBJECTS);
  send(socket, 'startingPos', spawnLoc);

  wss.broadcastOthers(socket, 'info', `Player${socket.id} joined!`);

  setTimeout(() => {
    const layers = map.spawnTrees(MAP_OBJECTS);
    //make spawnTrees return a 2d array of where to put the trees
    wss.broadcast('spawnTrees', layers);
  }, 5000)

  socket.on('message', message => {
    const { type, data } = JSON.parse(message);
    switch (type) {
      case 'newPlayer': {
        const player = data;
        players[socket.id] = player;
        wss.broadcastOthers(socket, 'newPlayer', { id: socket.id, player: player });
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
