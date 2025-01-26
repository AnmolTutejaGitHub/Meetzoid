require('dotenv').config();
const express = require('express');
const http = require('http');
const app = express();
const socketio = require("socket.io");
const mediasoup = require('mediasoup');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Room = require('../classes/Room');
const Client = require('../classes/Client');


const createWorkers = require('../utilities/createWorkers');
const getWorker = require('../utilities/getWorker');

app.use(cors({
    origin: `http://localhost:5173`,
    credentials: true
}));

app.use(express.json());

const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

const io = socketio(server, {
    cors: {
        origin: `http://localhost:5173`,
        credentials: true
    }
});



let workers = null;
let clients = [];
let rooms = [];

const initMediaSoup = async () => {
    workers = createWorkers();
}

initMediaSoup();


io.on('connection', (socket) => {
    let client = null;
    let newRoom = false;

    socket.on('join-room', async (meetingId, user) => {
        let roomName = meetingId;
        client = clients.find(client => client.username === user && client.socket.id === socket.id);
        if (!client) {
            client = new Client(user, socket);
            clients.push(client);
        }

        let requestedRoom = rooms.find(room => room.roomName === roomName);
        if (!requestedRoom) {
            newRoom = true;
            const workerToUse = await getWorker(workers);
            requestedRoom = new Room(roomName, workerToUse);
            await requestedRoom.createRouter();
            rooms.push(requestedRoom);
        }

        client.room = requestedRoom;
        client.room.addClient(client);
        socket.join(client.room.roomName);

        // PLACEHOLDER .. -> Eventually we will need to get all current producers and sent it to our client to consume.... come back to this !
        ackCb({
            routerRtpCapabilities: client.room.router.rtpCapabilities,
            newRoom
        })
    })


    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})