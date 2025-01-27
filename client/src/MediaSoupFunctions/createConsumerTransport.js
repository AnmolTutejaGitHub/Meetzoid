const createConsumerTransport = (transportParams, device, socket, audioPid) => {
    const consumerTrasport = device.createRecvTransport(transportParams);

    consumerTrasport.on('connectionstatechange', state => {
        console.log("==connectionstatechange===");
        console.log(state);
    })
    consumerTrasport.on('icegatheringstatechange', state => {
        console.log("==icegatheringstatechange===");
        console.log(state);
    })

    consumerTrasport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        console.log("Transport connect event has fired!");
        const connectResp = await socket.emitWithAck('connectTransport', { dtlsParameters, type: "consumer", audioPid });
        console.log(connectResp, "connectResp is back");

        if (connectResp === "success") {
            callback();
        } else {
            errback();
        }
    })
    return consumerTrasport;
}
export default createConsumerTransport;