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
require('../database/mongoose');
const User = require('../database/Models/User');


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
let rooms = [];

const initMediaSoup = async () => {
    workers = await createWorkers();
}

initMediaSoup();

app.post('/signups', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const user = new User({ email, password, name });
        await user.save();
        const token = jwt.sign({ user_id: user._id }, `secret`, { expiresIn: '30d' });
        await user.save();
        res.status(200).send({ token });
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
})


io.on('connection', (socket) => {
    let client = null;

    socket.on('join-room', async ({ user, meetingId }, ackCb) => {
        let newRoom = false;
        let roomName = meetingId;
        const usr = await User.findOne({ name: user });
        const userId = usr?._id;
        client = new Client(user, socket, userId);

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


    socket.on('requestTransport', async ({ audioId, type }, ackCb) => {
        let clientTransportParams;
        if (type === "producer") {
            clientTransportParams = await client.addTransport(type);
        }
        else if (type == "consumer") {
            // consumer transport
            const producingClient = client.room.clients.find(c => c?.producer?.audio?.id === audioId);

            const videoId = producingClient?.producer?.video?.id;
            clientTransportParams = await client.addTransport(type, audioId, videoId);
        }
        ackCb(clientTransportParams);
    })


    socket.on('connectTransport', async ({ dtlsParameters, type, audioId }, ackCb) => {
        if (type === "producer") {
            try {
                await client.upstreamTransport.connect({ dtlsParameters });
                ackCb("success");
            } catch (err) {
                console.log(err);
                ackCb("error");
            }
        }
        else if (type === "consumer") {
            try {
                const downstreamTransport = client.downstreamTransports.find(t => {
                    return t.associatedAudioPid === audioId
                })

                downstreamTransport.transport.connect({ dtlsParameters });

                ackCb("success");
            } catch (err) {
                console.log(err);
                ackCb("error");
            }
        }
    })



    socket.on('startProducing', async ({ kind, rtpParameters }, ackCb) => {
        try {
            const newProducer = await client.upstreamTransport.produce({ kind, rtpParameters });
            client.addProducer(kind, newProducer);
            ackCb(newProducer.id);

            ////////
            client.room.roomProducers[socket.id] = client.room.roomProducers[socket.id] || {};
            client.room.roomProducers[socket.id][kind] = newProducer;
            socket.broadcast.to(client.room.roomName).emit('new-producer', {
                producerId: newProducer.id,
                kind,
                peerId: socket.id,
            })
            ////// 
        } catch (err) {
            console.log(err);
            ackCb(err);
        }

        // Placehoder 1 - if this is an audiotrak , then this is a new possible speaker 
        // Placehoder 2 - if the room is populated then let the connected perrs know someone has joined 

    })


    socket.on('consumeMedia', async ({ rtpCapabilities, pid, kind }, ackCb) => {
        console.log("Kind: ", kind, " pid: ", pid);
        try {
            if (!client.room.router.canConsume({ producerId: pid, rtpCapabilities })) {
                ackCb("cannotConsume");
            } else {
                const downstreamTransport = client.downstreamTransports.find(t => {
                    if (kind == "audio") {
                        return t.associatedAudioPid === pid
                    } else if (kind == "video") {
                        return t.associatedVideoPid === pid
                    }
                })

                const newConsumer = await downstreamTransport.transport.consume({
                    producerId: pid,
                    rtpCapabilities,
                    paused: true
                })

                client.addConsumer(kind, newConsumer, downstreamTransport);
                const clientParams = {
                    producerId: pid,
                    id: newConsumer.id,
                    kind: newConsumer.kind,
                    rtpParameters: newConsumer.rtpParameters
                }

                ackCb(clientParams);
                //console.log(clientParams);
            }

        } catch (err) {
            console.log(err);
            ackCb('consumeFailed');
        }
    })

    socket.on('find-corresponding-videopid', async ({ audioId }, cbAck) => {
        const producingClient = client.room.clients.find(c => c?.producer?.audio?.id === audioId);

        const videoId = producingClient?.producer?.video?.id;
        cbAck(videoId);
    })

    socket.on('unpauseConsumer', async ({ pid, kind }, ackCb) => {
        const consumerToResume = client.downstreamTransports.find(t => {
            return t?.[kind].producerId === pid
        })
        await consumerToResume[kind].resume();
        ackCb();
    })

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})