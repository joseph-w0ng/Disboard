const PORT = process.env.PORT || 3000;

const express = require('express');

const app = express();
const server = require('http').createServer(app);
const socket = require('socket.io')(server);

server.listen(PORT, () => {
    console.log('Server started on ' + PORT);
});