export class SocketManager{
    constructor(serverUrl , handlers) {
        this.socket = io(serverUrl);
        this.setupSocketlisteners(handlers);
    }
    // handlers = {ready =}
    setupSocketlisteners(handlers){

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        this.onReady(handlers.ready);
        this.onSignal(handlers.signal);
        this.onPeerLeft(handlers.peerLeft);
        this.onRoomFull(handlers.roomFull);


    }
    
    joinRoom(payload) {
        this.socket.emit('join', payload);
    }
    onReady(callback) {
        this.socket.on('ready', callback);
    }
    onSignal(callback) {
        console.log('onSignal called',callback);
        this.socket.on('signal', callback);
    }
    onRoomFull(callback) {
        this.socket.on('room-full', callback);
    }
    emitSignal(payload) {
        this.socket.emit('signal', payload);
    } 
    onPeerLeft(callback) {
        this.socket.on('peer-left', callback);
    }
}