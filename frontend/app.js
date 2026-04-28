// SceneSync Premium Co-Watching Platform
const socket = io();

// Global State
let currentRoom = "";
let typingTimeout = null;
let userCount = 0;
let isVideoLoaded = false;

// DOM Elements
const elements = {
  roomDisplay: document.getElementById('roomDisplay'),
  roomInput: document.getElementById('roomInput'),
  urlInput: document.getElementById('urlInput'),
  video: document.getElementById('video'),
  videoPlaceholder: document.getElementById('videoPlaceholder'),
  videoLoader: document.getElementById('videoLoader'),
  chat: document.getElementById('chat'),
  msg: document.getElementById('msg'),
  connectionStatus: document.getElementById('connectionStatus'),
  statusText: document.getElementById('statusText'),
  userCount: document.getElementById('userCount'),
  toastContainer: document.getElementById('toastContainer'),
  typingIndicator: document.getElementById('typingIndicator'),
  typingText: document.getElementById('typingText'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  muteIcon: document.getElementById('muteIcon')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  showLoadingOverlay();
  setupSocketListeners();
  setupKeyboardShortcuts();
  
  // Hide loading overlay after connection
  setTimeout(() => {
    hideLoadingOverlay();
    showToast('Welcome to SceneSync! 🎬', 'info');
  }, 1500);
});

// Socket Listeners
function setupSocketListeners() {
  socket.on('connect', () => {
    console.log('✅ Connected to SceneSync server');
    updateConnectionStatus(true);
    showToast('Connected to server', 'success');
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
    updateConnectionStatus(false);
    showToast('Disconnected from server', 'error');
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error);
    updateConnectionStatus(false);
    showToast('Failed to connect to server', 'error');
    hideLoadingOverlay();
  });

  socket.on('set-url', (url) => {
    loadVideo(url, true);
  });

  socket.on('chat', (msg) => {
    addChatMessage(msg, false);
  });
}

// Room Functions
function createRoom() {
  const room = generateRoomId();
  currentRoom = room;
  
  elements.roomDisplay.textContent = room;
  elements.roomInput.value = '';
  
  socket.emit('join-room', room);
  
  showToast(`Room ${room} created! 🏠`, 'success');
  animateRoomCreation();
}

function joinRoom() {
  const input = elements.roomInput.value.trim().toUpperCase();
  
  if (!input) {
    showToast('Please enter a Room ID', 'error');
    shakeElement(elements.roomInput);
    return;
  }

  currentRoom = input;
  elements.roomDisplay.textContent = input;
  elements.roomInput.value = '';
  
  socket.emit('join-room', input);
  
  showToast(`Joined room ${input} 🎯`, 'success');
  animateRoomJoin();
}

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Video Functions
function setVideoUrl() {
  const url = elements.urlInput.value.trim();
  
  if (!currentRoom) {
    showToast('Please create or join a room first', 'error');
    shakeElement(elements.roomInput);
    return;
  }

  if (!url) {
    showToast('Please enter a video URL', 'error');
    shakeElement(elements.urlInput);
    return;
  }

  // Convert YouTube URL to embed format
  let embedUrl = url;
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
  } else if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
  }

  socket.emit('set-url', { room: currentRoom, url: embedUrl });
  loadVideo(embedUrl, false);
}

function loadVideo(url, isRemote = false) {
  showVideoLoader();
  
  elements.video.src = url;
  elements.video.onload = () => {
    hideVideoLoader();
    elements.videoPlaceholder.classList.add('hidden');
    elements.video.classList.remove('hidden');
    isVideoLoaded = true;
    
    if (!isRemote) {
      showToast('Video loaded successfully! 🎬', 'success');
    }
  };
  
  elements.video.onerror = () => {
    hideVideoLoader();
    showToast('Failed to load video', 'error');
  };
}

function toggleMute() {
  if (elements.video) {
    elements.video.muted = !elements.video.muted;
    elements.muteIcon.textContent = elements.video.muted ? '🔇' : '🔊';
    showToast(elements.video.muted ? 'Video muted' : 'Video unmuted', 'info');
  }
}

// Chat Functions
function sendMsg() {
  const message = elements.msg.value.trim();
  
  if (!currentRoom) {
    showToast('Please create or join a room first', 'error');
    return;
  }

  if (!message) {
    showToast('Please enter a message', 'error');
    shakeElement(elements.msg);
    return;
  }

  socket.emit('chat', { room: currentRoom, msg: message });
  addChatMessage(message, true);
  elements.msg.value = '';
  stopTyping();
}

