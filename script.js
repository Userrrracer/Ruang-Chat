// DOM elements
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const categoryList = document.getElementById('categoryList');
const postList = document.getElementById('postList');
const newPostBtn = document.getElementById('newPostBtn');

// Random user names for simulation
const randomUsers = ['User123', 'ChatFan', 'ForumLover', 'Diskusi01', 'ToressUser', 'NewUser1', 'NewUser2'];

// Function to save user data in localStorage
if (registerForm) {
    registerForm.addEventListener('submit', function(event) {
        event.preventDefault();
    

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Get existing users or create empty array
        const users = JSON.parse(localStorage.getItem('users')) || [];

        // Check if user already exists
        const userExists = users.find(user => user.email === email);
        if (userExists) {
            alert('Email sudah terdaftar. Silakan gunakan email lain.');
            return;
        }

        // Add new user
        users.push({
            username,
            email,
            password // In a real app, you should hash this password
        });

        // Save updated users array
        localStorage.setItem('users', JSON.stringify(users));

        alert('Pendaftaran berhasil! Silakan login.');
        window.location.href = 'login.html';
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];

        // Find user with matching credentials
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Save logged in user info
            localStorage.setItem('currentUser', JSON.stringify({
                username: user.username,
                email: user.email
            }));

            alert('Login berhasil!');
            window.location.href = 'forum.html';
        } else {
            alert('Email atau password salah!');
        }
    });
}

// Function to check online users
function updateOnlineUsers() {
    const onlineUsers = JSON.parse(localStorage.getItem('onlineUsers')) || [];
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    const userStatus = document.getElementById('userStatus');

    if (userStatus) {
        if (currentUser) {
            userStatus.innerHTML = currentUser.username + ' (Anda)';
        } else {
            userStatus.innerHTML = 'Tidak ada pengguna online';
        }

    }
}


function checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // If on forum page and not logged in, redirect to login
    if (window.location.pathname.includes('forum.html') && !currentUser) {
        alert('Silakan login terlebih dahulu.');
        window.location.href = 'login.html';
        return false;
    }

    // Hide login/register links if user is logged in
    if (currentUser) {
        const loginLinks = document.querySelectorAll('a[href="login.html"], a[href="register.html"]');
        loginLinks.forEach(link => {
            const parentLi = link.closest('li');
            if (parentLi) {
                parentLi.style.display = 'none';
            }
        });

        // Add logout button if it doesn't exist
        if (!document.getElementById('logoutBtn')) {
            const navPills = document.querySelector('.nav-pills');
            if (navPills) {
                const logoutLi = document.createElement('li');
                logoutLi.className = 'nav-item';
                logoutLi.innerHTML = `<a href="#" id="logoutBtn" class="nav-link active">Logout (${currentUser.username})</a>`;
                navPills.appendChild(logoutLi);

                // Add event listener to logout button
                document.getElementById('logoutBtn').addEventListener('click', function() {
                    localStorage.removeItem('currentUser');
                    window.location.href = 'index.html';
                });
            }
        }

        // Update user profile section
        updateUserProfile(currentUser);
    }

    // Update online users
    updateOnlineUsers();

    return true;
}

// Function to add chat message
function addChatMessage(message, isCurrentUser = true, username = null, isSystem = false, saveToStorage = true) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const messageElement = document.createElement('div');
    const time = formatTime();
    const messageId = Date.now().toString(); // Unique ID for the message
    messageElement.dataset.messageId = messageId;

    if (isSystem) {
        messageElement.className = 'message system-message';
        messageElement.innerHTML = `
            <div class="message-content">${message}</div>
        `;
    } else {
        messageElement.className = `message ${isCurrentUser ? 'user-message' : 'other-message'}`;

        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { username: 'Guest' };
        const displayName = username || (isCurrentUser ? currentUser.username : 'Lain');

        // Only show delete button for user's own messages
        const deleteButton = isCurrentUser ? 
            `<button class="btn-delete-message" data-message-id="${messageId}">
                <i class="bi bi-trash"></i>
             </button>` : '';

        messageElement.innerHTML = `
            <div class="message-header">
                <strong>${displayName}</strong>
                <div class="message-actions">
                    <small>${time}</small>
                    ${deleteButton}
                </div>
            </div>
            <div class="message-content">${message}</div>
        `;

        // Save message to localStorage
        if (saveToStorage && !isSystem) {
            const messages = loadMessages(currentChannel);
            messages.push({
                id: messageId,
                message,
                isCurrentUser,
                username: displayName,
                timestamp: new Date().toISOString(),
                time
            });
            saveMessages(currentChannel, messages);
        }

        // Add event listener for delete button
        setTimeout(() => {
            const deleteBtn = messageElement.querySelector('.btn-delete-message');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function() {
                    deleteMessage(messageId);
                });
            }
        }, 0);
    }

    chatMessages.appendChild(messageElement);

    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to delete a message
