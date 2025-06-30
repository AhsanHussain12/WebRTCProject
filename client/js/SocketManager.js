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


        this.onP2PSignal(handlers.p2psignal);
        this.onRoomFull(handlers.roomFull);
        this.onJoinServerACK(handlers.joinServerACK);
        this.onJoinRoomACK(handlers.joinRoomACK);
        this.onIncomingCall(handlers.incomingCall);
        this.onCallResponse(handlers.callResponse);
        this.onPeerLeftCall(handlers.peerleftCall)

    }

    
    // emitters
    joinServer(payload){
        this.socket.emit('join-server', payload);
    }
    joinRoom(payload) {
        this.socket.emit('join-room', payload);
    }
    emitP2PSignal(payload) {
        this.socket.emit('p2p-signal', payload);
    } 
    emitCallSignal(payload){
        this.socket.emit('call-user', payload);
    }
    emitCallResponse(payload){
        this.socket.emit('call-response', payload);
    }



    // listners/subscribers 
    onJoinServerACK(callback){
        this.socket.on('ack-join-server', callback);
    }
    onJoinRoomACK(callback){
        this.socket.on('ack-join-room', callback);
    }
    onReady(callback) {
        this.socket.on('ready', callback);
    }
    onP2PSignal(callback) {
        console.log('onSignal called',callback);
        this.socket.on('p2p-signal', callback);
    }
    onRoomFull(callback) {
        this.socket.on('room-full', callback);
    }
    onIncomingCall(callback) {
        this.socket.on('incoming-call', callback);
    }
    onCallResponse(callback) {
        this.socket.on('call-response', callback);
    }
    onPeerLeftCall(callback) {
        this.socket.on('peer-left-call', callback);
    }
}