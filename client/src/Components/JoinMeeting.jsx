import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

function JoinMeeting() {
    const navigate = useNavigate();

    function CreateMeeting() {

        const meetingId = uuidv4();
        navigate(`/meeting/${meetingId}`);
    }
    return (<div>
        <button onClick={CreateMeeting}>Create Meeting</button>
    </div>)
}
export default JoinMeeting;