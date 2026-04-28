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
