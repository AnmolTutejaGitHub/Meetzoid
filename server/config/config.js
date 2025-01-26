const config = {
    workerSettings: {
        rtcMinPort: 40000,
        rtcMaxPort: 41000,
        logLevel: 'warn',
        logTags: [
            'info',
            'ice',
            'dtls',
            'srtp',
            'rtcp'
        ]
    },
}
module.exports = config;