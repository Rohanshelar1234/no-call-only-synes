const socket = io();

let room = "";

// CREATE ROOM
function createRoom() {
  room = Math.random().toString(36).substring(2, 8);
  document.getElementById("roomDisplay").innerText = "Room: " + room;

  socket.emit("join-room", room);
}

// JOIN ROOM
function joinRoom() {
  const input = document.getElementById("roomInput").value;

  if (!input) {
    alert("Enter Room ID");
    return;
  }

  room = input;
  document.getElementById("roomDisplay").innerText = "Room: " + room;

  socket.emit("join-room", room);
}

// SET VIDEO
function setUrl() {
  if (!room) {
    alert("Join room first");
    return;
  }

  const url = document.getElementById("urlInput").value;

  socket.emit("set-url", { room, url });
}

// RECEIVE VIDEO
socket.on("set-url", (url) => {
  document.getElementById("video").src = url;
});

// CHAT
function sendMsg() {
  const msg = document.getElementById("msg").value;

  socket.emit("chat", { room, msg });
}

socket.on("chat", (msg) => {
  const div = document.createElement("div");
  div.innerText = msg;
  document.getElementById("chat").appendChild(div);
});
