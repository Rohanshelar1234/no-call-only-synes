const socket = io();

let room = "";

// Check connection status
socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

// Room join success
socket.on("joined-success", (room) => {
  console.log("Successfully joined room:", room);
});

// User count updates
socket.on("user-count", (count) => {
  console.log("Users in room:", count);
  document.getElementById("users").innerText = "Users: " + count;
});

// Video updates
socket.on("set-video", (url) => {
  console.log("Video URL:", url);
  document.getElementById("video").src = url;
});

// CREATE ROOM
function createRoom() {
  room = Math.random().toString(36).substring(2, 8);
  document.getElementById("roomDisplay").innerText = "Room: " + room;
  socket.emit("join-room", room);
}

// JOIN ROOM
function joinRoom() {
  let inputRoom = document.getElementById("roomInput").value;
  
  if (!inputRoom) {
    alert("Please enter a Room ID");
    return;
  }
  
  room = inputRoom.trim().toUpperCase();
  document.getElementById("roomDisplay").innerText = "Room: " + room;
  socket.emit("join-room", room);
}

// SET VIDEO
function setVideo() {
  let url = document.getElementById("urlInput").value;

  if (!room) {
    alert("Join room first");
    return;
  }

  if (!url) {
    alert("Enter video URL");
    return;
  }

  socket.emit("set-video", { room, url });
}

// PLAY VIDEO
function playVideo() {
  if (!room) {
    alert("Join room first");
    return;
  }
  
  socket.emit("play", room);
  
  // Also play local video
  const video = document.getElementById("video");
  if (video.contentWindow) {
    video.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
  }
}

// PAUSE VIDEO
function pauseVideo() {
  if (!room) {
    alert("Join room first");
    return;
  }
  
  socket.emit("pause", room);
  
  // Also pause local video
  const video = document.getElementById("video");
  if (video.contentWindow) {
    video.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
  }
}

// SCREEN SHARE
async function shareScreen() {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia();
    const video = document.getElementById("video");
    video.srcObject = stream;
    
    // Notify others in room
    socket.emit("screen-share-start", { room });
    
    // Handle when user stops sharing
    stream.getVideoTracks()[0].addEventListener('ended', () => {
      video.srcObject = null;
      socket.emit("screen-share-stop", { room });
    });
    
  } catch (err) {
    console.error("Error sharing screen:", err);
    alert("Screen sharing failed or was cancelled");
  }
}

// SEND MESSAGE
function sendMsg() {
  let msg = document.getElementById("msg").value;

  if (!room) {
    alert("Join room first");
    return;
  }

  socket.emit("chat", { room, msg });

  document.getElementById("msg").value = "";
}

// RECEIVE MESSAGE
socket.on("chat", (data) => {
  let div = document.createElement("div");
  div.innerText = data;

  document.getElementById("chat").appendChild(div);
});

// SCREEN SHARE EVENTS
socket.on("screen-share-start", () => {
  console.log("Someone started sharing screen");
  let div = document.createElement("div");
  div.innerText = "📺 User started sharing screen";
  div.style.color = "#a855f7";
  document.getElementById("chat").appendChild(div);
});

socket.on("screen-share-stop", () => {
  console.log("Someone stopped sharing screen");
  let div = document.createElement("div");
  div.innerText = "📺 User stopped sharing screen";
  div.style.color = "#ec4899";
  document.getElementById("chat").appendChild(div);
});

// PLAY/PAUSE EVENTS
socket.on("play", () => {
  console.log("Received play command");
  const video = document.getElementById("video");
  if (video.contentWindow) {
    video.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
  }
});

socket.on("pause", () => {
  console.log("Received pause command");
  const video = document.getElementById("video");
  if (video.contentWindow) {
    video.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
  }
});
