const socket = io("https://no-call-only-synes.onrender.com");

let room = "";

// Socket connection debugging
socket.on("connect", () => {
  console.log("✅ Connected to backend successfully!");
  console.log("Socket ID:", socket.id);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from backend");
});

socket.on("connect_error", (error) => {
  console.error("❌ Connection error:", error);
});

function createRoom() {
  console.log("Create Room button clicked!");
  
  try {
    // Generate room ID
    room = Math.random().toString(36).substring(2, 8);
    console.log("Generated room ID:", room);
    
    // Update UI
    const roomDisplay = document.getElementById("roomDisplay");
    if (roomDisplay) {
      roomDisplay.innerText = "Room: " + room;
      console.log("UI updated with room ID");
    } else {
      console.error("roomDisplay element not found!");
    }
    
    // Emit to socket
    if (socket && socket.emit) {
      socket.emit("join-room", room);
      console.log("Emitted join-room to server");
    } else {
      console.error("Socket not available!");
    }
    
  } catch (error) {
    console.error("Error in createRoom:", error);
  }
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
