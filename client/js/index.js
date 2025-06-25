async function handleJoin(e) {
    e.preventDefault(); // prevent page refresh
    const userName = encodeURIComponent(document.getElementById("uName").value.trim());
    const roomId = encodeURIComponent(document.getElementById("roomId").value.trim());
    const mode = document.getElementById("modeSelect").value;
    console.log(mode)
    try {
        if (userName && roomId) {
        const res = await fetch('http://localhost:8000/health')
        if (res.ok) {    window.location.href = `client.html?userName=${userName}&roomId=${roomId}&mode=${mode}`;}
        else throw new Error('Server is offline');
        }
        else{
            throw new Error("Please enter both User Name and Room ID");
        }
    } catch (error) {
        alert(error.message);
    
    }

}