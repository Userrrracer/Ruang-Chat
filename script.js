// DOM elements
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const categoryList = document.getElementById('categoryList');
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const chatMessages = document.getElementById('chatMessages');
const loginPrompt = document.getElementById('loginPrompt');
const onlineCount = document.getElementById('onlineCount');

// Daftar pengguna online
let onlineUsers = [];
let currentChannel = 'emel';

// Function to save user data in localStorage
if (registerForm) {
    registerForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        // Validate inputs
        if (!username || !email || !password) {
            showError('Semua field harus diisi');
            return;
        }

        if (!validateEmail(email)) {
            showError('Format email tidak valid');
            return;
        }

        if (password.length < 6) {
            showError('Password harus minimal 6 karakter');
            return;
        }

        // Get existing users or create empty array
        const users = JSON.parse(localStorage.getItem('users')) || [];

        // Check if user already exists
        const userExists = users.find(user => user.email === email);
        if (userExists) {
            showError('Email sudah terdaftar. Silakan gunakan email lain.');
            return;
        }

        // Add new user
        users.push({
            username,
            email,
            password
        });

        // Save updated users array
        localStorage.setItem('users', JSON.stringify(users));

        showSuccess('Pendaftaran berhasil! Silakan login.');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    });
}

// Function to handle user login
if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        // Validate inputs
        if (!email || !password) {
            showLoginError('Email dan password harus diisi');
            return;
        }

        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];

        // Find user with matching credentials
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Save logged in user info
            localStorage.setItem('currentUser', JSON.stringify({
                username: user.username,
                email: user.email,
                lastSeen: new Date().toISOString()
            }));

            // Add user to online users list
            addOnlineUser(user);

            showLoginSuccess('Login berhasil! Mengarahkan ke forum...');
            setTimeout(() => {
                window.location.href = 'forum.html';
            }, 1500);
        } else {
            showLoginError('Email atau password salah!');
        }
    });
}

// Check auth status and enable/disable chat
function checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (currentUser) {
        // Enable chat input and buttons
        if (chatInput) chatInput.disabled = false;
        if (sendMessageBtn) sendMessageBtn.disabled = false;
        document.querySelectorAll('.emoji-btn').forEach(btn => btn.disabled = false);
        document.querySelector('#fileInput').disabled = false;

        // Hide login prompt
        if (loginPrompt) loginPrompt.style.display = 'none';

        // Add user to online users
        addOnlineUser(currentUser);

        return true;
    } else {
        // Disable chat input and buttons
        if (chatInput) chatInput.disabled = true;
        if (sendMessageBtn) sendMessageBtn.disabled = true;
        document.querySelectorAll('.emoji-btn').forEach(btn => btn.disabled = true);
        document.querySelector('#fileInput').disabled = true;

        // Show login prompt
        if (loginPrompt) loginPrompt.style.display = 'block';

        return false;
    }
}

// Update online users list
function updateOnlineUsers() {
    const usersList = document.getElementById('onlineUsers');
    if (!usersList) return;

    usersList.innerHTML = '';
    onlineUsers.forEach(user => {
        const userItem = document.createElement('li');
        userItem.className = 'list-group-item d-flex align-items-center';
        userItem.innerHTML = `
            <span class="online-indicator"></span>
            ${user.username}
            ${user.isAdmin ? '<span class="badge bg-primary ms-auto">Admin</span>' : ''}
        `;
        usersList.appendChild(userItem);
    });

    // Update online count
    if (onlineCount) {
        onlineCount.textContent = onlineUsers.length;
    }
}

// Add user to online users list
function addOnlineUser(user) {
    if (!onlineUsers.find(u => u.username === user.username)) {
        onlineUsers.push({
            username: user.username,
            isAdmin: user.username === 'Raymondo',
            lastSeen: new Date().toISOString()
        });
        updateOnlineUsers();
    }
}

// Remove user from online users list
function removeOnlineUser(username) {
    onlineUsers = onlineUsers.filter(u => u.username !== username);
    updateOnlineUsers();
}

// Load messages from localStorage
function loadMessages(channel) {
    return JSON.parse(localStorage.getItem(`messages_${channel}`)) || [];
}

// Save messages to localStorage
function saveMessages(channel, messages) {
    localStorage.setItem(`messages_${channel}`, JSON.stringify(messages));
}

