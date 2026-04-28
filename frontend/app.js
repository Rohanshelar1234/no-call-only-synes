const socket = io();

let room = "";

function createRoom() {
  console.log("Create clicked");

  room = Math.random().toString(36).substring(2, 8);

  document.getElementById("roomDisplay").innerText = "Room: " + room;

  socket.emit("join-room", room);
}

function joinRoom() {
  room = document.getElementById("roomInput").value;
  document.getElementById("roomDisplay").innerText = "Room: " + room;
  socket.emit("join-room", room);
}

function setUrl() {
  if (!room) {
    alert("Create or join room first!");
    return;
  }

  let url = document.getElementById("urlInput").value;
  socket.emit("set-url", { room, url });
}

socket.on("set-url", (url) => {
  document.getElementById("video").src = url;
});

function sendMsg() {
  let msg = document.getElementById("msg").value;
  socket.emit("chat", { room, msg });
}

socket.on("chat", (msg) => {
  let div = document.createElement("div");
  div.innerText = msg;
  document.getElementById("chat").appendChild(div);
});
