class Client {
    constructor(username, socket) {
        this.username = username;
        this.socket = socket;
        this.upstreamTransport = null;
        this.producer = {};
        this.downstreamTransports = [];
        this.room = null;
    }
}

module.exports = Client;