const morseCode = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....',
    'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.',
    'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
    '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----', ' ': '/'
};

function textToMorse(text) {
    return text.toUpperCase().split('').map(char => morseCode[char] || '').join(' ');
}

function morseToText(morse) {
    const reverseMorseCode = Object.fromEntries(Object.entries(morseCode).map(([key, value]) => [value, key]));
    return morse.split(' ').map(code => reverseMorseCode[code] || '').join('');
}

let localPeerConnection;
let remotePeerConnection;
let dataChannel;

const serverConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // STUN Server
};

function createConnection() {
    localPeerConnection = new RTCPeerConnection(serverConfig);
    dataChannel = localPeerConnection.createDataChannel('morseDataChannel');

    dataChannel.onopen = () => console.log('Data channel opened');
    dataChannel.onmessage = (event) => {
        const decodedMessage = morseToText(event.data);
        document.getElementById('receivedMessage').textContent = decodedMessage;
    };

    localPeerConnection.onicecandidate = event => {
        if (event.candidate) {
            remotePeerConnection.addIceCandidate(event.candidate);
        }
    };

    remotePeerConnection = new RTCPeerConnection(serverConfig);
    remotePeerConnection.onicecandidate = event => {
        if (event.candidate) {
            localPeerConnection.addIceCandidate(event.candidate);
        }
    };

    remotePeerConnection.ondatachannel = event => {
        const receiveChannel = event.channel;
        receiveChannel.onmessage = (event) => {
            const decodedMessage = morseToText(event.data);
            document.getElementById('receivedMessage').textContent = decodedMessage;
        };
    };

    localPeerConnection.createOffer()
        .then(offer => localPeerConnection.setLocalDescription(offer))
        .then(() => remotePeerConnection.setRemoteDescription(localPeerConnection.localDescription))
        .then(() => remotePeerConnection.createAnswer())
        .then(answer => remotePeerConnection.setLocalDescription(answer))
        .then(() => localPeerConnection.setRemoteDescription(remotePeerConnection.localDescription));
}

function sendMessage(message) {
    const morseMessage = textToMorse(message);
    dataChannel.send(morseMessage);
}
