// server.js
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io')

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors())
const port = 8000;
const rooms =[];
// Rooms array example Object
// [
//     {
//         roomId:4942, 
//         peers:{
//             peer1:{
//                 socketId:4942,
//                 userName:"ah"
                
//             },
//             peer2:{
//                 socketId:3248,
//                 userName:"KK"
                
//             }
            
//         }
//     }
// ]


io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join', (data) => {
    const {userName, roomId} = data;
    let roomExists = rooms.find(room => room.roomId === roomId)

    if(roomExists) {
       if(!roomExists.peers.peer1) {
            roomExists.peers.peer1 = {userName: userName, socketId: socket.id};
        }
        else if(!roomExists.peers.peer2) {
            roomExists.peers.peer2 ={userName: userName, socketId: socket.id} 
        }
        else {
            io.emit("room-full",socket.id)
        }
    }
    else if(!roomExists) {
        rooms.push({
            roomId: roomId,
            peers: {
                peer1: { userName, socketId: socket.id },
                peer2: null
            }
        });
    }
    console.log(`Updated rooms: ${JSON.stringify(rooms)}`);

    socket.join(roomId);
    
    const clients = io.sockets.adapter.rooms.get(roomId);
    if (clients.size === 2) {
      // Notify both clients they can start signaling
      const roomInfo = rooms.find(room => room.roomId === roomId);
      if (roomInfo) {
      io.to(roomId).emit('ready' , roomInfo.peers);
      }
    }

  });

  socket.on('signal', (data) => {
    // if ever get error message related to signalling always ensure to check roomId here is valid or not
    if (data.signalData.type) {
      console.log(`Signal type: ${data.signalData.type} from socket ${socket.id}`);
    }

    // Broadcast signaling data to the other client in the room
    socket.to(data.roomId).emit('signal', {
      signalData: data.signalData,
      from: socket.id,
    });
  });

    socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    for (let i = 0; i < rooms.length; i++) {
        const room = rooms[i];

        if (room.peers.peer1?.socketId === socket.id) {
        room.peers.peer1 = null;
        io.to(room.roomId).emit('peer-left', { socketId: socket.id });
        } else if (room.peers.peer2?.socketId === socket.id) {
        room.peers.peer2 = null;
        io.to(room.roomId).emit('peer-left', { socketId: socket.id });
        }

        //removes room if empty
        if (!room.peers.peer1 && !room.peers.peer2) {
        rooms.splice(i, 1);
        i--; // adjust index after removal
        }
        console.log(`Updated rooms: ${JSON.stringify(rooms)}`);
    }
    });

});



app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is online' });
});

server.listen(port, () => {
  console.log(`Signaling server listening on http://localhost:${port}`);
});
