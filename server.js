
const express = require('express');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const { count } = require('console');
const { connected } = require('process');

const { MongoClient } = require("mongodb");
const uri =
  "mongodb+srv://react:hackthiseducation@cluster0.uve7a.mongodb.net/hackthis?retryWrites=true&w=majority";

const setIntervalAsync = (fn, ms) => {
  fn().then(() => {
    setTimeout(() => setIntervalAsync(fn, ms), ms);
  });
};
const guid = () => {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < 6; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result.toUpperCase();
};

// An object to store all rooms and their data
const rooms = {};
// An object to store connected clients and their data
const connectedClients = {};

// Stores previous draw data (Now in rooms as rooms[roomId].history)
// var history = [];
var counter = 0;

// Serve the static files
app.use('/css', express.static(`${__dirname}/css`));
app.use('/js', express.static(`${__dirname}/js`));
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});
app.get('/instructor', (req, res) => {
  res.sendFile(`${__dirname}/instructor.html`);
});

// Socket.io connection handler
io.on('connection', (socket) => {
  // At this point a client has connected
  // for(data in history) {
  //   socket.emit('drawing', history[data]);
  // }

  setTimeout(function drawload() {
    if (!(socket.id in connectedClients)) {
      return;
    }
    let roomId = connectedClients[socket.id];
    let history = rooms[roomId].history;
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

  socket.on('create', (info) => {
    let roomId = guid();
    let assignmentId = info.assignmentId;
    let clientId = socket.id;
    while (roomId in rooms) {
      roomId = guid();
    }
    connectedClients[clientId] = roomId;
    roomInfo = {
      clients: [],
      history: [],
      assignment: assignmentId
    };

    roomInfo.clients.push(clientId);
    socket.join(roomId);

    rooms[roomId] = roomInfo;
    io.to(clientId).emit('roomJoined', {roomId: roomId});
  });

  socket.on('join', (info) => {
    let roomId = info.roomId;
  
    if (!(roomId in rooms)) {
      return;
    }
    // let name = info.name;
    let clientId = socket.id;
    let room = rooms[roomId];
    connectedClients[clientId] = roomId;
    room.clients.push(clientId);

    socket.join(roomId);
    io.to(clientId).emit('roomJoined', {roomId: roomId});
  });

  socket.on('drawing', (data) => {
    let room = rooms[data.roomId];
    let history = room.history;

    if(history.length>6000) {
      history.shift();
    }
    history.push(data);
    socket.to(data.roomId).emit('drawing', data);
  });

  socket.on('clear', (data) => {
    let room = rooms[data.roomId];
    let history = room.history;
    history.length = 0;
    socket.to(data.roomId).emit('clear', {});
  });

  socket.on('resize', (data) => {
    let history = rooms[data.roomId].history;
    for (data in history) {
      socket.emit('drawing', history[data]);
    }
  });

  // if (!(socket.id in connectedClients)) {
  //   connectedClients[socket.id] = {};
  // }

  socket.on('getAssignment', (data) => {
    console.log("getAssignment");
    //console.log(data.userid);
    const client = new MongoClient(uri, { useUnifiedTopology: true });
    async function run() {
      try {
        await client.connect();

        const database = client.db('hackthis');
        const collection = database.collection('assignments');

        const query = { "instructorid":data.userid , "name":data.assignmentid};
        const assignment = await collection.findOne(query);
        //await cursor.forEach(console.dir);
        //var questionsArray = await cursor.toArray();
        //console.log(assignment);
        socket.emit('getAssignmentResponse', {"assignment":assignment});

      } finally {
        await client.close();
      }
    }
    run().catch(console.dir);
  })

  socket.on("addQuestion", (data) => {
    console.log("addQuestion");
    //console.log(data.userid);
    const client = new MongoClient(uri, { useUnifiedTopology: true });
    async function run() {
      try {
        await client.connect();

        const database = client.db('hackthis');
        const collection = database.collection('assignments');

        const query = { "instructorid":data.instructorid, "name":data.assignmentid};
        const update = { $push: {"questions":data.question} };
        
        const cursor = collection.updateOne(
            query,
            update,
            {
              upsert:true,
            }
        , function(err, res) {
          if (err) {
            socket.emit('addQuestionResponse', {"success":false});
            console.log(err.message);
            throw err;
          } else {
            console.log("Update/Upsert successful");
            socket.emit('addQuestionResponse', {"success":true});
          }
        });
        // const cursor = collection.insertOne(query, function(err,res) {
        //   if (err) {
        //     socket.emit('addQuestionResponse', {"success":false});
        //     console.log(err.message);
        //     throw err;
        //   } else {
        //   console.log("1 document inserted");
        //   socket.emit('addQuestionResponse', {"success":true});
        //   }
        // });
      } finally {
        await client.close();
      }
    }
    run().catch(console.dir);
  })

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