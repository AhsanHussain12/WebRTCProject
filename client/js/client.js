import { Controller } from './Controller.js';
import { UIManager } from './UIManager.js';

if (performance.getEntriesByType("navigation")[0].type === "reload") {
  window.location.href = "index.html";
}
// Parse user info from the URL
const serverUrl = "http://localhost:8000";
const urlParams = new URLSearchParams(window.location.search);
const clientInfo = {
    userName: urlParams.get('userName'),
    roomId: urlParams.get('roomId'),
    mode : urlParams.get('mode')
}
const uiElements ={
    localVideo : document.getElementById('localVideo'),
    remoteVideo : document.getElementById('remoteVideo'),
    userNameHeading : document.getElementById('userName'),
    remoteUserNameHeading : document.getElementById('remoteUserName'),
    roomIdHeading : document.getElementById('roomId'),
}
const uiManager = new UIManager(uiElements);


(async () => {
    const localStream = await uiManager.getMediaStream(clientInfo.mode);

    new Controller(
        uiManager,
        serverUrl,
        clientInfo,
        localStream
    );
})();