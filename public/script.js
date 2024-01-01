const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
})
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}

const startStopVideoButton = document.getElementById('start-stop-video-button');

let isVideoOn = true;

startStopVideoButton.addEventListener('click', () => {
  // Toggle video
  isVideoOn = !isVideoOn;
  myVideo.srcObject.getVideoTracks()[0].enabled = isVideoOn;
});

const startStopAudioButton = document.getElementById('start-stop-audio-button');

let isAudioOn = true;

startStopAudioButton.addEventListener('click', () => {
  // Toggle audio
  isAudioOn = !isAudioOn;
  myVideo.srcObject.getAudioTracks()[0].enabled = isAudioOn;
});

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream)

  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
  })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}

const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = chatInput.value;
  if (message.trim() !== '') {
    // Kirim pesan ke server
    socket.emit('chat-message', message);
    // Bersihkan input
    chatInput.value = '';
  }
});

socket.on('chat-message', (data) => {
  const { user, message } = data;
  const displayedUser = user === socket.id ? 'Kamu' : 'Dia';
  // Tampilkan pesan di layar setelah menerima balikan dari server
  appendMessage(displayedUser, message);
});

function appendMessage(user, message) {
  const messageElement = document.createElement('div');
  messageElement.textContent = `${user}: ${message}`;
  chatMessages.appendChild(messageElement);
}