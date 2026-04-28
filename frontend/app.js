const socket = io("http://localhost:3000");

let room = "";
let typingTimeout = null;

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
  alert("Successfully joined room: " + room);
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
  room = Math.random().toString(36).substring(2, 8).toUpperCase();
  document.getElementById("roomDisplay").innerText = "Room: " + room;
  console.log("Creating room:", room);
  socket.emit("join-room", room);
}

// JOIN ROOM
function joinRoom() {
  console.log("joinRoom function called!");
  
  let inputElement = document.getElementById("roomInput");
  console.log("Input element:", inputElement);
  
  if (!inputElement) {
    alert("Room input field not found!");
    return;
  }
  
  let inputRoom = inputElement.value;
  console.log("Input value:", inputRoom);
  
  if (!inputRoom || inputRoom.trim() === "") {
    alert("Please enter a Room ID");
    return;
  }
  
  room = inputRoom.trim().toUpperCase();
  console.log("Processed room ID:", room);
  
  let displayElement = document.getElementById("roomDisplay");
  if (displayElement) {
    displayElement.innerText = "Room: " + room;
    console.log("Room display updated");
  }
  
  console.log("Emitting join-room event for room:", room);
  socket.emit("join-room", room);
}

// COPY ROOM ID
function copyRoom() {
  if (!room) {
    alert("No room to copy");
    return;
  }
  
  navigator.clipboard.writeText(room).then(() => {
    // Show success message
    let div = document.createElement("div");
    div.innerText = "📋 Room ID copied!";
    div.style.color = "#10B981";
    div.style.fontWeight = "bold";
    document.getElementById("chat").appendChild(div);
    
    // Remove message after 2 seconds
    setTimeout(() => {
      if (div.parentNode) {
        div.parentNode.removeChild(div);
      }
    }, 2000);
    
  }).catch(err => {
    console.error("Failed to copy room ID:", err);
    alert("Failed to copy room ID");
  });
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

// TYPING FUNCTIONS
function handleTyping() {
  if (!room) return;
  
  const msg = document.getElementById("msg").value;
  
  if (msg.length > 0) {
    socket.emit("typing", room);
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to stop typing after 3 seconds
    typingTimeout = setTimeout(() => {
      socket.emit("stop-typing", room);
    }, 3000);
  } else {
    socket.emit("stop-typing", room);
  }
}

function showTypingIndicator() {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) {
    indicator.style.display = "block";
  }
}

function hideTypingIndicator() {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) {
    indicator.style.display = "none";
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
  socket.emit("stop-typing", room); // Stop typing when message is sent

  document.getElementById("msg").value = "";
}

// RECEIVE MESSAGE
socket.on("chat", (data) => {
  console.log("Received chat message:", data);
  let div = document.createElement("div");
  div.innerText = data;
  div.style.margin = "5px 0";
  div.style.padding = "8px";
  div.style.background = "#27272A";
  div.style.borderRadius = "8px";

  document.getElementById("chat").appendChild(div);
  document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
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

// TYPING EVENTS
socket.on("typing", () => {
  console.log("Someone is typing");
  showTypingIndicator();
});

socket.on("stop-typing", () => {
  console.log("Someone stopped typing");
  hideTypingIndicator();
});

// Add typing event listener to message input
document.addEventListener('DOMContentLoaded', () => {
  const msgInput = document.getElementById("msg");
  if (msgInput) {
    msgInput.addEventListener('input', handleTyping);
  }
});
