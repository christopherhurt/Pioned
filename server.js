import WebSocket from 'ws';
import { messageFormat } from './src/utils';

let index = 0;
const players = {};

const wss = new WebSocket.Server({ port: 5000 });

// Broadcast to all.
wss.broadcast = data => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

// Broadcast to everyone else.
wss.broadcastOthers = (socket, data) => {
  wss.clients.forEach(client => {
    if (client !== socket && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

wss.on('connection', socket => {
  socket.id = index++;
  socket.send(messageFormat('selfid', socket.id));
  socket.send(messageFormat('players', players));

  const info = messageFormat('info', `Player${socket.id} joined!`);
  wss.broadcastOthers(socket, info);

  socket.on('message', message => {
    const { type, data } = JSON.parse(message);
    switch (type) {
      case 'playerUpdate':
        players[socket.id] = data;
        wss.broadcastOthers(socket, messageFormat('playerUpdate', { id: socket.id, player: data }));
        break;
    }
  });

  socket.on('close', () => {
    delete players[socket.id];
    wss.broadcastOthers(socket, messageFormat('deletePlayer', socket.id));
    const info = messageFormat('info', `Player${socket.id} disconnected.`);
    wss.broadcastOthers(socket, info);
  });
});
