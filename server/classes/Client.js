const config = require('../config/config');
class Client {
    constructor(username, socket, userId) {
        this.username = username;
        this.socket = socket;
        this.upstreamTransport = null;
        this.producer = {};
        this.downstreamTransports = [];
        this.room = null;
        this.userId = userId;
    }

    addTransport(type, audioId, videoId) {
        return new Promise(async (resolve, reject) => {
            const { initialAvailableOutgoingBitrate, maxIncomingBitrate, listenIps } = config.webRtcTransport;
            const transport = await this.room.router.createWebRtcTransport({

                enabledUdp: true,
                enabledTcp: true,
                preferUdp: true,
                listenInfos: listenIps,
                initialAvailableOutgoingBitrate,
            })

            if (maxIncomingBitrate) {
                try {
                    await transport.setMaxIncomingBitrate(maxIncomingBitrate);
                } catch (err) {
                    console.log("error setting bitrate");
                }

            }

            const clientTransportParams = {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters
            }

            if (type === "producer") {
                this.upstreamTransport = transport
            } else if (type === 'consumer') {
                // consumer transport 
                this.downstreamTransports.push(
                    {
                        transport,
                        associatedVideoPid: videoId,
                        associatedAudioPid: audioId,
                    }
                )
            }

            resolve(clientTransportParams)
        })
    }

    addProducer(kind, newProducer) {
        this.producer[kind] = newProducer;
    }

    addConsumer(kind, newConsumer, downstreamTransport) {
        downstreamTransport[kind] = newConsumer
    }
}

module.exports = Client;