export class WebRTCConnection{
    constructor(config ,onIceCandidate, onRemoteTrack) {
        this.peerConnection = new RTCPeerConnection(config);
        this.onIceCandidate = onIceCandidate; // Callback to handle ICE candidates that uses socket to emit signalling data
        this.onRemoteTrack = onRemoteTrack; // callback to assign remote stream to video element
        this.setupListners();
    }

    setupListners(){
        console.log("setupListners called")
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.onIceCandidate(event.candidate);
            }
        }
        
        this.peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', this.peerConnection.connectionState);
        };
    // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            console.log('Remote stream received', event.streams[0]);
            this.onRemoteTrack(event.streams[0]); // this is a callback ,which refrences the playRemoteStream from UIManager class 
        };
    }

    async RTCcreateOffer() {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        return offer;
    }
    
    async RTCsetRemoteDescription(description) {
        await this.peerConnection.setRemoteDescription(description);
    }

    async RTCcreateAnswer() {
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        return answer;
    }

    async RTCaddIceCandidate(candidate) {
        try {
            await this.peerConnection.addIceCandidate(candidate);
        } catch (e) {
            console.error('Error adding ICE candidate', e);
        }
    }
    
    RTCcloseConnection() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        return null;
        // clearing the localtracks will cause problem in reconnecting as media is captured and passed in controller constructor , hence not clearing the tracks doesnt pose the need to get media again , until completely resets
        // if (localStream) {
        //     localStream.getTracks().forEach(track => track.stop());
        //     localStream = null;
        // }
    }

    RTCaddTrack(localStream) {
        if (localStream) {
            localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, localStream));
        }
    }


}