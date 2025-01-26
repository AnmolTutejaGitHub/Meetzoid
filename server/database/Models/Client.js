const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');


const ClientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('please provide valid email');
            }
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 8,
        trim: true,
        validate(value) {
            if (!validator.isStrongPassword(value, {
                minLength: 8,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1
            })) {
                throw new Error("Password must be at least 8 characters long, contain at least one lowercase letter, one uppercase letter, one number, and one symbol.");
            }
        }
    },
    profilePic: {
        type: String
    },
    JoinedDate: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    SocketID: {
        type: String
    },
    upstreamTransport: {
        type: Object, // 
    },
    downstreamTransports: [Object], // transport , associatedvideopid , associatedaudiopid
    producer: {
        type: Object, // object as audio and video
    },
    room: {
        type: String
    }

})

ClientSchema.pre('save', async function (next) {
    const client = this;
    if (client.isModified('password')) {
        client.password = await bcrypt.hash(client.password, 8);
    }
    next();
});


const Client = mongoose.model('Client', ClientSchema);
module.exports = Client;