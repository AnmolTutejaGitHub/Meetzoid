const createProducer = (localStream, producerTransport) => {
    return new Promise(async (resolve, reject) => {
        const videoTrack = localStream.getVideoTracks()[0]
        const audioTrack = localStream.getAudioTracks()[0]
        try {
            console.log("Calling produce on video");
            console.log("produce transport", producerTransport);
            const videoProducer = await producerTransport.produce({ track: videoTrack })
            console.log("Calling produce on audio")
            const audioProducer = await producerTransport.produce({ track: audioTrack })
            console.log("finished producing!")
            resolve({ audioProducer, videoProducer })
        } catch (err) {
            console.log(err, "error producing")
        }
    })
}

export default createProducer;