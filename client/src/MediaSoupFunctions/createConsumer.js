const createConsumer = (consumerTransport, pid, device, socket, kind) => {
    return new Promise(async (reslove, reject) => {
        const consumerParams = await socket.emitWithAck('consumeMedia', { rtpCapabilities: device.rtpCapabilities, pid, kind });
        console.log(consumerParams);

        if (consumerParams === "cannotConsume") {
            console.log("cannot consume");
            reslove();
        } else if (consumerParams === "consumeFailed") {
            console.log("consume failed");
            reslove();
        } else {
            const consumer = await consumerTransport.consume(consumerParams);
            console.log("consume () has finished");
            const { track } = consumer
            await socket.emitWithAck('unpauseConsumer', { pid, kind });
            reslove(consumer);
        }
    })
}
export default createConsumer;