function deleteMessage(messageId) {
    // Confirm deletion
    if (confirm('Apakah Anda yakin ingin menghapus pesan ini?')) {
        // Remove from UI
        const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
        if (messageElement) {
            // Fade out effect
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                messageElement.remove();
                
                // Show deletion notification
                const systemMessage = document.createElement('div');
                systemMessage.className = 'message system-message deletion-notification';
                systemMessage.innerHTML = `<div class="message-content">Pesan telah dihapus</div>`;
                
                const chatMessages = document.getElementById('chatMessages');
                if (chatMessages) {
                    chatMessages.appendChild(systemMessage);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    
                    // Remove notification after a delay
                    setTimeout(() => {
                        systemMessage.style.opacity = '0';
                        setTimeout(() => systemMessage.remove(), 500);
                    }, 3000);
                }
            }, 300);
        }
        
        // Remove from localStorage
        const messages = loadMessages(currentChannel);
        const messageIndex = messages.findIndex(msg => msg.id === messageId);
        
        if (messageIndex !== -1) {
            messages.splice(messageIndex, 1);
            saveMessages(currentChannel, messages);
            
            // Update category post counts
            updateCategoryPostCounts();
        }
    }
}

// Function to change channel
function changeChannel(channel) {
    currentChannel = channel;
    const channelNameElement = document.getElementById('currentChannel');
    if (channelNameElement) {
        channelNameElement.textContent = channel.charAt(0).toUpperCase() + channel.slice(1);
    }

    // Clear chat messages
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }

    // Add welcome message
    addChatMessage(`Selamat datang di channel ${channel}!`, false, 'Admin', true, false);

    // Load messages from localStorage
    const messages = loadMessages(channel);

    if (messages.length === 0) {
        // Add welcome message if no messages
        const channelMessages = {
            emel: [
                { user: 'Admin', message: 'Silahkan diskusi apapun di sini!' }
            ],
            sekolah: [
                { user: 'Admin', message: 'Channel untuk diskusi sekolah' }
            ],
            running: [
                { user: 'Admin', message: 'Channel untuk diskusi olahraga' }
            ],
            musik: [
                { user: 'Admin', message: 'Channel untuk diskusi musik' }
            ],
            all: [
                { user: 'Admin', message: 'Channel untuk diskusi all topik' }
            ]
        };

        // Add sample messages and save them
        if (channelMessages[channel]) {
            channelMessages[channel].forEach(msg => {
                addChatMessage(msg.message, false, msg.user, false, true);
            });
        }
    } else {
        // Display saved messages
        messages.forEach(msg => {
            // Make sure we use the message ID if it exists
            const messageElement = document.createElement('div');
            const messageId = msg.id || Date.now().toString();
            messageElement.dataset.messageId = messageId;
            
            addChatMessage(
                msg.message,
                msg.isCurrentUser,
                msg.username,
                false,
                false // Don't save again
            );
        });
    }

    // Update active channel in UI
    const channelItems = document.querySelectorAll('#channelList .list-group-item');
    channelItems.forEach(item => {
        if (item.getAttribute('data-channel') === channel) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update category post counts
    updateCategoryPostCounts();
}

// Update category post counts
function updateCategoryPostCounts() {
    const channelItems = document.querySelectorAll('#channelList .list-group-item');
    const badges = document.querySelectorAll('#channelList .badge');

    channelItems.forEach((item, index) => {
        const channel = item.getAttribute('data-channel');
        const messages = loadMessages(channel);
        if (badges[index]) {
            badges[index].textContent = messages.length;
        }
    });
}

// Handle sending message
function handleSendMessage() {
    const chatInput = document.getElementById('chatInput');
    if (!chatInput) return;

    const message = chatInput.value.trim();
    if (message) {
        // Add user message
        addChatMessage(message, true);

        // Clear input
        chatInput.value = '';

        // Update category post counts
        updateCategoryPostCounts();

        // Simulate response in certain channels
        if (Math.random() > 0.6) {
            setTimeout(() => {
                const channelResponses = {
                    emel: [
                        'Halo! Apa kabar?',
                        'Selamat datang di forum kami!',
                        'Terima kasih atas partisipasinya!'
                    ],
                    sekolah: [
                        'Saya juga sedang belajar!',
                        'Pelajaran apa yang kamu sukai?',
                        'Mau belajar bersama?'
                    ],
                    running: [
                        'Saya suka lari pagi.',
                        'Sudah berapa KM lari minggu ini?',
                        'Olahraga itu menyehatkan!'
                    ],
                    musik: [
                        'Musik apa yang kamu suka?',
                        'Saya suka mendengarkan pop.',
                        'Ada rekomendasi lagu baru?'
                    ],
                    all: [
                        'Halo! Apa kabar?',
                        'Selamat datang di forum kami!',
                        'Terima kasih atas partisipasinya!'
                    ]
                };

                const responses = channelResponses[currentChannel] || channelResponses.emel;
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)];

                addChatMessage(randomResponse, false, randomUser);

                // Update category post counts after response
                updateCategoryPostCounts();
            }, 1000 + Math.random() * 2000);
        }
    }
}

