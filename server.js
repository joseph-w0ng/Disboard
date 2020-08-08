const PORT = process.env.PORT || 3000;

const express = require('express');

const app = express();
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
});