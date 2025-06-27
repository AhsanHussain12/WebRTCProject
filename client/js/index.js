import { Controller } from "./Controller.js";
import { UIManager } from "./UIManager.js";


const serverUrl = "http://localhost:8000"
let selectedRoomId = null;
let selectedUserId = null;

const uiManager = new UIManager({
  // Login & Post Join
  loginFormSection: document.getElementById("loginSection"),
  postJoinSection: document.getElementById("postJoinSection"),
  displayUsername: document.getElementById("displayUsername"),

  // Room/Call Forms
  createRoomForm: document.getElementById("createRoomForm"),
  joinRoomForm: document.getElementById("joinRoomForm"),
  callUserForm: document.getElementById("callUserForm"),
  availableRoomsSelect: document.getElementById("availableRooms"),
  availableUsersSelect: document.getElementById("availableUsers"),

  // Conference View
  conferenceSection: document.getElementById("conferenceSection"),
  localVideo: document.getElementById("localVideo"),
  remoteVideo: document.getElementById("remoteVideo"),

  // P2P Call View
  p2pCallSection: document.getElementById("callSection"),
  localVideoP2P: document.getElementById("localVideoP2P"),
  remoteVideoP2P: document.getElementById("remoteVideoP2P"),
});



const controller = new Controller(uiManager,serverUrl)

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault(); 
  console.log("handleJoin called");

  const userName = document.getElementById("uName").value.trim();
  try {
    controller.emitJoinServer(userName);
  } catch (error) {
    console.error("Error at handleJoin->", error);
  }
});

document.getElementById("createRoomBtn").addEventListener("click",()=>{uiManager.toggleCreateRoomForm()});
document.getElementById("joinRoomBtn").addEventListener("click",()=>{controller.toggleRoomList()});
document.getElementById("callUserBtn").addEventListener("click",()=>{controller.toggleUsersList()});


document.getElementById("submitRoomFormBtn").addEventListener("click",()=>{
  const roomId = document.getElementById("newRoomId").value.trim();
  console.log(roomId)
  if(roomId){
    controller.emitJoinRoom(roomId);
  }
  else{
    alert("Enter a RoomId to Join");
  }
});

document.getElementById("joinRoombtn").addEventListener("click",()=>{
// write the logic here for joining the existing room 
})

document.getElementById("startCallbtn").addEventListener("click",()=>{
  console.log("starting call")
  if(selectedUserId){
    console.log("calling...",selectedUserId)
    controller.startP2PCall(selectedUserId)
  }
  else{
    alert("Select a User to Call")
  }
})

document.getElementById("availableRooms").addEventListener("change",()=>{
    selectedRoomId = document.getElementById("availableRooms").value;
});

document.getElementById("availableUsers").addEventListener("change",(e)=>{
  // selectedUserId= socketId of selected user
    selectedUserId = e.target.value;;
    console.log("selected user",selectedUserId)
});

