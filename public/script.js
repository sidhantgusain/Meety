const socket = io('/');
const videogrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');

myVideo.muted = true;
const peer = new Peer()
var currentPeer=[];
var peers = [];
var myID = "";
myVideo.muted = true;
var myvideoStream;

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,

}).then(stream => {
    addVideoStream(myVideo, stream);
    myvideoStream = stream;


    peer.on('call', call => {
        call.answer(stream);
        const video = document.createElement('video');

        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
            currentPeer = call.peerConnection;
        });
    });

    socket.on('user-connected', (userId) => {
        connectToNewUser(userId, stream);
    });
    socket.emit("participants");

});

socket.on("user-disconnected", (userId) => {
    peers[userId].close();
});


peer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id, USERNAME);
    myID = id;
})


const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
    videogrid.append(video);
}


const connectToNewUser = (userId, stream) => {
    const call = peer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
    });


    call.on("close", () => {
        video.remove();
    });

    peers[userId] = call;
}




const msg = document.getElementById("chat_message");
const btn = document.getElementById("send-btn");
const lists = document.querySelector(".messages");

const sendMessage = (message) => {
    if (message) socket.emit("message", stripHTML(message));
    msg.value = "";
    msg.focus();
};

msg.addEventListener("keypress", (e) => {
    if (e.key == "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(msg.value);
    }
});
btn.addEventListener("click", (e) => {
    e.preventDefault();
    sendMessage(msg.value);
});

socket.on("message", (message, userId, username) => {
    const container = document.querySelector(".main__chat_window");
    const list = document.createElement("li");
    list.className = userId === myID ? "message-right" : "message-left";
    list.innerHTML = `
        ${userId !== myID ? "<div class='message__avatar'>" + username.charAt(0) + "</div>" : "You"}
        <div class="message__content">
            ${userId !== myID ? "<span>" + username + "</span>" : ""}
            <div class="message__text"><span>${message}<span></div>
        </div>`;

    lists.append(list);
    scrollTobottom()
});

const scrollTobottom = () => {
    let d = $('main_chat_window');
    d.scrollTop(d.prop('scrollHeight'));
}

socket.on("participants", (users) => {
    const lists = document.getElementById("users");
    lists.innerHTML = "";
    lists.textContent = "";

    users.forEach((user) => {
        const list = document.createElement("li");
        list.className = "user";
        list.innerHTML = `
        <div class="user__avatar">${user.name[0].toUpperCase()}</div>
        <span class="user__name">${user.name}${user.id == myID ? " (You)" : ""}</span>`;

        lists.append(list);
    });
});

document.querySelector('.mic_icon').addEventListener('click', () => {
    const enabled = myvideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myvideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        setMuteButton();
        myvideoStream.getAudioTracks()[0].enabled = true;
    }
})

document.querySelector('.vid_icon').addEventListener('click', () => {
    console.log('object')
    let enabled = myvideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myvideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo()
    } else {
        setStopVideo()
        myvideoStream.getVideoTracks()[0].enabled = true;
    }
})

const disconnectNow = ()=>{
  window.location.assign("/profile");   
}
const setMuteButton = () => {
    const html = `
    <i class="fas fa-microphone-alt"></i>
  `
    document.querySelector('.mic_icon').innerHTML = html;
    const html1 = `
  <span>Mute</span>`
    document.querySelector('.ms').innerHTML = html1;
}

const setUnmuteButton = () => {
    const html = `
    <i class="fas fa-microphone-alt-slash"></i>
  `
    document.querySelector('.mic_icon').innerHTML = html;

    const html1 = `
  <span>UnMute</span>`
    document.querySelector('.ms').innerHTML = html1;
}

const setStopVideo = () => {
    const html = `
    <i class="fas fa-video"></i>
  `
    document.querySelector('.vid_icon').innerHTML = html;

    const html1 = `
  <span>Stop</span>
  `
    document.querySelector('.vs').innerHTML = html1;
}

const setPlayVideo = () => {
    const html = `
  <i class="stop fas fa-video-slash"></i>
  `
    document.querySelector('.vid_icon').innerHTML = html;

    const html1 = `
  <span>Play</span>
  `
    document.querySelector('.vs').innerHTML = html1;
}

const screenshare = () =>{
    navigator.mediaDevices.getDisplayMedia({ 
        video:{
          cursor:'always'
        },
        audio:{
               echoCancellation:true,
               noiseSupprission:true
        }
   
    }).then((stream) =>{
        let videoTrack = stream.getVideoTracks()[0];
            videoTrack.onended = function(){
              stopScreenShare();
            }
            // for (let x=0;x<currentPeer.length;x++){
              
              let sender = currentPeer[x].getSenders().find(function(s){
                 return s.track.kind == videoTrack.kind;
               })
               
               sender.replaceTrack(videoTrack);
        
      
     })
     
    }
   
   function stopScreenShare(){
     let videoTrack = myVideoStream.getVideoTracks()[0];
    //  for (let x=0;x<currentPeer.length;x++){
             let sender = currentPeer[x].getSenders().find(function(s){
                 return s.track.kind == videoTrack.kind;
               }) 
             sender.replaceTrack(videoTrack);
            
   }

const togglechat = () => {
    if (document.getElementById('chat').style.display === 'flex') {
        document.getElementById('chat').style.display = 'none';
    } else {
        document.getElementById('chat').style.display = 'flex';
    }
}
const toggleparticipants = () => {
    if (document.querySelector('.participant').style.display === 'flex') {
        document.querySelector('.participant').style.display = 'none';


    } else {
        document.querySelector('.participant').style.display = 'flex';

    }
}


const share =() =>{
  var share = document.createElement('input'),
  text = window.location.href;
  
  console.log(text);
  document.body.appendChild(share);
  share.value = text;
  share.select();
  document.execCommand('copy');
  document.body.removeChild(share);
  alert('Copied');
 }
