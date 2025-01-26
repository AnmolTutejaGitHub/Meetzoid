require('dotenv').config();
const express = require('express');
const http = require('http');
const app = express();
const socketio = require("socket.io");
const mediasoup = require('mediasoup');
const cors = require('cors');
const Client = require('../database/Models/Client');
const bcrypt = require('bcrypt');
require('../database/mongoose');
const jwt = require('jsonwebtoken');


const createWorkers = require('../utilities/createWorkers');

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


app.post('/login', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const user = await Client.findOne({ email, name });
        if (!user) {
            return res.status(400).send({ error: "Invalid Credentials" });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).send({ error: "Invalid Credentials" });
        }

        const token = jwt.sign({ user_id: user._id }, `tokenSecret`, { expiresIn: '30d' });
        res.status(200).send({ token });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

app.post('/signups', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const user = new Client({ email, password, name });
        await user.save();
        const token = jwt.sign({ user_id: user._id }, `tokenSecret`, { expiresIn: '30d' });
        res.status(200).send({ token });
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
})

app.post('/resetPassword', async (req, res) => {
    try {
        const user = await Client.findOne({ email: req.body.email });
        if (!user) return res.status(400).send({ error: 'Email is not registered with us' });
        user.password = req.body.password;
        await user.save();
        res.status(200).send('success');
    } catch (e) {
        res.status(400).send(e);
    }
})

app.post('/verifytokenAndGetUsername', async (req, res) => {
    const { token } = req.body;

    try {
        const decoded = jwt.verify(token, `tokenSecret`);
        const user = await Client.findById(decoded.user_id);

        if (!user) {
            return res.status(404).send({ error: 'Invalid or expired token' });
        }

        res.status(200).send({ user: user.name });
    } catch (e) {
        res.status(400).send({ error: 'Invalid or expired token' });
    }
});

app.post('/otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: "anmoltutejaserver@gmail.com",
                pass: process.env.NODEMAIL_APP_PASSWORD,
            },
        });

        let mailOptions = {
            from: "anmoltutejaserver@gmail.com",
            to: email,
            subject: 'Your login OTP',
            text: `Your OTP is: ${otp}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(400).send(error);
            }
            res.status(200).send(otp);
        });

    } catch (error) {
        res.status(400).send(error);
    }
});



let workers = null;

const initMediaSoup = async () => {
    workers = createWorkers();
}

initMediaSoup();


io.on('connection', (socket) => {
    let client = null;


    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})