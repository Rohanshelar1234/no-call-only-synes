// SceneSync - Working Real-time Co-watching App
let room = ""

// Connect to production backend
const socket = io("https://no-call-only-synes.onrender.com")

// DOM Elements
const roomDisplay = document.getElementById("roomDisplay")
const roomInput = document.getElementById("roomInput")
const urlInput = document.getElementById("urlInput")
const video = document.getElementById("video")
const chat = document.getElementById("chat")
const msg = document.getElementById("msg")
const status = document.getElementById("status")

// Socket Events
socket.on("connect", () => {
  console.log("✅ Connected to production server")
  showStatus("Connected to server", "success")
})

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server")
  showStatus("Disconnected from server", "error")
})

socket.on("connect_error", (error) => {
  console.error("❌ Connection error:", error)
  showStatus("Failed to connect to server", "error")
})

socket.on("reconnect", () => {
  console.log("🔄 Reconnected to server")
  showStatus("Reconnected to server", "success")
})

socket.on("reconnect_attempt", (attemptNumber) => {
  console.log(`🔄 Reconnection attempt ${attemptNumber}`)
})

// Room Functions
function createRoom() {
  console.log("Create clicked")
  
  room = Math.random().toString(36).substring(2, 8).toUpperCase()
  
  roomDisplay.innerText = "Room: " + room
  roomInput.value = ""
  
  socket.emit("join-room", room)
  
  showStatus(`Room ${room} created!`, "success")
  console.log("Created room:", room)
}

function joinRoom() {
  const inputRoom = roomInput.value.trim().toUpperCase()
  
  if (!inputRoom) {
    alert("Enter Room ID")
    return
  }
  
  room = inputRoom
  roomDisplay.innerText = "Room: " + room
  roomInput.value = ""
  
  socket.emit("join-room", room)
  
  showStatus(`Joined room ${room}`, "success")
  console.log("Joined room:", room)
}

// Video Functions
function setUrl() {
  if (!room) {
    alert("Join room first")
    return
  }
  
  let url = urlInput.value.trim()
  
  if (!url) {
    alert("Enter video URL")
    return
  }
  
  // Convert YouTube URL to embed format
  if (url.includes("watch?v=")) {
    url = url.replace("watch?v=", "embed/")
  } else if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split("?")[0]
    if (videoId) {
      url = `https://www.youtube.com/embed/${videoId}`
    }
  }
  
  socket.emit("set-url", { room, url })
  
  showStatus("Loading video...", "info")
  console.log("Setting video URL:", url)
}

// Receive video URL from server
socket.on("set-url", (url) => {
  if (url) {
    video.src = url
    showStatus("Video loaded!", "success")
    console.log("Video URL received:", url)
  }
})

// Chat Functions
function sendMsg() {
  const message = msg.value.trim()
  
  if (!room) {
    alert("Join room first")
    return
  }
  
  if (!message) {
    alert("Enter message")
    return
  }
  
  socket.emit("chat", { room, msg: message })
  msg.value = ""
  
  console.log("Sent message:", message)
}

// Receive chat messages
socket.on("chat", (data) => {
  const messageDiv = document.createElement("div")
  messageDiv.className = "chat-message"
  messageDiv.textContent = data.msg || data // Handle both formats
  chat.appendChild(messageDiv)
  chat.scrollTop = chat.scrollHeight
  
  console.log("Received message:", data)
})

// Status Display
function showStatus(message, type) {
  status.textContent = message
  status.className = `status ${type}`
  status.style.display = "block"
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    status.style.display = "none"
  }, 3000)
}

// Keyboard shortcuts
document.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    if (document.activeElement === roomInput) {
      joinRoom()
    } else if (document.activeElement === urlInput) {
      setUrl()
    } else if (document.activeElement === msg) {
      sendMsg()
    }
  }
})

// URL parameter handling for auto-join
const urlParams = new URLSearchParams(window.location.search)
const roomFromUrl = urlParams.get('room')

if (roomFromUrl) {
  roomInput.value = roomFromUrl.toUpperCase()
  showStatus(`Room ${roomFromUrl} detected in URL`, "info")
  setTimeout(() => {
    joinRoom()
  }, 1000)
}

console.log("🎬 SceneSync app loaded successfully!")