// Function to handle file uploads
function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput && fileInput.files.length > 0) {
        const fileName = fileInput.files[0].name;
        addChatMessage(`Mengunggah file: ${fileName}...`, true);

        // Simulate upload progress
        setTimeout(() => {
            addChatMessage(`File ${fileName} berhasil diunggah!`, false, 'Admin', true);
        }, 1500);

        // Reset file input
        fileInput.value = '';
    }
}

// Event listeners
// Function to handle search
function handleSearch(event) {
    event.preventDefault();
    const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchQuery) return;
    
    // Check if we're on the forum page
    if (window.location.pathname.includes('forum.html')) {
        // Search posts
        const posts = loadPosts();
        const filteredPosts = posts.filter(post => 
            post.title.toLowerCase().includes(searchQuery) || 
            post.content.toLowerCase().includes(searchQuery) ||
            post.author.toLowerCase().includes(searchQuery) ||
            post.category.toLowerCase().includes(searchQuery)
        );
        
        // Clear post list
        const postListElem = document.getElementById('postList');
        if (postListElem) {
            postListElem.innerHTML = '';
            
            if (filteredPosts.length > 0) {
                // Display filtered posts
                filteredPosts.forEach(post => {
                    const postElement = createPostElement(post);
                    postListElem.appendChild(postElement);
                });
            } else {
                // No results found
                postListElem.innerHTML = `
                    <div class="alert alert-info">
                        Tidak ada hasil untuk pencarian "${searchQuery}". 
                        <button class="btn btn-sm btn-outline-primary ms-2" onclick="displayPosts()">Tampilkan Semua</button>
                    </div>
                `;
            }
        }
    } else {
        // Redirect to forum page with search query
        window.location.href = `forum.html?search=${encodeURIComponent(searchQuery)}`;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize posts
    initializePosts();

    // Check auth status
    const isLoggedIn = checkAuth();
    
    // Add search functionality
    const searchForm = document.querySelector('form[role="search"]');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    // Check for search query in URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery && document.getElementById('searchInput')) {
        document.getElementById('searchInput').value = searchQuery;
        // Trigger search after a short delay to allow page to load
        setTimeout(() => handleSearch(new Event('submit')), 500);
    }

    if (isLoggedIn) {
        // Set current username in the UI
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const currentUsername = document.getElementById('currentUsername');
        if (currentUser && currentUsername) {
            currentUsername.textContent = currentUser.username;
        }

        // Display posts
        displayPosts();

        // New post button functionality
        if (newPostBtn) {
            newPostBtn.addEventListener('click', createNewPost);
        }

        // Chat send message button
        const sendMessageBtn = document.getElementById('sendMessageBtn');
        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', handleSendMessage);
        }

        // Chat input enter key
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    handleSendMessage();
                }
            });

            // Focus on chat input when page loads
            chatInput.focus();
        }

        // Channel selection
        const channelItems = document.querySelectorAll('#channelList .list-group-item');
        channelItems.forEach(item => {
            item.addEventListener('click', function() {
                const channel = this.getAttribute('data-channel');
                if (channel) {
                    changeChannel(channel);
                }
            });
        });

        // Emoji buttons
        const emojiButtons = document.querySelectorAll('.emoji-btn');
        emojiButtons.forEach(button => {
            button.addEventListener('click', function() {
                addEmojiToInput(this.textContent);
            });
        });

        // Add event listeners to all comment buttons
        document.querySelectorAll('.comment-btn').forEach(button => {
            button.addEventListener('click', handleCommentClick);
        });

        // Add event listeners to all like buttons
        document.querySelectorAll('.like-btn').forEach(button => {
            button.addEventListener('click', handleLikeClick);
        });

        // Initialize with default channel
        if (document.getElementById('chatMessages')) {
            changeChannel('emel');
        }

        // Toggle user status
        const userStatus = document.getElementById('userStatus');
        if (userStatus) {
            userStatus.addEventListener('click', function() {
                if (this.textContent === 'Online') {
                    this.textContent = 'Away';
                    this.className = 'badge bg-warning';
                } else if (this.textContent === 'Away') {
                    this.textContent = 'Offline';
                    this.className = 'badge bg-secondary';
                } else {
                    this.textContent = 'Online';
                    this.className = 'badge bg-success';
                }
            });
        }

        // Refresh users list
        const refreshUsersBtn = document.getElementById('refreshUsers');
        if (refreshUsersBtn) {
            refreshUsersBtn.addEventListener('click', function() {
                // Simulate refreshing user list
                const usersList = document.getElementById('onlineUsers');
                if (usersList) {
                    // Show loading state
                    this.textContent = 'Menyegarkan...';
                    this.disabled = true;

                    setTimeout(() => {
                        // Add a random user
                        const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)];

                        const newUserItem = document.createElement('li');
                        newUserItem.className = 'list-group-item d-flex align-items-center';
                        newUserItem.innerHTML = `
                            <span class="online-indicator"></span>
                            ${randomUser}
                        `;

                        usersList.appendChild(newUserItem);

                        // Reset button
                        this.textContent = 'Refresh Pengguna';
                        this.disabled = false;

                        // Show success message in chat
                        addChatMessage('Daftar pengguna berhasil diperbarui!', false, 'Admin', true);
                    }, 1000);
                }
            });
        }
    }
});
