import dgram from 'dgram';

function padTo4(buf) {
    const pad = (4 - (buf.length % 4)) % 4;
    return Buffer.concat([buf, Buffer.alloc(pad)]);
}

function encodeString(s) {
    return padTo4(Buffer.from(s + '\0', 'utf8'));
}

// Send an OSC message with just an address (no arguments)
// e.g. /eos/chan/5/full
export function sendOscAddress(ip, port, address) {
    const msg = Buffer.concat([
        encodeString(address),
        encodeString(',')   // empty type tag = no arguments
    ]);
    const sock = dgram.createSocket('udp4');
    sock.send(msg, port, ip, () => sock.close());
}
