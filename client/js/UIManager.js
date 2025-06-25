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

    async getMediaStream(mode){

    if (this.localVideo && this.localVideo.srcObject) {
        const tracks = this.localVideo.srcObject.getTracks();
        tracks.forEach(track => {  track.stop() });
        this.localVideo.srcObject = null;
    }
        try {
            let localStream;

            switch(mode){
                case 'video_audio':        
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                break;

                case 'screen_share':
                               console.warn("[ScreenShare] Requesting display media...");
                localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
                break;

                case 'audio_only':
                localStream = await navigator.mediaDevices.getUserMedia({  audio: true });
                break;
            }

            if (this.localVideo && localStream) {
                this.localVideo.srcObject = localStream;
            }
            return localStream;
        } 
        catch (error) {
            console.error("Error accessing media:", error);
            alert("Media access error: " + error.message);
            return null;
        }        
        
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