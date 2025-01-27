import createConsumerTransport from "./createConsumerTransport";
import createConsumer from "./createConsumer";
const requestTransportToConsume = (consumeData, socket, device, consumers) => {
    consumeData.audioPidsToCreate.forEach(async (audioPid, index) => {
        const videoPid = consumeData.videoPidsToCreate[index];

        const consumerTransportParams = await socket.emitWithAck('requestTransport', {
            type: "consumer",
            audioPid
        })
        console.log(consumerTransportParams);
        const consumerTransport = createConsumerTransport(consumerTransportParams, device, socket, audioPid);
        const [audioConsumer, videoConsumer] = await Promise.all([
            createConsumer(consumerTransport, audioPid, device, socket, 'audio', index),
            createConsumer(consumerTransport, videoPid, device, socket, 'video', index)
        ])
        console.log(audioConsumer);
        console.log(videoConsumer);

        const combinedStream = new MediaStream([audioConsumer?.track, videoConsumer?.track]);
        const remoteVideo = document.getElementById(`remote-video-${index}`);
        remoteVideo.srcObject = combinedStream;
        console.log('Hope this works...');
        consumers[audioPid] = {
            combinedStream,
            userName: consumeData.associatedUserNames[index],
            consumerTransport,
            audioConsumer,
            videoConsumer
        }
    })

}
export default requestTransportToConsume;