// Format time for messages
function formatTime(date) {
    const now = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === now.toDateString()) {
        return messageDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } else {
        return messageDate.toLocaleDateString('id-ID', { 
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Format message text
function formatMessageText(text) {
    // Convert URLs to clickable links
    text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    
    // Convert emojis to larger size
    text = text.replace(/(\p{Emoji})/gu, '<span class="large-emoji">$1</span>');
    
    return text;
}

// Add message to chat
function addMessage(message, isCurrentUser = true) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser && isCurrentUser) return;

    const messageElement = document.createElement('div');
    messageElement.className = `message ${isCurrentUser ? 'user-message' : 'other-message'}`;
    
    const time = new Date();
    const messageId = Date.now().toString();
    messageElement.dataset.messageId = messageId;

    // Format message text
    const formattedText = formatMessageText(message.text);
    
    messageElement.innerHTML = `
        <div class="message-header">
            <strong>${isCurrentUser ? currentUser.username : message.username}</strong>
            <small class="message-time">${formatTime(time)}</small>
        </div>
        <div class="message-content">${formattedText}</div>
        <div class="message-footer">
            ${isCurrentUser ? '<span class="message-status">✓✓</span>' : ''}
            ${isCurrentUser ? `
                <button class="btn-delete-message" onclick="deleteMessage('${messageId}')">
                    <i class="bi bi-trash"></i>
                </button>
            ` : ''}
        </div>
    `;
    
    // Add animation for new messages
    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateY(20px)';
    messageElement.style.transition = 'all 0.3s ease';
    
    requestAnimationFrame(() => {
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateY(0)';
    });

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Save message
    const messages = loadMessages(currentChannel);
    messages.push({
        id: messageId,
        text: message.text,
        username: isCurrentUser ? currentUser.username : message.username,
        timestamp: time.toISOString(),
        isCurrentUser,
        isRead: isCurrentUser
    });
    saveMessages(currentChannel, messages);

    // Update badges
    updateChannelBadges();
}

// Delete message
function deleteMessage(messageId) {
    if (confirm('Apakah Anda yakin ingin menghapus pesan ini?')) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                messageElement.remove();
                
                // Update messages in localStorage
                const messages = loadMessages(currentChannel);
                const messageIndex = messages.findIndex(msg => msg.id === messageId);
                if (messageIndex !== -1) {
                    messages.splice(messageIndex, 1);
                    saveMessages(currentChannel, messages);
                }
            }, 300);
        }
    }
}

// Update channel badges
function updateChannelBadges() {
    const channels = document.querySelectorAll('#channelList .list-group-item');
    channels.forEach(channelItem => {
        const channel = channelItem.getAttribute('data-channel');
        const badge = channelItem.querySelector('.badge');
        
        if (badge) {
            if (channel === currentChannel) {
                // Reset badge for active channel
                badge.textContent = '0';
                badge.classList.remove('bg-danger');
            } else {
                // Count unread messages for other channels
                const messages = loadMessages(channel);
                const unreadCount = messages.filter(msg => !msg.isRead).length;
                badge.textContent = unreadCount;
                
                // Add visual indicator for unread messages
                if (unreadCount > 0) {
                    badge.classList.add('bg-danger');
                } else {
                    badge.classList.remove('bg-danger');
                }
            }
        }
    });
}

// Mark messages as read
function markMessagesAsRead(channel) {
    const messages = loadMessages(channel);
    const updatedMessages = messages.map(msg => ({
        ...msg,
        isRead: true
    }));
    saveMessages(channel, updatedMessages);
    updateChannelBadges();
}

// Handle sending message
if (sendMessageBtn) {
    sendMessageBtn.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (message) {
            addMessage({ text: message }, true);
            chatInput.value = '';
            
            // Play send sound
            const audio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAAGhgBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAYAAAAAAAAABoYPkyeYAAAAAAAAAAAAAAAAAAAA//sQxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQxBYDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQxDIDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
            audio.play();
        }
    });
}

// Handle enter key in chat input
if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessageBtn.click();
        }
    });
}

// Initialize chat
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Load existing messages
    const messages = loadMessages(currentChannel);
    messages.forEach(message => {
        addMessage(message, message.isCurrentUser);
    });

    // Handle channel switching
    const channels = document.querySelectorAll('#channelList .list-group-item');
    channels.forEach(channel => {
        channel.addEventListener('click', () => {
            const channelName = channel.getAttribute('data-channel');
            currentChannel = channelName;
            
            // Update active channel
            channels.forEach(c => c.classList.remove('active'));
            channel.classList.add('active');
            
            // Update channel name display
            document.getElementById('currentChannel').textContent = channelName;
            
            // Clear and load messages for new channel
            chatMessages.innerHTML = '';
            const channelMessages = loadMessages(channelName);
            channelMessages.forEach(message => {
                addMessage(message, message.isCurrentUser);
            });

            // Mark messages as read
            markMessagesAsRead(channelName);
        });
    });

    // Handle emoji buttons
    document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!chatInput.disabled) {
                chatInput.value += btn.textContent;
                chatInput.focus();
            }
        });
    });

    // Handle file upload
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (file) {
                addMessage({ text: `📎 File: ${file.name}` }, true);
                fileInput.value = '';
            }
        });
    }

    // Update badges initially
    updateChannelBadges();
});

// Helper functions
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger mt-3';
    errorDiv.textContent = message;
    
    const form = document.querySelector('form');
    form.insertBefore(errorDiv, form.firstChild);
    
    setTimeout(() => errorDiv.remove(), 3000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success mt-3';
    successDiv.textContent = message;
    
    const form = document.querySelector('form');
    form.insertBefore(successDiv, form.firstChild);
}

function showLoginError(message) {
    showError(message);
}

function showLoginSuccess(message) {
    showSuccess(message);
}
