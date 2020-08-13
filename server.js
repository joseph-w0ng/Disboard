
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
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
const rooms = {};

// Stores previous draw data
var history = [];
var counter = 0;

// Serve the static files
app.use('/css', express.static(`${__dirname}/css`));
app.use('/js', express.static(`${__dirname}/js`));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    
    next();
});
app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
});

app.post('/checkname', (req, res) => {
    let exists = false;
    for (room in rooms) {
        if(rooms[room].room_name == req.body.name) {exists = true;}
    }
    res.json({result: exists});
});

// Socket.io connection handler
io.on('connection', (socket) => {
    // At this point a client has connected

    if (!(socket.id in connectedClients)) {
        socket.join('general');
        socket.emit('list room options', rooms);
        connectedClients[socket.id] = {};
    }

    console.log(`A client has connected (id: ${socket.id})`);

    socket.on('load', (data) => {
        if (data.roomID && data.username && rooms[data.roomID]) {
            socket.join(data.roomID);
            socket.leave('general');
            socket.emit('join', {
                room_name: rooms[data.roomID].room_name,
                username: data.username
            });
            rooms[data.roomID].clients.push(socket.id);
            connectedClients[socket.id] = data.roomID;
            let roomhistory = rooms[data.roomID].history;

            animatedDraw(roomhistory);
            return;
        }
        animatedDraw(history);
        console.log('No previous session / room:'+data.roomID+' does not exist');
        socket.broadcast.emit('list room options', rooms);
        socket.emit('list room options', rooms);
    });

    socket.on('leave', (data) => {
        rooms[data.roomID].clients.splice(rooms[data.roomID].clients.indexOf(socket.id), 1);
        if(rooms[data.roomID].clients.length == 0) {
            delete(rooms[data.roomID]);
            socket.broadcast.emit('list room options', rooms);
            socket.emit('list room options', rooms);
        }
        connectedClients[socket.id] = {};
        socket.leave(data.roomID);
        socket.join('general');
        animatedDraw(history);
    });

    function animatedDraw(history) {
        setTimeout(function drawload() {
            if (counter >= history.length) {
                counter = 0;
            } else {
                socket.emit('drawing', history[counter]);
                // console.log(history[counter]);
                counter++;
                setTimeout(drawload, 5);
            }
        }, 5);
    }

    socket.on('create', (data) => {
        let roomID = data.roomID;
        socket.leave('general');
        socket.join(data.roomID);
        socket.emit('join', {
            room_name: data.room_name,
            username: data.username
        });
        roomInfo = {
            clients: [],
            history: [],
            room_name: '',
            roomID: roomID
        };
        roomInfo.clients.push(socket.id);
        roomInfo.room_name = data.room_name;
        rooms[roomID] = roomInfo;
        connectedClients[socket.id] = roomID;
        io.emit('list room options', rooms);
    });

    socket.on('drawing', (data) => {
        let room = connectedClients[socket.id];
        if(room && rooms[room]) {
            if (rooms[room].history.length > 6000) {
                rooms[room].history.shift();
            }
            rooms[room].history.push(data);
            socket.to(rooms[room].roomID).emit('drawing', data);
        } else {
            if (history.length > 6000) {
                history.shift();
            }
            history.push(data);
            socket.to('general').emit('drawing', data);
        }
    });

    socket.on('clear', (data) => {
        let room = connectedClients[socket.id];
        clearTimeout();
        if(room && rooms[room]) {
            rooms[room].history.length = 0;
            io.in(rooms[room].roomID).emit('clear');
        } else {
            history.length = 0;
            io.in('general').emit('clear');
        }
    });

    socket.on('resize', (data) => {
        let roomhistory = history;
        let room = connectedClients[socket.id];
        if(room && rooms[room]) {
            roomhistory = rooms[room].history;
        }
        animatedDraw(roomhistory);
    });

    socket.on('disconnect', () => {
        let room = connectedClients[socket.id];
        if (rooms[room]) {
            console.log(rooms[room] == false + ' here');
            rooms[room].clients.splice(rooms[room].clients.indexOf(socket.id), 1);
            setTimeout(function() {
                if(rooms[room] && rooms[room].clients.length == 0) {
                    delete(rooms[room]);
                    io.emit('list room options', rooms);
                }}, 3000);
        }
        console.log(`Client disconnected (id: ${socket.id})`);
        delete connectedClients[socket.id];
    });
});

// Start the server
const port = process.env.PORT || 3000;
http.listen(port, () => {
    console.log(`Listening on port ${port}`);
});