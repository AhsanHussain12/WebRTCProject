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
            callResponse: this.onCallResponseCallback.bind(this),
            peerleftCall :this.onPeerleftCallCallback.bind(this)

            
        });
        this.clientInfo = null;
        this.P2PpeerId = null;
        this.localStream = null;
        this.webRTCConnection = null;
        this.localStream = null;

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
        // this.P2PpeerId = calleeSocketId;
        this.socketManager.emitCallSignal({
            caller: this.clientInfo,
            from : this.clientInfo.socketId,
            to : calleeSocketId
        })
    }
    
    /* 
    client as the callee recieves the incoming-call signal
    toggles the view and sets Local and remote user heading conditionally
    */
    onIncomingCallCallback(data){
        console.log(JSON.stringify(data));
        const requestStatus = confirm(`${data.caller.uName} is calling. Accept?`);
        if(requestStatus){
            this.P2PpeerId = data.from; // caller
            this.initWebRTC(false);
            this.uiManager.showPostJoinSection(false);
            this.uiManager.showP2PCallSection(true);
            this.uiManager.setLocalUserHeading(this.clientInfo.uName);
            this.uiManager.setRemoteUserHeading(data.caller.uName? data.caller.uName : null);
            // start the webrtc connection
        }
        this.socketManager.emitCallResponse({
            to: data.from,
            status: requestStatus,
            from: this.clientInfo.socketId
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
            this.P2PpeerId = data.from; //assigns callee socket id as peer on successfull handshake
            this.initWebRTC(true);
            this.uiManager.setRemoteUserHeading(data.peer ? data.peer.uName : null);
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

    async onP2PSignalCallback(data){

        if(data.signalData.type === 'offer'){
            console.log("📨 Received Offer", data.signalData);
            // client as a callee recieves an offer form the caller
            // set remote description and create answer , then emit answer
            await this.webRTCConnection.RTCsetRemoteDescription(new RTCSessionDescription(data.signalData));
            const answer = await this.webRTCConnection.RTCcreateAnswer();
            this.socketManager.emitP2PSignal({
                to : this.P2PpeerId,
                signalData : answer
            })
            console.log('offer recv and Answer Sent', answer)
        }
        else if(data.signalData.type === 'answer'){
            console.log('Answer recv', data);
            await this.webRTCConnection.RTCsetRemoteDescription(new RTCSessionDescription(data.signalData));
        }
        else if(data.signalData.candidate){
            await this.webRTCConnection.RTCaddIceCandidate(data.signalData);
        }    
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
    and sets the localUser heading
    */ 
    startP2PCall(calleeSocketId){
        console.log("Caller",this.clientInfo.socketId,"Callee",calleeSocketId)
        this.emitCallUser(calleeSocketId)
        this.uiManager.showPostJoinSection(false);
        this.uiManager.showP2PCallSection(true);
        this.uiManager.setLocalUserHeading(this.clientInfo.uName);
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



    async onPeerleftCallCallback(data) {
        if(this.webRTCConnection) {
        console.log('Peer disconnected' , data.from);
        this.webRTCConnection = this.webRTCConnection.RTCcloseConnection();
        }
        alert("Peer Left Call !")
        this.uiManager.clearRemoteVideoElP2P();

        this.uiManager.clearLocalStream(this.localStream);
        this.localStream = null;

        this.uiManager.setRemoteUserHeading(null);
        this.uiManager.showPostJoinSection(true);
        this.uiManager.showP2PCallSection(false);
        
        this.P2PpeerId = null;
        
    }

    async onIceCandidateCallback(candidate){
        this.socketManager.emitP2PSignal({
            to : this.P2PpeerId,
            signalData : candidate
        })
    }


    async initWebRTC(isCaller) {
        console.log("🛰️ initWebRTC called");

        // 1. Create new peer connection with STUN server and callback bindings
        this.webRTCConnection = new WebRTCConnection(
            {
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            },
            this.onIceCandidateCallback.bind(this),
            this.uiManager.playRemoteStream.bind(this.uiManager)
        );

        // 2. Add local media tracks to the connection
        if (!this.localStream) {
            this.localStream = await this.uiManager.getMediaStream();
        }

        this.webRTCConnection.RTCaddTrack(this.localStream);
        console.log(" Local stream tracks added to peer connection");

        // 3. If caller, create and send offer
        if (isCaller) {
            try {
                const offer = await this.webRTCConnection.RTCcreateOffer();
                this.socketManager.emitP2PSignal({
                    to : this.P2PpeerId, 
                    signalData: offer
                });
                console.log(" SDP offer created and sent to peer:", this.P2PpeerId);
            } catch (err) {
                console.error(" Failed to create/send offer:", err);
            }
        } else {
            console.log(" Waiting for SDP offer from caller...");
        }

    }


}

