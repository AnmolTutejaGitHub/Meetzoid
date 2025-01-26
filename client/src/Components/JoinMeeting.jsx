import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { Device } from 'mediasoup-client';
import { useContext } from 'react';
import UserContext from '../Context/UserContext';
import { useState } from 'react';

function JoinMeeting() {
    const navigate = useNavigate();
    const { user, setUser } = useContext(UserContext);

    const [device, setDevice] = useState(null);

    function CreateMeeting() {

        const meetingId = uuidv4();
        setDevice(new Device());
        const joinRoomResp = Socket.emitWithAck('join-room', { meetingId, user });
        navigate(`/meeting/${meetingId}`);
    }
    return (<div>
        <button onClick={CreateMeeting}>Create Meeting</button>
    </div>)
}
export default JoinMeeting;