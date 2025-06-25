import { SocketManager } from "./SocketManager.js";
import { WebRTCConnection } from "./WebRTC.js";

export class Controller {
    constructor(uiManager, serverUrl , userInfo ,localStream){
        this.uiManager = uiManager;
        this.socketManager = new SocketManager(serverUrl, {
            ready: this.onReadyCallback.bind(this),
            signal: this.onSignalCallback.bind(this),
            peerLeft: this.onPeerleftCallback.bind(this),
            roomFull: this.onRoomFullCallback.bind(this)
        });
        this.clientInfo = userInfo;
        this.localStream = localStream;
        this.uiManager.setLocalUserHeading(userInfo.userName);
        this.uiManager.setRoomIdHeading(userInfo.roomId);

        this.socketManager.joinRoom({
            userName: userInfo.userName,
            roomId: userInfo.roomId
        });
    }

    async onReadyCallback( peersInfo) {
        try {
            console.log('Both clients ready');
            this.uiManager.setLocalPeerinfo(peersInfo);
            if (this.peerConnection) {
                this.peerConnection.RTCcloseConnection(this.localStream);
                this.peerConnection = null;
            }
            await this.initWebRTC();
        } catch (error) {
            if(error.name === "NotFoundError"){
                alert("Connect a Media Device and Try Again")
                window.location.href = "index.html";
            }
            console.error('Error in onReadyCallback:', error);
        }



    }

    async onRoomFullCallback(){
        alert(`Room #${this.clientInfo.roomId} is Full , Try some other room`);
        window.location.href = "index.html";
    }

    async onSignalCallback(data) {
        console.log('Signal received', data);
        if(!this.peerConnection)  await this.initWebRTC();
            
        if(data.signalData.type === 'offer'){
            await this.peerConnection.RTCsetRemoteDescription(new RTCSessionDescription(data.signalData));
            const answer = await this.peerConnection.RTCcreateAnswer()
            this.socketManager.emitSignal({
                roomId : this.clientInfo.roomId,
                signalData : answer  
            })
            console.log('offer sent', answer)
        }
        else if(data.signalData.type === 'answer'){
            console.log('Answer sent', data);
            await this.peerConnection.RTCsetRemoteDescription(new RTCSessionDescription(data.signalData));
        }
        else if(data.signalData.candidate){
            await this.peerConnection.RTCaddIceCandidate(data.signalData);
        }
        
    }

    async onPeerleftCallback(data) {
        if(this.peerConnection) {
        console.log('Peer disconnected' , data.socketId);
        this.peerConnection.RTCcloseConnection();
        }
        this.uiManager.clearRemoteVideoEl();
        this.uiManager.resetRemotePeerInfo(data.socketId);
        //window.location.href = "index.html";
    }

    async onIceCandidateCallback(candidate){
        this.socketManager.emitSignal({
            roomId : this.clientInfo.roomId,
            signalData : candidate
        })
    }


    async initWebRTC(){

        console.log("initWebRTC called")
        this.peerConnection = new WebRTCConnection(
            { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }, // config
            this.onIceCandidateCallback.bind(this),
            this.uiManager.playRemoteStream.bind(this.uiManager),
        );

        this.peerConnection.RTCaddTrack(this.localStream);

        // * Only peer1 creates offer upon recieiving 'ready' signal
        // * peer2 will wait for the offer and respond with an answer
        const isCaller = this.uiManager.localpeerInfo.peer1.socketId === this.socketManager.socket.id;
        if(isCaller){
            const offer = await this.peerConnection.RTCcreateOffer();
             this.socketManager.emitSignal({
                 roomId: this.clientInfo.roomId, 
                 signalData: offer 
             })
             console.log("Offer sent")
        }

        const remote = isCaller ? this.uiManager.localpeerInfo.peer2 : this.uiManager.localpeerInfo.peer1;
        if(remote && remote.userName){
            this.uiManager.setRemotePeerHeading(remote.userName);
        }

    }

}