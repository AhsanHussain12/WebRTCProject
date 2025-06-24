export class UIManager{
    constructor(uiElements){
        this.localpeerInfo = null
        this.localStream = null
        this.localVideo = uiElements.localVideo;
        this.remoteVideo = uiElements.remoteVideo;
        this.userNameHeading = uiElements.userNameHeading;
        this.remoteUserNameHeading  = uiElements.remoteUserNameHeading ;
        this.roomIdHeading = uiElements.roomIdHeading; 
    }

    setLocalPeerinfo(peersInfo){
        this.localpeerInfo = peersInfo;
    }

    setRemotePeerHeading(username){
        if(username) this.remoteUserNameHeading.textContent = username;
        else this.remoteUserNameHeading.textContent = "Waiting for Other User..."
    }

    setLocalUserHeading(username){
        this.userNameHeading.textContent = username;
    }
    
    setRoomIdHeading(roomId){
        this.roomIdHeading.textContent = roomId;
    }

    async getMediaStream(){
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        this.localVideo.srcObject = localStream;
        return localStream;
    }

    playRemoteStream(remoteStream){
        this.remoteVideo.srcObject = remoteStream;
    }

    clearRemoteVideoEl(){
        if (this.remoteVideo.srcObject) {
            this.remoteVideo.srcObject.getTracks().forEach(track => track.stop());
            this.remoteVideo.srcObject = null;
        }
    }

    resetRemotePeerInfo(socketId){
        if(this.localpeerInfo.peer1.socketId == socketId){
            this.localpeerInfo.peer1 = null;
        }
        else if(this.localpeerInfo.peer2.socketId == socketId){
            this.localpeerInfo.peer2 = null;
        }
        this.setRemotePeerHeading(null)
    }

    getlocalUserName(){
        return this.userNameHeading.textContent;
    }

    
}