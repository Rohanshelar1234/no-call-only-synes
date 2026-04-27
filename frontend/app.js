const socket = io("https://your-backend-url.onrender.com");
let currentRoom = null;
let localStream;
let username = "User";

// Room functions
function createRoom() {
  currentRoom = Math.random().toString(36).substring(2, 8);

  document.getElementById("roomDisplay").innerText = "Room: " + currentRoom;

  socket.emit("join-room", currentRoom);

  console.log("Created room:", currentRoom);
}

function joinRoom() {
  const roomId = document.getElementById("roomInput").value.trim().toUpperCase();
  if (roomId) {
    currentRoom = roomId;
    socket.emit("join-room", roomId);
    document.getElementById("roomDisplay").textContent = `Room: ${roomId}`;
  }
}

function convertToEmbed(url) {
  let id = url.split("v=")[1];
  return "https://www.youtube.com/embed/" + id;
}

// Video functions
function setUrl() {
  if (!currentRoom) {
    alert("First create or join a room!");
    return;
  }

  let url = document.getElementById("urlInput").value;

  url = convertToEmbed(url);

  socket.emit("set-url", { room: currentRoom, url });
  loadVideo(url);
}

function loadVideo(url) {
  const video = document.getElementById("video");
  video.srcObject = null; // Clear any screen share stream
  video.src = url;
  video.play();
}

// Username function
function setName() {
  username = document.getElementById("username").value;
}

// Chat functions
function sendMsg() {
  let msg = document.getElementById("msg").value;

  socket.emit("chat", {
    room: currentRoom,
    msg: username + ": " + msg
  });
}

// Socket listeners
socket.on("state", (state) => {
  if (state.url) {
    loadVideo(state.url);
  }
});

socket.on("set-url", (url) => {
  loadVideo(url);
});

socket.on("chat", (msg) => {
  const chatDiv = document.getElementById("chat");
  const messageElement = document.createElement("div");
  messageElement.textContent = msg;
  chatDiv.appendChild(messageElement);
  chatDiv.scrollTop = chatDiv.scrollHeight;
});

socket.on("user-count", (count) => {
  document.getElementById("users").innerText = "Users: " + count;
});

socket.on("video-state", (data) => {
  let video = document.getElementById("video");

  if (Math.abs(video.currentTime - data.time) > 2) {
    video.currentTime = data.time;
  }

  if (data.paused) {
    video.pause();
  } else {
    video.play();
  }
});

socket.on("start-share", () => {
  document.getElementById("chat").innerHTML += '<div style="background: #1f1f23; margin: 5px; padding: 8px; border-radius: 8px;">A user started sharing their screen</div>';
});

function clearChat() {
  document.getElementById("chat").innerHTML = "";
}

async function startScreenShare() {
  if (!currentRoom) {
    alert("First create or join a room!");
    return;
  }

  try {
    localStream = await navigator.mediaDevices.getDisplayMedia({
      video: true
    });

    const video = document.getElementById("video");
    video.srcObject = localStream;

    socket.emit("start-share", { room: currentRoom });
  } catch (error) {
    console.error("Error starting screen share:", error);
    alert("Failed to start screen share. Please make sure you grant permission.");
  }
}

function sendVideoState() {
  let video = document.getElementById("video");

  socket.emit("video-state", {
    room: currentRoom,
    time: video.currentTime,
    paused: video.paused
  });
}

setInterval(sendVideoState, 2000);
