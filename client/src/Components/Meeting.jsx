import { useParams } from "react-router-dom";
import { Device } from 'mediasoup-client';
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useContext } from "react";
import UserContext from "../Context/UserContext";
import createProducerTransport from "../MediaSoupFunctions/CreateProducerTransport";
import createProducer from "../MediaSoupFunctions/createProducer";
import createConsumer from "../MediaSoupFunctions/createConsumer";

function Meeting() {
    const { user, setUser } = useContext(UserContext);
    const { id } = useParams();
    const socket = io("http://localhost:8080", {
        withCredentials: true,
    });
    const device = useRef(new Device());
    const localStream = useRef(null);
    const producerTransport = useRef(null);
    const audioProducer = useRef(null);
    const videoProducer = useRef(null);
    const [consumers, setConsumers] = useState([]);

    async function setMeeting() {
        const joinRoomResp = await socket.emitWithAck('join-room', { meetingId: id, user });
        //console.log(joinRoomResp);
        if (!device.current.loaded) await device.current.load({ routerRtpCapabilities: joinRoomResp.routerRtpCapabilities });
        await getUserMedia();
        producerTransport.current = await createProducerTransport(socket, device.current);

        const producers = await createProducer(localStream.current, producerTransport.current);
        audioProducer.current = producers.audioProducer;
        videoProducer.current = producers.videoProducer;
    }

    async function getUserMedia() {
        localStream.current = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
        const userVideo = document.getElementById("user-video");
        userVideo.srcObject = localStream.current;
    }

    useEffect(() => {
        // on new-producer
        socket.on('new-producer', async ({ producerId, kind, peerId }) => {
            if (kind === 'audio') {
                const resp = await socket.emitWithAck('requestTransport', {
                    audioId: producerId,
                    type: "consumer",
                    rtpCapabilities: device.rtpCapabilities,
                })
                console.log("consumeRes", resp);

                const consumerTransport = device.current.createRecvTransport(resp);
                consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                    console.log("Transport connect event has fired!");
                    const transportState = consumerTransport.state;
                    if (transportState === 'connected') {
                        console.log('Transport already connected');
                        callback();
                        return;
                    }

                    const connectResp = await socket.emitWithAck('connectTransport', { dtlsParameters, type: "consumer", audioId: producerId });
                    console.log(connectResp, "connectResp is back");

                    if (connectResp === "success") {
                        callback();
                    } else {
                        errback();
                    }
                })

                const videoId = await socket.emitWithAck('find-corresponding-videopid', {
                    audioId: producerId
                })
                console.log("videoId", videoId);

                const [audioConsumer, videoConsumer] = await Promise.all([
                    createConsumer(consumerTransport, producerId, device.current, socket, 'audio'),
                    createConsumer(consumerTransport, videoId, device.current, socket, 'video')
                ])
                console.log(audioConsumer);
                console.log(videoConsumer);

                // create a mew MediaStream on the cleint with both tracks // add this stream to video element
                const combinedStream = new MediaStream([audioConsumer?.track, videoConsumer?.track]);
                const othersVideoDiv = document.getElementById("others-video");
                const videoElement = document.createElement("video");
                videoElement.style.width = "200px";
                videoElement.style.height = "150px";
                videoElement.autoplay = true;
                videoElement.controls = true;
                videoElement.muted = false;
                videoElement.srcObject = combinedStream;
                othersVideoDiv.appendChild(videoElement);
            }
        })

    }, [])

    useEffect(() => {
        setMeeting();
    }, [])


    return (<div>
        <video id="user-video" style={{ width: '150px', height: '150px' }} autoPlay controls muted></video>
        <div id="others-videos"></div>
    </div>)
}
export default Meeting; 