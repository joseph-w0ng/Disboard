
const express = require('express');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const socketEvents = require('./socket-events');

// An object to store connected clients and their data
const connectedClients = {};
var history = [];

// Serve the static files
app.use('/css', express.static(`${__dirname}/css`));
app.use('/js', express.static(`${__dirname}/js`));
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

// Socket.io connection handler
io.on('connection', (socket) => {
  // At this point a client has connected
  for(data in history) {
    socket.emit('drawing', history[data]);
  }

  console.log(history);
  console.log(`A client has connected (id: ${socket.id})`);

  socket.on('drawing', (data) => {
    history.push(data);
    socket.broadcast.emit('drawing', data);
  });

  if (!(socket.id in connectedClients)) {
    connectedClients[socket.id] = {};
  }

  socket.on('disconnect', () => {
    console.log(`Client disconnected (id: ${socket.id})`);
    delete connectedClients[socket.id];
  });
});

// Start the server
const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log(`Listening on port ${port}`);
});