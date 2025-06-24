import { Controller } from './Controller.js';


// Parse user info from the URL
const serverUrl = "http://localhost:8000";
const urlParams = new URLSearchParams(window.location.search);
const userInfo = {
    userName: urlParams.get('userName'),
    roomId: urlParams.get('roomId')
}
const uiElements ={
    localVideo : document.getElementById('localVideo'),
    remoteVideo : document.getElementById('remoteVideo'),
    userNameHeading : document.getElementById('userName'),
    remoteUserNameHeading : document.getElementById('remoteUserName'),
    roomIdHeading : document.getElementById('roomId'),
}


// Start the controller with everything it needs
new Controller(
  uiElements,
  serverUrl,
  userInfo
);