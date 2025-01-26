class Room {
    constructor(roomName, workerToUse) {
        this.roomName = roomName;
        this.worker = workerToUse;
        this.router = null;
        this.clients = [];
    }
}

module.exports = Room;