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
  room = document.getElementById("roomInput").value;
  document.getElementById("roomDisplay").innerText = "Room: " + room;
  socket.emit("join-room", room);
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
