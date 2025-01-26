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
        client = await Client.findOne({ name: user });
        let requestedRoom = await Room.findOne({ name: meetingId });
        if (!requestedRoom) {
            newRoom = true;
            const workerToUse = await getWorker(workers);
            requestedRoom = new Room({ name: meetingId, worker: workerToUse });
        }
    })


    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})