function addChatMessage(message, isSelf) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${isSelf ? 'self' : 'other'}`;
  messageDiv.textContent = message;
  
  elements.chat.appendChild(messageDiv);
  elements.chat.scrollTop = elements.chat.scrollHeight;
  
  // Animate message entry
  messageDiv.style.opacity = '0';
  messageDiv.style.transform = 'translateY(20px)';
  
  setTimeout(() => {
    messageDiv.style.transition = 'all 0.3s ease';
    messageDiv.style.opacity = '1';
    messageDiv.style.transform = 'translateY(0)';
  }, 10);
}

function handleTyping() {
  if (!currentRoom) return;
  
  const message = elements.msg.value.trim();
  
  if (message.length > 0) {
    startTyping();
  } else {
    stopTyping();
  }
}

function startTyping() {
  if (typingTimeout) return;
  
  // Show typing indicator (this would need backend support)
  typingTimeout = setTimeout(() => {
    stopTyping();
  }, 3000);
}

function stopTyping() {
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }
}

// Utility Functions
function copyRoomId() {
  if (!currentRoom) {
    showToast('No room to copy', 'error');
    return;
  }

  navigator.clipboard.writeText(currentRoom).then(() => {
    showToast(`Room ID ${currentRoom} copied to clipboard! 📋`, 'success');
    animateCopyButton();
  }).catch(() => {
    showToast('Failed to copy room ID', 'error');
  });
}

function shareRoom() {
  if (!currentRoom) {
    showToast('No room to share', 'error');
    return;
  }

  const shareUrl = `${window.location.origin}${window.location.pathname}?room=${currentRoom}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'SceneSync Room',
      text: `Join my SceneSync room: ${currentRoom}`,
      url: shareUrl
    }).then(() => {
      showToast('Room shared successfully! 🔗', 'success');
    }).catch(() => {
      copyShareUrl(shareUrl);
    });
  } else {
    copyShareUrl(shareUrl);
  }
}

function copyShareUrl(url) {
  navigator.clipboard.writeText(url).then(() => {
    showToast('Share link copied to clipboard! 🔗', 'success');
  }).catch(() => {
    showToast('Failed to copy share link', 'error');
  });
}

// UI Functions
function updateConnectionStatus(isConnected) {
  if (isConnected) {
    elements.connectionStatus.classList.add('online');
    elements.statusText.textContent = 'Connected';
  } else {
    elements.connectionStatus.classList.remove('online');
    elements.statusText.textContent = 'Disconnected';
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  elements.toastContainer.appendChild(toast);
  
  // Animate entry
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(100%)';
  
  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Remove after delay
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

function showLoadingOverlay() {
  elements.loadingOverlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
  elements.loadingOverlay.classList.add('hidden');
}

function showVideoLoader() {
  elements.videoLoader.classList.remove('hidden');
}

function hideVideoLoader() {
  elements.videoLoader.classList.add('hidden');
}

// Animation Functions
function shakeElement(element) {
  element.style.animation = 'shake 0.5s ease';
  setTimeout(() => {
    element.style.animation = '';
  }, 500);
}

function animateRoomCreation() {
  elements.roomDisplay.style.animation = 'pulse 0.6s ease';
  setTimeout(() => {
    elements.roomDisplay.style.animation = '';
  }, 600);
}

function animateRoomJoin() {
  elements.roomDisplay.style.animation = 'slideInRight 0.6s ease';
  setTimeout(() => {
    elements.roomDisplay.style.animation = '';
  }, 600);
}

function animateCopyButton() {
  const btn = document.getElementById('copyRoomBtn');
  btn.style.animation = 'buttonPress 0.3s ease';
  setTimeout(() => {
    btn.style.animation = '';
  }, 300);
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to send message
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      sendMsg();
    }
    
    // Escape to clear inputs
    if (e.key === 'Escape') {
      elements.msg.value = '';
      elements.urlInput.value = '';
      elements.roomInput.value = '';
    }
  });
}

// URL parameter handling for auto-join
function handleUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomFromUrl = urlParams.get('room');
  
  if (roomFromUrl) {
    elements.roomInput.value = roomFromUrl.toUpperCase();
    showToast(`Room ${roomFromUrl} detected in URL`, 'info');
    
    // Auto-join after a short delay
    setTimeout(() => {
      joinRoom();
    }, 1000);
  }
}

// Initialize URL params handling
handleUrlParams();

// Add shake animation to CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;
document.head.appendChild(style);

// Error handling
window.addEventListener('error', (event) => {
  console.error('JavaScript error:', event.error);
  showToast('An error occurred. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showToast('A network error occurred. Please check your connection.', 'error');
});

console.log('🎬 SceneSync Premium Platform loaded successfully!');
