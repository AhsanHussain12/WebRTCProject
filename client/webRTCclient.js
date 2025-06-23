const socket = io('http://localhost:8000');
const urlParams = new URLSearchParams(window.location.search);

const userName = urlParams.get('userName');
const roomId = urlParams.get('roomId');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
let localStream;
let peerConnection;
const userNameheading = document.getElementById('userName');
const remoteUserNameheading = document.getElementById('remoteUserName');
const roomIdheading = document.getElementById('roomId');

userNameheading.textContent = `User: ${userName}`;
roomIdheading.textContent = `Room ID: ${roomId}`;

let LocalpeerInfo = null;

const config = {
    iceServers: [
    { urls: 'stun:stun.l.google.com:19302' } // public STUN server
    ]
};

// Join room
socket.emit('join', {"userName": userName ,"roomId":roomId});

socket.on('ready', async (peersInfo) => {
    console.log('Both clients ready');
    LocalpeerInfo = peersInfo;
    if (!peerConnection) {
    startWebRTC();
    }
});

socket.on('signal', async (data) => {
    if (!peerConnection) {
    startWebRTC();
    }
    if (data.signalData.type === 'offer') {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signalData));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('signal', { roomId, signalData: peerConnection.localDescription });
    } 
    else if (data.signalData.type === 'answer') {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signalData));
    } 
    else if (data.signalData.candidate) {
    try {
        await peerConnection.addIceCandidate(data.signalData);
    } catch(e) {
        console.error('Error adding ICE candidate', e);
    }
    }
});

socket.on('peer-left', (data) => {
  console.log('Peer disconnected:', data.socketId);

  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (remoteVideo.srcObject) {
    remoteVideo.srcObject.getTracks().forEach(track => track.stop());
    remoteVideo.srcObject = null;
  }

  remoteUserNameheading.textContent = 'Remote: disconnected';
});

async function startWebRTC() {
    peerConnection = new RTCPeerConnection(config);

    // Get local media
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    // Add tracks
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Handle remote stream
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    // Send ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', { roomId, signalData: event.candidate });
        }
    };

    // ✅ Only peer1 creates offer
    const isCaller = LocalpeerInfo.peer1.socketId === socket.id;
    if (isCaller) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('signal', { roomId, signalData: offer });
    }

    // ✅ Show remote username (optional)
    const remote = isCaller ? LocalpeerInfo.peer2 : LocalpeerInfo.peer1;
    if (remote && remote.userName) {
        remoteUserNameheading.textContent = `Remote: ${remote.userName}`;
    }
}

