
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
app.use(express.json());
const port = 8000;
const serverRooms =[];
const clients = [];

// clients=[{
//   socketId : 4fge45,
//   uName : "ahsan",
//   available : true
// }]

// Rooms array example Object
// [
//     {
//         roomId:4942, 
//         peers:[
//             {
//                 socketId:4942,
//                 userName:"ah"
                
//             },
//            {
//                 socketId:3248,
//                 uName:"KK"
                
//             }
            
//         ]
//     }
// ]


io.on('connection', (socket) => {

  console.log('New client connected:', socket.id);
  
  
  // this socket listens for clients trying to connect to the server and ack-their request to complete the handshake
  socket.on('join-server',(data)=>{
    const {userName} = data;
    console.log("Join ServerRequest from Client",data);
    if(userName){
      const user = {
      socketId : socket.id,
      uName : userName,
      available : true
      }
      clients.push(user)
      console.log("Acknowledgement sent to client for ServerJoin",user);
      socket.emit("ack-join-server",user);
    }
  })



/* 
checks if the room already exists then push the client in the rooms,joined peers and trun availability false 
if the room does not exists create a room push the client that made the room
*/

  socket.on('join-room', (data) => {
    const { user, roomId } = data;
    let roomExists = serverRooms.find(room => room.roomId === roomId);

    if (roomExists) {
      if (toggleClientAvailability(user.socketId)) {
        roomExists.peers.push({
          socketId: user.socketId,
          uName: user.uName
        });
      }
    } else {
      serverRooms.push({
        roomId,
        peers: [{
          socketId: user.socketId,
          uName: user.uName
        }]
      });
      toggleClientAvailability(user.socketId); 
    }
    console.log(`Updated serverRooms: ${JSON.stringify(serverRooms)}`);
    console.log(`Updated client: ${JSON.stringify(clients)}}`);
    socket.join(roomId);

    socket.emit("ack-join-room");
  });

  /*
  recives a call signal from client with payload {from:callerSocketId ,to:calleeSocketId ,callerName} checks if the callee is available 
  if available forwards the request else auto reject
  */ 
// When a user tries to call another user
socket.on('call-user', (data) => {
  console.log(`[CALL-USER] Caller: ${data.from}, Callee: ${data.to}, Caller Name: ${data.callerName}`);

  const calleeSocket = clients.find(client => client.socketId === data.to);

  if (calleeSocket && calleeSocket.available) {
    console.log(`[FORWARD] Forwarding call from ${data.from} to ${data.to}`);
    io.to(data.to).emit('incoming-call', {
      from: data.from,
      to: data.to,
      callerName: data.callerName
    });
  } else {
    console.log(`[REJECTED] Callee not available or not found. Callee Socket ID: ${data.to}`);
    socket.emit('call-response', {
      from: data.to, // the callee (not available)
      to: data.from, // the caller
      status: false
    });
  }
});

// When the callee responds to the call
socket.on('call-response', (data) => {
  console.log(`[CALL-RESPONSE] Callee: ${socket.id} responded to Caller: ${data.to}. Status: ${data.status}`);

  io.to(data.to).emit('call-response', {
    from: socket.id,     // the callee
    to: data.to,         // the caller
    status: data.status
  });
});
  


  socket.on('p2p-signal', (data) => {
    const { signalData, to } = data;

    if (signalData?.type) {
      console.log(`🔁 [P2P SIGNAL] Type: ${signalData.type} | From: ${socket.id} → To: ${to}`);
    } else if (signalData?.candidate) {
      console.log(`❄️ [ICE CANDIDATE] From: ${socket.id} → To: ${to}`);
    } else {
      console.warn(`⚠️ [UNKNOWN SIGNAL]`, signalData);
    }

    // Send signal directly to the intended peer
    io.to(to).emit('p2p-signal', {
      from: socket.id,
      signalData
    });
  });

    socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    updateClients(socket.id);
    updateRooms(socket.id);

    });

});

function updateClients(socketId) {
  const index = clients.findIndex(client => client.socketId === socketId);
  if (index !== -1) {
    clients.splice(index, 1); // removes 1 element at 'index'
  }
}

function toggleClientAvailability(socketId) {
  const client = clients.find(client => client.socketId === socketId);
  if (client) {
    client.available = !client.available;
    return true; // returning true always means the client was found and availaibility was toggled
  } 
  else {
    return false;
  }
}

function updateRooms(socketId) {
  for (let i = 0; i < serverRooms.length; i++) {
    const room = serverRooms[i];

    // Remove the disconnected peer from the room
    room.peers = room.peers.filter(peer => peer.socketId !== socketId);

    // Notify remaining users in the room that a peer left
    io.to(room.roomId).emit('peer-left', { socketId: socketId });

    // If no peers are left in the room, delete the room
    if (room.peers.length === 0) {
      serverRooms.splice(i, 1);
      i--; // Adjust loop index due to removal
    }
  }

  console.log(`Updated serverRooms: ${JSON.stringify(serverRooms)}`);
}



app.post('/get-available-users', (req, res) => {
  const {user} = req.body;
  console.log(user);
try {
    if(clients){
    const available_clients = clients
    .filter(client=> client.available && client.socketId !== user.socketId )
    console.log(available_clients)
    res.status(200).json(available_clients)  
  }
  else{
    res.status(404).send("No Clients Found")
  }
} catch (error) {
    console.error("Error at getUser->",error)
    res.status(500).json({msg: "Unable to get User"})
}

    
});


app.get('/get-rooms', (req, res) => {
  try {
    if(serverRooms) {
      const roomIds = serverRooms.map(room =>room.roomId);
      res.status(200).json(roomIds)
    }
    else res.status(404).send("No Rooms Found")    
  } catch (error) {
    console.error("Error at getRooms->",error)
    res.status(500).json({msg: "Unable to get Rooms"})
  }
})


server.listen(port, () => {
  console.log(`Signaling server listening on http://localhost:${port}`);
});
