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
const activeCalls = new Map();

// Clients array example Object
// clients=[{
//   socketId : 4fge45,
//   uName : "ahsan",
// }]

// Rooms array example Object
// [
//     {
//         roomId:4942, 
//         peers:[
//             {
//                 socketId:4942,
//                 uName:"ah"
                
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
    }
    clients.push(user)
    console.log("Acknowledgement sent to client for ServerJoin",user);
    socket.emit("ack-join-server",user);
    console.log(`🗃️ [SERVER STATE] serverRooms: ${JSON.stringify(serverRooms, null, 2)}`);
    console.log(`👥 [CLIENTS STATE] clients: ${JSON.stringify(clients, null, 2)}`);
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
    roomExists.peers.push({
      socketId: user.socketId,
      uName: user.uName
    });
  } 
  else {
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

  console.log(`[CALL-USER] Caller: ${data.from}, Callee: ${data.to}, Caller Name: ${data.caller.uName}`);
  const calleeId = data.to;

  if (getClientBySocketId(calleeId) && !isClientInCall(calleeId)) {
    console.log(`[FORWARD] Forwarding call from ${data.from} to ${data.to}`);
    io.to(data.to).emit('incoming-call', {
      from: data.from,
      to: data.to,
      caller: data.caller
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

// When the callee responds to the call , server sends full client info of callee as payload
// to -- caller
// from -- callee
socket.on('call-response', (data) => {

  console.log(`[CALL-RESPONSE] Callee: ${data.from} responded to Caller: ${data.to}. Status: ${data.status}`);
  const caller = getClientBySocketId(data.to);
  const callee = getClientBySocketId(data.from);
  
  if(data.status === true){
    if(callee && caller){
      activeCalls.set(data.from, data.to);
      activeCalls.set(data.to, data.from);
    }
  }

  io.to(data.to).emit('call-response', {
    from: socket.id,     // the callee
    to: data.to,         // the caller
    status: data.status,  //accepted and rejected
    peer : callee ? callee : null,
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
  const peerId = activeCalls.get(socket.id); // find the peer of disconnected socket
  if (peerId) {
    console.log(`🔁 [ACTIVE CALL] ${socket.id} was in a call with ${peerId}. Notifying peer...`);
    // Notify the peer
    io.to(peerId).emit('peer-left-call', { from: socket.id });
    // Cleanup from activeCalls map
    activeCalls.delete(socket.id);
    activeCalls.delete(peerId);
    console.log(`🧹 [CLEANUP] Removed ${socket.id} and ${peerId} from activeCalls map.`);
  }
  else {
    // // Remove from rooms
    // updateRooms(socket.id);
    // console.log(`🏠 [UPDATE ROOMS] Removed ${socket.id} from any rooms if present.`);
  }

  // Remove from clients
  updateClients(socket.id);

  console.log(`🗃️ [SERVER STATE] serverRooms: ${JSON.stringify(serverRooms, null, 2)}`);
  console.log(`👥 [CLIENTS STATE] clients: ${JSON.stringify(clients, null, 2)}`);
});

});

function updateClients(socketId) {
  const index = clients.findIndex(client => client.socketId === socketId);
  if (index !== -1) {
    clients.splice(index, 1); // removes 1 element at 'index'
  }
}

function getClientBySocketId(socketId){
  return clients.find(client => client.socketId === socketId);
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
}

function isClientInCall(socketId){
  return activeCalls.has(socketId);
}



app.post('/get-available-users', (req, res) => {
  const {user} = req.body;
  console.log(user);
try {
    if(clients){
    const available_clients = clients
    .filter(client=> !isClientInCall(client.socketId) && client.socketId !== user.socketId )
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
