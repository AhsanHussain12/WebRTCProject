document.getElementById("joinRoom").addEventListener("click", () => {
    // encodes the values to UTF-8 format to make sure that certain characters are recognised proprly
    const userName = encodeURIComponent(document.getElementById("uName").value.trim());
    const roomId = encodeURIComponent(document.getElementById("roomId").value.trim());

    if (userName && roomId) {
        window.location.href = `webRTCclient.html?userName=${userName}&roomId=${roomId}`;
    }
    else {
        alert("Please enter both User Name and Room ID");
        return;
    }
})