export class UIManager{
    constructor(uiElements){
        this.localpeerInfo = null
        this.localStream = null
        this.localVideo = uiElements.localVideo;
        this.remoteVideo = uiElements.remoteVideo;
        this.userNameHeading = uiElements.userNameHeading;
        this.remoteUserNameHeading  = uiElements.remoteUserNameHeading ;
        this.roomIdHeading = uiElements.roomIdHeading; 
        // General sections
        this.loginFormSection = uiElements.loginFormSection;
        this.postJoinSection = uiElements.postJoinSection;
        this.userName = uiElements.displayUsername;

        // Room UI
        this.createRoomForm = uiElements.createRoomForm;
        this.joinRoomForm = uiElements.joinRoomForm;
        this.callUserForm = uiElements.callUserForm;
        this.availableRoomsSelect = uiElements.availableRoomsSelect;
        this.availableUsersSelect = uiElements.availableUsersSelect;

        // Conference
        this.conferenceSection = uiElements.conferenceSection;
        this.localVideo = uiElements.localVideo;
        this.remoteVideo = uiElements.remoteVideo;

        // P2P Call
        this.p2pCallSection = uiElements.p2pCallSection;
        this.localVideoP2P = uiElements.localVideoP2P;
        this.remoteVideoP2P = uiElements.remoteVideoP2P;
    
        // flags
        this.flagCreateRoomForm = false;
        this.flagJoinRoomForm = false;
        this.flagCallUserForm = false;

    }

    displayUsername(userName , socketId){
        if(userName && socketId){
            this.userName.textContent = `${userName}#${socketId}`;
        }
    }

    showPostJoinSection(flag){
        this.postJoinSection.style.display = flag ? 'block' : 'none';
    }

    showLoginSection(flag){
        this.loginFormSection.style.display = flag ? 'block' : 'none';
    }

    toggleCreateRoomForm(){
        console.log("toggleCreateRoomForm called",this.flagCreateRoomForm)
        this.flagCreateRoomForm = !this.flagCreateRoomForm;
        
        this.createRoomForm.style.display = this.flagCreateRoomForm ? 'block' : 'none';
    }

    showRoomList(){
        this.flagJoinRoomForm = !this.flagJoinRoomForm;
        this.joinRoomForm.style.display = this.flagJoinRoomForm ? 'block' : 'none';
        return this.flagJoinRoomForm;
    }

    showUsersList(){
        this.flagCallUserForm = !this.flagCallUserForm;
        this.callUserForm.style.display = this.flagCallUserForm ? 'block' : 'none';
        return this.flagCallUserForm;
    }

    showConferenceView(flag) {
        if (flag) {
            this.conferenceSection.style.display = 'block';
            this.conferenceSection.classList.add('conference-grid');
        } else {
            this.conferenceSection.style.display = 'none';
            this.conferenceSection.classList.remove('conference-grid');
        }
    }

    showP2PCallSection(flag){
        this.p2pCallSection.style.display = flag ? 'block' : 'none';
    }


    appendList(type,array){
        console.log(type,array);
        switch(type){
            case 'rooms':
                // will recieve a simlpe array of roomIds
                this.availableRoomsSelect.innerHTML = "";

                const roomPlaceholder = document.createElement('option');
                roomPlaceholder.textContent = '-- Select Room --';
                roomPlaceholder.value = '';
                roomPlaceholder.disabled = true;
                roomPlaceholder.selected = true;
                this.availableRoomsSelect.appendChild(roomPlaceholder);

                array.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                this.availableRoomsSelect.appendChild(option);
                });
            break;

            case 'users':
                // will recieve an array of object of users[{},{},..]
                this.availableUsersSelect.innerHTML = "";

                const placeholder = document.createElement('option');
                placeholder.textContent = '-- Select User --';
                placeholder.value = '';
                placeholder.disabled = true;
                placeholder.selected = true;
                this.availableUsersSelect.appendChild(placeholder);

                array.forEach(user => {
                const option = document.createElement('option');
                option.value = user.socketId;
                option.textContent = `${user.uName}#${user.socketId}`;
                this.availableUsersSelect.appendChild(option);
                });
            break;
            default:
                throw new Error("Invalid Type")
        }
    }

    playRemoteStream(remoteStream){
        this.remoteVideoP2P.srcObject = remoteStream;
    }
}


















    // setLocalPeerinfo(peersInfo){
    //     this.localpeerInfo = peersInfo;
    // }

    // setRemotePeerHeading(username){
    //     if(username) this.remoteUserNameHeading.textContent = username;
    //     else this.remoteUserNameHeading.textContent = "Waiting for Other User..."
    // }

    // setLocalUserHeading(username){
    //     this.userNameHeading.textContent = username;
    // }
    
    // setRoomIdHeading(roomId){
    //     this.roomIdHeading.textContent = roomId;
    // }

    // async getMediaStream(mode){

    // if (this.localVideo && this.localVideo.srcObject) {
    //     const tracks = this.localVideo.srcObject.getTracks();
    //     tracks.forEach(track => {  track.stop() });
    //     this.localVideo.srcObject = null;
    // }
    //     try {
    //         let localStream;

    //         switch(mode){
    //             case 'video_audio':        
    //             localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    //             break;

    //             case 'screen_share':
    //                            console.warn("[ScreenShare] Requesting display media...");
    //             localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    //             break;

    //             case 'audio_only':
    //             localStream = await navigator.mediaDevices.getUserMedia({  audio: true });
    //             break;
    //         }

    //         if (this.localVideo && localStream) {
    //             this.localVideo.srcObject = localStream;
    //         }
    //         return localStream;
    //     } 
    //     catch (error) {
    //         console.error("Error accessing media:", error);
    //         alert("Media access error: " + error.message);
    //         return null;
    //     }        
        
    // }

  

    // clearRemoteVideoEl(){
    //     if (this.remoteVideo.srcObject) {
    //         this.remoteVideo.srcObject.getTracks().forEach(track => track.stop());
    //         this.remoteVideo.srcObject = null;
    //     }
    // }

    // resetRemotePeerInfo(socketId){
    //     if(this.localpeerInfo.peer1.socketId == socketId){
    //         this.localpeerInfo.peer1 = null;
    //     }
    //     else if(this.localpeerInfo.peer2.socketId == socketId){
    //         this.localpeerInfo.peer2 = null;
    //     }
    //     this.setRemotePeerHeading(null)
    // }

    // getlocalUserName(){
    //     return this.userNameHeading.textContent;
    // }

    
