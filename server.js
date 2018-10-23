import WebSocket from 'ws';
import { send } from './src/utils';

let index = 0;
const players = {};

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
  send(socket, 'players', players);

  wss.broadcastOthers(socket, 'info', `Player${socket.id} joined!`);

  socket.on('message', message => {
    const { type, data } = JSON.parse(message);
    switch (type) {
      case 'playerUpdate':
        players[socket.id] = data;
        wss.broadcastOthers(socket, 'playerUpdate', { id: socket.id, player: data });
        break;
    }
  });

  socket.on('close', () => {
    delete players[socket.id];
    wss.broadcastOthers(socket, 'deletePlayer', socket.id);
    wss.broadcastOthers(socket, 'info', `Player${socket.id} disconnected.`);
  });
});
