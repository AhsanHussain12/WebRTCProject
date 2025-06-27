import { SocketManager } from "./SocketManager.js";
import { WebRTCConnection } from "./WebRTC.js";

export class Controller {
    constructor(uiManager, serverUrl){
        this.uiManager = uiManager;
        this.socketManager = new SocketManager(serverUrl, {
             p2psignal: this.onP2PSignalCallback.bind(this),
            // peerLeft: this.onPeerleftCallback.bind(this),
            // roomFull: this.onRoomFullCallback.bind(this)
            joinServerACK: this.onJoinServerACKCallback.bind(this),
            joinRoomACK: this.onJoinRoomACKCallback.bind(this),
            incomingCall: this.onIncomingCallCallback.bind(this),
            callResponse: this.onCallResponseCallback.bind(this)


            
        });
        this.clientInfo = null;
        this.P2PpeerId = null;
        this.localStream = null;
        this.peerConnection = null;

    }

    emitJoinRoom(roomId){
        console.log("emitJoinRoom called",roomId)
        this.socketManager.joinRoom({
            user: this.clientInfo,
            roomId: roomId
        });
    }

    // this function emits on socket via socket manager that the client wants to join the server
    emitJoinServer(userName){
        this.socketManager.joinServer({
            userName: userName
        });
    }

    /*
    emits the call-user to server , payload({caller:socketId,callee:socketId}) recieves 
    the callee socket id as parameter
    */
    emitCallUser(calleeSocketId){
        this.P2PpeerId = calleeSocketId;
        this.socketManager.emitCallSignal({
            callerName: this.clientInfo.uName,
            from : this.clientInfo.socketId,
            to : calleeSocketId
        })
    }
    
    // client as the callee
    onIncomingCallCallback(data){
        const requestStatus = confirm(`${data.callerName} is calling. Accept?`);
        if(requestStatus){
            this.P2PpeerId = data.from; // caller
            this.initWebRTC(false);
            // start the webrtc connection
        }
        this.socketManager.emitCallResponse({
            to: data.from,
            status: requestStatus,
            callee: this.clientInfo
        }
        );
    }


    /*client as the caller
        data:{
            to: data.from,
            status: requestStatus,
            callee: this.clientInfo
        }
    */
    onCallResponseCallback(data){
        if(data.status){
            alert("Call Accepted");
            this.P2PpeerId = data.to; // callee
            this.initWebRTC(true);
            // initiate the webrtc connection
        }
        else{
            this.P2PpeerId = null;
            alert("Call Rejected");
            this.uiManager.showPostJoinSection(true);
            this.uiManager.showP2PCallSection(false);
        }
    }



    /* 
    this function recieves the ACK from server and updates the UI by toggling the
    post join section and display the username
    
    */
    onJoinServerACKCallback(user){
        if(user) {
        this.clientInfo = user;
        this.uiManager.showLoginSection(false);
        this.uiManager.showPostJoinSection(true);
        this.uiManager.displayUsername(this.clientInfo.uName,this.clientInfo.socketId);
        }
    }
    /*
    upon recieving ack of joining a room remove the post the Join Section and 
    render conferenceView 
    */
    onJoinRoomACKCallback(){
       this.uiManager.showPostJoinSection(false);
       this.uiManager.showConferenceView(true);
    }

    toggleRoomList(){
        const flag = this.uiManager.showRoomList()
        if(flag){
            this.fetch_display_RoomList();
        }
    }

    toggleUsersList(){
        const flag = this.uiManager.showUsersList()
        if(flag){
            this.fetch_display_UsersList();
        }
    }
    /*
    emits call request to server
    hides the postlogin option and shows the P2P view
    */ 
    startP2PCall(calleeSocketId){
        this.emitCallUser(calleeSocketId)
        this.uiManager.showPostJoinSection(false);
        this.uiManager.showP2PCallSection(true);
    }


    // this functon fetchs the rooms and displays them in UI
    async fetch_display_RoomList() {
        try {
            const res = await fetch("http://localhost:8000/get-rooms", {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (res.status === 200) {
                const rooms = await res.json();
                this.uiManager.appendList("rooms", rooms); 
            } else {
                console.warn("Failed to fetch rooms. Status:", res.status);
            }
        } catch (error) {
            console.error("Error fetching room list:", error);
            alert("Unable to fetch rooms at the moment. Please try again later.");
        }
    }

     // this functon fetchs the available Users and displays them in UI
    async fetch_display_UsersList() {
        try {
            if (this.clientInfo) {
                const res = await fetch("http://localhost:8000/get-available-users", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ user: this.clientInfo }) 
                });

                if (res.status === 200) {
                    const users = await res.json();
                    this.uiManager.appendList("users", users);
                } else {
                    console.warn("Failed to fetch users. Status:", res.status);
                }
            } else {
                console.warn("Client info not set. Cannot fetch users.");
            }
        } catch (error) {
            console.error("Error fetching users list:", error);
            alert("Unable to fetch users. Please try again later.");
        }
    }




 

    // async onRoomFullCallback(){
    //     alert(`Room #${this.clientInfo.roomId} is Full , Try some other room`);
    //     window.location.href = "index.html";
    // }

    async onP2PSignalCallback(data) {
        console.log('Signal received', data);
        if(data.signalData.type === 'offer'){
            await this.peerConnection.RTCsetRemoteDescription(new RTCSessionDescription(data.signalData));
            const answer = await this.peerConnection.RTCcreateAnswer()
            this.socketManager.emitSignal({
                socketId: this.P2PpeerId,
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

    // async onPeerleftCallback(data) {
    //     if(this.peerConnection) {
    //     console.log('Peer disconnected' , data.socketId);
    //     this.peerConnection.RTCcloseConnection();
    //     }
    //     this.uiManager.clearRemoteVideoEl();
    //     this.uiManager.resetRemotePeerInfo(data.socketId);
    //     //window.location.href = "index.html";
    // }

    async onIceCandidateCallback(candidate){
        this.socketManager.emitP2PSignal({
            socketId: this.P2PpeerId,
            signalData : candidate
        })
    }


    async initWebRTC(isCaller) {
        console.log("🛰️ initWebRTC called");

        // 1. Create new peer connection with STUN server and callback bindings
        this.peerConnection = new WebRTCConnection(
            {
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            },
            this.onIceCandidateCallback.bind(this),
            this.uiManager.playRemoteStream.bind(this.uiManager)
        );

        // 2. Add local media tracks to the connection
        if (!this.localStream) {
            console.warn("⚠️ localStream not found. Cannot add tracks.");
            return;
        }

        this.peerConnection.RTCaddTrack(this.localStream);
        console.log("✅ Local stream tracks added to peer connection");

        // 3. If caller, create and send offer
        if (isCaller) {
            try {
                const offer = await this.peerConnection.RTCcreateOffer();
                this.socketManager.emitP2PSignal({
                    socketId: this.P2PpeerId, 
                    signalData: offer
                });
                console.log("📡 SDP offer created and sent to peer:", this.p2pPeerId);
            } catch (err) {
                console.error("❌ Failed to create/send offer:", err);
            }
        } else {
            console.log("👂 Waiting for SDP offer from caller...");
        }



        // if (remotePeer?.userName) {
        //     this.uiManager.setRemotePeerHeading(remotePeer.userName);
        //     console.log("🧑‍💻 Remote peer heading set to:", remotePeer.userName);
        // }
    }


}

