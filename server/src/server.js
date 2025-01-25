require('dotenv').config();
const express = require('express');
const http = require('http');
const app = express();
const socketio = require("socket.io");
const mediasoup = require('mediasoup');
const cors = require('cors');

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

io.on('connection', (socket) => {


    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})