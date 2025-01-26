import { useParams } from "react-router-dom";
import { Device } from 'mediasoup-client';
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

function Meeting() {
    const [device, setDevice] = useState(null);
    const { id } = useParams();
    const socket = io("http://localhost:8080", {
        withCredentials: true,
    });

    function setMeeting() {
        setDevice(new Device());
        const joinRoomResp = socket.emitWithAck('join-room', { meetingId: id, user });
    }

    // useEffect(() => {
    //     setMeeting();
    // }, [])


    return (<div></div>)
}
export default Meeting; 