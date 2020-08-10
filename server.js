<<<<<<< HEAD
const PORT = process.env.PORT || 3000;
=======
>>>>>>> 1b87237c6e57d1cc9336fa05cb71b6ec55faea24

const express = require('express');

const app = express();
<<<<<<< HEAD
const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on("connection", (socket) => {
    console.log("User connected with id " + socket.id);
});

server.listen(PORT, () => {
    console.log('Server started on ' + PORT);
});

server.on('error', (err) => {
    console.error('Server error:', err);
=======
const http = require('http').Server(app);
const io = require('socket.io')(http);

const socketEvents = require('./socket-events');
const { count } = require('console');

const setIntervalAsync = (fn, ms) => {
  fn().then(() => {
    setTimeout(() => setIntervalAsync(fn, ms), ms);
  });
};

// An object to store connected clients and their data
const connectedClients = {};

// Stores previous draw data
var history = [];
var counter = 0;

// Serve the static files
app.use('/css', express.static(`${__dirname}/css`));
app.use('/js', express.static(`${__dirname}/js`));
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

// Socket.io connection handler
io.on('connection', (socket) => {
  // At this point a client has connected
  // for(data in history) {
  //   socket.emit('drawing', history[data]);
  // }

  setTimeout(function drawload() {
    if(counter >= history.length) {
      counter = 0;
    } else {
      socket.emit('drawing', history[counter]);
      // console.log(history[counter]);
      counter++;
      setTimeout(drawload, 5);
    }
  }, 5);

  console.log(`A client has connected (id: ${socket.id})`);

  socket.on('drawing', (data) => {
    if(history.length>6000) {
      history.shift();
    }
    history.push(data);
    socket.broadcast.emit('drawing', data);
  });

  socket.on('clear', (data) => {
    history.length = 0;
    socket.broadcast.emit('clear', {});
  });

  socket.on('resize', (data) => {
    for(data in history) {
      socket.emit('drawing', history[data]);
    }
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
>>>>>>> 1b87237c6e57d1cc9336fa05cb71b6ec55faea24
});