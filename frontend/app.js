const socket = io("http://localhost:3000");

let room = "";

// join success
socket.on("join-success", (roomId) => {
  room = roomId;
  document.getElementById("roomDisplay").innerText = "Room: " + roomId;
  alert("✅ Joined Room: " + roomId);
});

// ✅ IMPORTANT: normal function (NOT arrow)
function joinRoom() {
  console.log("Join clicked");

  const input = document.getElementById("roomInput").value;

  if (!input) {
    alert("Enter Room ID");
    return;
  }

  const roomId = input.trim().toUpperCase();

  socket.emit("join-room", roomId);
}

// create room
function createRoom() {
  room = Math.random().toString(36).substring(2, 8).toUpperCase();
  document.getElementById("roomDisplay").innerText = "Room: " + room;
  socket.emit("join-room", room);
}

// copy room
function copyRoom() {
  if (!room) {
    alert("No room to copy");
    return;
  }
  
  navigator.clipboard.writeText(room).then(() => {
    alert("📋 Room ID copied!");
  }).catch(err => {
    alert("Failed to copy room ID");
  });
}
