import WebSocket from 'ws';
import { send, fillZeros } from './src/utils';
import { GameMap } from './src/map';
import { TILES } from './src/tiles'
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
function spawnTrees(map) {
  const rows = map.rows;
  const cols = map.cols;
  let layer1 = fillZeros(map.cols,map.rows)
  let layer2 = fillZeros(map.cols, map.rows)
  for(let i = 0; i < rows; i++) {
    for(let j = 0; j < cols; j++) {
      if(map.getTile(0,j,i) === TILES['land'] && map.getTile(1,j,i) === 0){
        if(Math.random() < .01) {
          layer1[i][j] = 1
          layer2[i][j] = 1
          map.setTile(1, j, i, TILES['tree_bottom']);
          if (i > 0) {
            map.setTile(2, j, i-1, TILES['tree_top']);
          }
        }
      }
    }
  }
  return {layer1, layer2};
}
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

  setInterval(() => {
    //spawntrees returns 2, 2D arrays containing the layers of the map
    const layers = spawnTrees(map);
    wss.broadcast('spawnTrees', layers);
  }, 60000)

  socket.on('close', () => {
    delete players[socket.id];
    wss.broadcastOthers(socket, 'deletePlayer', socket.id);
    wss.broadcastOthers(socket, 'info', `Player${socket.id} disconnected.`);
  });
});
