// DOM elements
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const categoryList = document.getElementById('categoryList');
const postList = document.getElementById('postList');
const newPostBtn = document.getElementById('newPostBtn');

// Random user names for simulation
const randomUsers = ['User123', 'ChatFan', 'ForumLover', 'Diskusi01', 'ToressUser'];

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

// Function to handle user login
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

// Check auth status
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
                    // Mark user as offline before logging out
                    setUserOffline(currentUser.username);
                    localStorage.removeItem('currentUser');
                    window.location.href = 'index.html';
                });
            }
        }

        // Update user profile section
        updateUserProfile(currentUser);
        
        // Mark user as online
        setUserOnline(currentUser.username);
        
        // Set up periodic refresh of messages (to simulate real-time)
        setupChatRefresh();
    }

    return true;
}

// Function to mark user as online
function setUserOnline(username) {
    const onlineUsers = JSON.parse(localStorage.getItem('onlineUsers')) || [];
    if (!onlineUsers.includes(username)) {
        onlineUsers.push(username);
        localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));
    }
}

// Function to mark user as offline
function setUserOffline(username) {
    const onlineUsers = JSON.parse(localStorage.getItem('onlineUsers')) || [];
    const index = onlineUsers.indexOf(username);
    if (index !== -1) {
        onlineUsers.splice(index, 1);
        localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));
    }
}

// Set up periodic refresh of chat messages
function setupChatRefresh() {
    // Check for new messages every 3 seconds
    const chatRefreshInterval = setInterval(() => {
        if (document.getElementById('chatMessages')) {
            refreshChatMessages();
        } else {
            // Clear interval if chat element is not found (user navigated away)
            clearInterval(chatRefreshInterval);
        }
    }, 3000);
}

// Refresh chat messages
function refreshChatMessages() {
    const latestMessages = loadMessages(currentChannel);
    const currentMessages = document.querySelectorAll('#chatMessages .message:not(.system-message)');
    
    // If we have more messages in storage than in UI, refresh the chat
    if (latestMessages.length > currentMessages.length) {
        // Save scroll position
        const chatMessages = document.getElementById('chatMessages');
        const scrollPos = chatMessages.scrollTop;
        const wasAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop <= chatMessages.clientHeight + 50;
        
        // Reload current channel
        changeChannel(currentChannel);
        
        // Restore scroll position or scroll to bottom if user was at bottom
        if (wasAtBottom) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            chatMessages.scrollTop = scrollPos;
        }
    }
}

// Update user profile information
function updateUserProfile(user) {
    const profileSection = document.getElementById('userProfileSection');
    if (!profileSection) return;

    // Get user stats
    const posts = loadPosts();
    const userPosts = posts.filter(post => post.author === user.username);
    const userComments = posts.flatMap(post => 
        post.comments ? post.comments.filter(comment => comment.author === user.username) : []
    );
    const userLikes = posts.flatMap(post => 
        post.likes ? post.likes.filter(like => like.username === user.username) : []
    );

    // Calculate activity statistics
    const lastActive = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Create a random join date (for demo purposes)
    const joinDate = new Date();
    joinDate.setMonth(joinDate.getMonth() - Math.floor(Math.random() * 12));
    const formattedJoinDate = joinDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Generate random reputation points
    const reputationPoints = Math.floor(Math.random() * 100) + userPosts.length * 5 + userComments.length * 2 + userLikes.length;

    // Get user's level based on activity
    const userLevel = getUserLevel(reputationPoints);

    profileSection.innerHTML = `
        <div class="text-center mb-3">
            <div class="avatar-placeholder mb-2">
                <span class="display-4">${user.username.charAt(0).toUpperCase()}</span>
            </div>
            <h4 class="text-dark">${user.username}</h4>
            <span class="badge bg-${getLevelColor(userLevel)}">${userLevel}</span>
        </div>
        <div class="user-stats">
            <div class="list-group">
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>Email</span>
                    <span class="text-primary">${user.email}</span>
                </div>
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>Bergabung Sejak</span>
                    <span>${formattedJoinDate}</span>
                </div>
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>Terakhir Aktif</span>
                    <span>${lastActive}</span>
                </div>
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>Jumlah Diskusi</span>
                    <span class="badge bg-primary">${userPosts.length}</span>
                </div>
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>Jumlah Komentar</span>
                    <span class="badge bg-info">${userComments.length}</span>
                </div>
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>Jumlah Suka Diberikan</span>
                    <span class="badge bg-success">${userLikes.length}</span>
                </div>
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>Poin Reputasi</span>
                    <span class="badge bg-warning text-dark">${reputationPoints}</span>
                </div>
            </div>
        </div>
        <div class="mt-3">
            <button class="btn btn-sm btn-outline-primary w-100" id="editProfileBtn">Edit Profil</button>
        </div>
    `;

    // Add event listener to edit profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            editUserProfile(user);
        });
    }

    // Add CSS for avatar placeholder
    const style = document.createElement('style');
    style.innerHTML = `
        .avatar-placeholder {
            width: 80px;
            height: 80px;
            background-color: #6c757d;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
        }
    `;
    document.head.appendChild(style);
}

// Get user level based on reputation points
function getUserLevel(points) {
    if (points < 10) return "Pemula";
    if (points < 30) return "Anggota";
    if (points < 60) return "Kontributor";
    if (points < 100) return "Aktif";
    if (points < 200) return "Pro";
    return "Master";
}

// Get badge color based on level
function getLevelColor(level) {
    switch(level) {
        case "Pemula": return "secondary";
        case "Anggota": return "info";
        case "Kontributor": return "primary";
        case "Aktif": return "success";
        case "Pro": return "warning";
        case "Master": return "danger";
        default: return "secondary";
    }
}

// Edit user profile
function editUserProfile(user) {
    // Mock implementation - in a real app this would be a proper form
    const newUsername = prompt("Ubah username:", user.username);
    if (newUsername && newUsername.trim() !== "") {
        // Update user in localStorage
        user.username = newUsername.trim();
        localStorage.setItem('currentUser', JSON.stringify(user));

        // Update UI
        document.getElementById('currentUsername').textContent = user.username;
        updateUserProfile(user);

        // Update logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.textContent = `Logout (${user.username})`;
        }

        alert("Profil berhasil diperbarui!");
    }
}

// Sample categories data with post counts
const categories = [
    { id: 1, name: 'sekolah', postCount: 5 },
    { id: 2, name: 'running', postCount: 3 },
    { id: 3, name: 'Musik', postCount: 7 },
    { id: 4, name: 'all', postCount: 15 }
];

// Load and save posts to localStorage
function loadPosts() {
    return JSON.parse(localStorage.getItem('posts')) || [];
}

function savePosts(posts) {
    localStorage.setItem('posts', JSON.stringify(posts));
}

// Initialize posts if empty
function initializePosts() {
    const posts = loadPosts();
    if (posts.length === 0) {
        // Sample post
        const samplePost = {
            id: 1,
            title: "gimana web nya?",
            content: "Bagaimana cara belajar programming yang efektif untuk pemula?",
            author: "Raymondo",
            category: "sekolah",
            timestamp: new Date().toISOString(),
            comments: [],
            likes: []
        };
        posts.push(samplePost);
        savePosts(posts);
    }
}

// Display posts
function displayPosts() {
    const postListElem = document.getElementById('postList');
    if (!postListElem) return;

    postListElem.innerHTML = ''; // Clear existing posts

    const posts = loadPosts();

    posts.forEach(post => {
        const postElement = createPostElement(post);
        postListElem.appendChild(postElement);
    });
}

// Create post element
function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.className = 'card mb-3';
    postElement.dataset.postId = post.id;

    // Format date
    const postDate = new Date(post.timestamp);
    const timeAgo = getTimeAgo(postDate);

    // Generate file HTML if post has file
    let fileHtml = '';
    if (post.file && post.file.data) {
        if (post.file.type.startsWith('image/')) {
            fileHtml = `
                <div class="mt-3 mb-3">
                    <img src="${post.file.data}" alt="Gambar yang diunggah" class="img-fluid rounded" style="max-height: 300px;">
                </div>
            `;
        } else {
            fileHtml = `
                <div class="mt-3 mb-3">
                    <div class="alert alert-info">
                        <i class="bi bi-file-earmark"></i> File terlampir: ${post.file.name}
                    </div>
                </div>
            `;
        }
    }

    // Generate comments HTML
    let commentsHtml = '';
    if (post.comments && post.comments.length > 0) {
        commentsHtml = `
            <div class="comments-section mt-3">
                <h6 class="text-dark">Komentar:</h6>
                <div class="list-group">
                    ${post.comments.map(comment => `
                        <div class="list-group-item">
                            <div class="d-flex w-100 justify-content-between">
                                <h6 class="mb-1">${comment.author}</h6>
                                <small>${getTimeAgo(new Date(comment.timestamp))}</small>
                            </div>
                            <p class="mb-1">${comment.text}</p>
                            ${comment.file ? `
                                <div class="mt-2">
                                    <img src="${comment.file.data}" alt="Komentar gambar" class="img-fluid rounded" style="max-height: 150px;">
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    postElement.innerHTML = `
        <div class="card-header d-flex justify-content-between">
            <span>${post.author}</span>
            <small>${timeAgo}</small>
        </div>
        <div class="card-body">
            <h5 class="card-title text-dark">${post.title}</h5>
            <p class="card-text text-dark">${post.content}</p>
            ${fileHtml}
            <div class="d-flex justify-content-between">
                <span class="badge bg-secondary">${post.category}</span>
                <div>
                    <button class="btn btn-sm btn-outline-primary comment-btn" data-post-id="${post.id}">Komentar (${post.comments ? post.comments.length : 0})</button>
                    <button class="btn btn-sm btn-outline-success like-btn" data-post-id="${post.id}">Suka (${post.likes ? post.likes.length : 0})</button>
                </div>
            </div>
            ${commentsHtml}
        </div>
    `;

    // Add event listeners to the buttons
    setTimeout(() => {
        const commentBtn = postElement.querySelector('.comment-btn');
        const likeBtn = postElement.querySelector('.like-btn');

        if (commentBtn) {
            commentBtn.addEventListener('click', handleCommentClick);
        }

        if (likeBtn) {
            likeBtn.addEventListener('click', handleLikeClick);
        }
    }, 0);

    return postElement;
}

// Create new post with modal
function createNewPost() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Silakan login terlebih dahulu.');
        return;
    }

    // Create modal for new post
    const modalHTML = `
    <div class="modal fade" id="newPostModal" tabindex="-1" aria-labelledby="newPostModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title text-dark" id="newPostModalLabel">Buat Diskusi Baru</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="newPostForm">
              <div class="mb-3">
                <label for="postTitle" class="form-label text-dark">Judul</label>
                <input type="text" class="form-control" id="postTitle" required>
              </div>
              <div class="mb-3">
                <label for="postContent" class="form-label text-dark">Isi Diskusi</label>
                <textarea class="form-control" id="postContent" rows="4" required></textarea>
              </div>
              <div class="mb-3">
                <label for="postCategory" class="form-label text-dark">Kategori</label>
                <select class="form-select" id="postCategory" required>
                  <option value="emel">emel</option>
                  <option value="sekolah">sekolah</option>
                  <option value="running">running</option>
                  <option value="musik">Musik</option>
                  <option value="all">all</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="postFile" class="form-label text-dark">Lampirkan File (opsional)</label>
                <input class="form-control" type="file" id="postFile" accept="image/*">
                <div class="form-text">Mendukung format gambar (JPG, PNG, GIF)</div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
            <button type="button" class="btn btn-primary" id="submitNewPost">Posting</button>
          </div>
        </div>
      </div>
    </div>
    `;

    // Add modal to body if it doesn't exist
    if (!document.getElementById('newPostModal')) {
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
    }

    // Initialize modal
    const newPostModal = new bootstrap.Modal(document.getElementById('newPostModal'));
    newPostModal.show();

    // Handle form submission
    document.getElementById('submitNewPost').addEventListener('click', function() {
        const title = document.getElementById('postTitle').value.trim();
        const content = document.getElementById('postContent').value.trim();
        const category = document.getElementById('postCategory').value;
        const fileInput = document.getElementById('postFile');
        
        if (title && content && category) {
            const posts = loadPosts();
            
            // Handle file upload
            let fileData = null;
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    // Create new post with file data
                    const newPost = {
                        id: Date.now(),
                        title,
                        content,
                        author: currentUser.username,
                        category,
                        timestamp: new Date().toISOString(),
                        comments: [],
                        likes: [],
                        file: {
                            name: file.name,
                            type: file.type,
                            data: e.target.result
                        }
                    };
                    
                    // Add to posts list
                    posts.unshift(newPost);
                    savePosts(posts);
                    
                    // Update UI
                    displayPosts();
                    
                    // Close modal
                    newPostModal.hide();
                };
                
                reader.readAsDataURL(file);
            } else {
                // Create new post without file
                const newPost = {
                    id: Date.now(),
                    title,
                    content,
                    author: currentUser.username,
                    category,
                    timestamp: new Date().toISOString(),
                    comments: [],
                    likes: []
                };
                
                // Add to posts list
                posts.unshift(newPost);
                savePosts(posts);
                
                // Update UI
                displayPosts();
                
                // Close modal
                newPostModal.hide();
            }
        } else {
            alert('Semua kolom wajib diisi!');
        }
    });
}

// Utility function to get time ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) {
        return Math.floor(interval) + " tahun yang lalu";
    }

    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + " bulan yang lalu";
    }

    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + " hari yang lalu";
    }

    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + " jam yang lalu";
    }

    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + " menit yang lalu";
    }

    return "Baru saja";
}

// Forum chat functionality
// Current active channel
let currentChannel = 'emel';

// Load and save messages to localStorage
function loadMessages(channel) {
    const allMessages = JSON.parse(localStorage.getItem('chatMessages')) || {};
    return allMessages[channel] || [];
}

function saveMessages(channel, messages) {
    const allMessages = JSON.parse(localStorage.getItem('chatMessages')) || {};
    allMessages[channel] = messages;
    localStorage.setItem('chatMessages', JSON.stringify(allMessages));
}

// Function to format time with date
function formatTime() {
    const now = new Date();
    const date = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return `${date} ${time}`;
}

// Function to add chat message
function addChatMessage(message, isCurrentUser = true, username = null, isSystem = false, saveToStorage = true) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const messageElement = document.createElement('div');
    const time = formatTime();
    const messageId = Date.now().toString() + Math.random().toString(36).substr(2, 5); // More unique ID
    messageElement.dataset.messageId = messageId;

    if (isSystem) {
        messageElement.className = 'message system-message';
        messageElement.innerHTML = `
            <div class="message-content">${message}</div>
        `;
    } else {
        // Determine if message is from current user
        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { username: 'Guest' };
        const displayName = username || (isCurrentUser ? currentUser.username : 'Lain');
        
        // If username is explicitly provided, check if it's current user
        const isActuallyCurrentUser = username ? 
            (username === currentUser.username) : 
            isCurrentUser;
            
        messageElement.className = `message ${isActuallyCurrentUser ? 'user-message' : 'other-message'}`;

        // Only show delete button for user's own messages
        const deleteButton = isActuallyCurrentUser ? 
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
                isCurrentUser: isActuallyCurrentUser,
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
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { username: 'Guest' };

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
            const initialMessages = [];
            
            channelMessages[channel].forEach(msg => {
                const messageId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
                initialMessages.push({
                    id: messageId,
                    message: msg.message,
                    isCurrentUser: false,
                    username: msg.user,
                    timestamp: new Date().toISOString(),
                    time: formatTime()
                });
                
                addChatMessage(msg.message, false, msg.user, false, false);
            });
            
            // Save initial messages
            saveMessages(channel, initialMessages);
        }
    } else {
        // Display saved messages
        messages.forEach(msg => {
            // Check if this message belongs to current user
            const isFromCurrentUser = msg.username === currentUser.username;
            
            // Create message element manually to ensure we show the stored timestamp
            const chatMessages = document.getElementById('chatMessages');
            if (chatMessages) {
                const messageElement = document.createElement('div');
                const messageId = msg.id || Date.now().toString() + Math.random().toString(36).substr(2, 5);
                messageElement.dataset.messageId = messageId;
                
                // Format timestamp if it exists, otherwise use the time field
                let displayTime = msg.time;
                if (msg.timestamp) {
                    const msgDate = new Date(msg.timestamp);
                    displayTime = `${msgDate.toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    })} ${String(msgDate.getHours()).padStart(2, '0')}:${String(msgDate.getMinutes()).padStart(2, '0')}`;
                }
                
                messageElement.className = `message ${isFromCurrentUser ? 'user-message' : 'other-message'}`;
                
                // Only show delete button for user's own messages
                const deleteButton = isFromCurrentUser ? 
                    `<button class="btn-delete-message" data-message-id="${messageId}">
                        <i class="bi bi-trash"></i>
                     </button>` : '';
                
                messageElement.innerHTML = `
                    <div class="message-header">
                        <strong>${msg.username}</strong>
                        <div class="message-actions">
                            <small>${displayTime}</small>
                            ${deleteButton}
                        </div>
                    </div>
                    <div class="message-content">${msg.message}</div>
                `;
                
                chatMessages.appendChild(messageElement);
                
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
        });
        
        // Scroll to the bottom
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
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
        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { username: 'Guest' };
        
        // Add user message with metadata
        const messageId = Date.now().toString();
        const messageData = {
            id: messageId,
            message: message,
            isCurrentUser: true,
            username: currentUser.username,
            timestamp: new Date().toISOString(),
            time: formatTime()
        };
        
        // Save to localStorage first to ensure persistence
        const messages = loadMessages(currentChannel);
        messages.push(messageData);
        saveMessages(currentChannel, messages);
        
        // Then add to UI
        addChatMessage(message, true, currentUser.username, false, false);
        
        // Clear input
        chatInput.value = '';
        
        // Update category post counts
        updateCategoryPostCounts();
        
        // Simulate response from other users (for demo purposes only)
        // In a real app, you would use a real-time database or WebSockets
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
                
                // Save bot response to localStorage
                const botMessageId = (Date.now() + 1).toString();
                const botMessageData = {
                    id: botMessageId,
                    message: randomResponse,
                    isCurrentUser: false,
                    username: randomUser,
                    timestamp: new Date().toISOString(),
                    time: formatTime()
                };
                
                const updatedMessages = loadMessages(currentChannel);
                updatedMessages.push(botMessageData);
                saveMessages(currentChannel, updatedMessages);
                
                // Then add to UI
                addChatMessage(randomResponse, false, randomUser, false, false);

                // Update category post counts after response
                updateCategoryPostCounts();
            }, 1000 + Math.random() * 2000);
        }
    }
}

// Function to add emoji to input
function addEmojiToInput(emoji) {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.value += emoji;
        chatInput.focus();
    }
}

// Handle comment button clicks
function handleCommentClick(event) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Silakan login terlebih dahulu untuk menambahkan komentar.');
        return;
    }

    const postId = parseInt(event.target.getAttribute('data-post-id'));
    
    // Create modal for comment
    const modalHTML = `
    <div class="modal fade" id="commentModal" tabindex="-1" aria-labelledby="commentModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title text-dark" id="commentModalLabel">Tambahkan Komentar</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="commentForm">
              <div class="mb-3">
                <label for="commentText" class="form-label text-dark">Komentar</label>
                <textarea class="form-control" id="commentText" rows="3" required></textarea>
              </div>
              <div class="mb-3">
                <label for="commentFile" class="form-label text-dark">Lampirkan Gambar (opsional)</label>
                <input class="form-control" type="file" id="commentFile" accept="image/*">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
            <button type="button" class="btn btn-primary" id="submitComment">Posting</button>
          </div>
        </div>
      </div>
    </div>
    `;

    // Add modal to body if it doesn't exist
    if (!document.getElementById('commentModal')) {
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
    }

    // Initialize and show modal
    const commentModal = new bootstrap.Modal(document.getElementById('commentModal'));
    commentModal.show();

    // Handle form submission
    document.getElementById('submitComment').addEventListener('click', function() {
        const commentText = document.getElementById('commentText').value.trim();
        const fileInput = document.getElementById('commentFile');
        
        if (commentText) {
            const posts = loadPosts();
            const postIndex = posts.findIndex(post => post.id === postId);

            if (postIndex !== -1) {
                // Initialize comments array if needed
                if (!posts[postIndex].comments) {
                    posts[postIndex].comments = [];
                }

                // Handle file upload
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const reader = new FileReader();
                    
                    reader.onload = function(e) {
                        // Add comment with file
                        posts[postIndex].comments.push({
                            id: Date.now(),
                            author: currentUser.username,
                            text: commentText,
                            timestamp: new Date().toISOString(),
                            file: {
                                name: file.name,
                                type: file.type,
                                data: e.target.result
                            }
                        });
                        
                        // Save posts
                        savePosts(posts);
                        
                        // Update UI
                        displayPosts();
                        
                        // Close modal
                        commentModal.hide();
                    };
                    
                    reader.readAsDataURL(file);
                } else {
                    // Add comment without file
                    posts[postIndex].comments.push({
                        id: Date.now(),
                        author: currentUser.username,
                        text: commentText,
                        timestamp: new Date().toISOString()
                    });
                    
                    // Save posts
                    savePosts(posts);
                    
                    // Update UI
                    displayPosts();
                    
                    // Close modal
                    commentModal.hide();
                }
            }
        } else {
            alert('Komentar tidak boleh kosong!');
        }
    });
}

// Handle like button clicks
function handleLikeClick(event) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Silakan login terlebih dahulu untuk menyukai postingan.');
        return;
    }

    const postId = parseInt(event.target.getAttribute('data-post-id'));
    const posts = loadPosts();
    const postIndex = posts.findIndex(post => post.id === postId);

    if (postIndex !== -1) {
        // Initialize likes array if it doesn't exist
        if (!posts[postIndex].likes) {
            posts[postIndex].likes = [];
        }

        // Check if user already liked this post
        const userLikeIndex = posts[postIndex].likes.findIndex(like => like.username === currentUser.username);

        if (userLikeIndex === -1) {
            // Add like
            posts[postIndex].likes.push({
                username: currentUser.username,
                timestamp: new Date().toISOString()
            });
            alert(`Anda menyukai postingan ini!`);
        } else {
            // Remove like
            posts[postIndex].likes.splice(userLikeIndex, 1);
            alert(`Anda membatalkan suka pada postingan ini.`);
        }

        // Save posts
        savePosts(posts);

        // Update UI
        displayPosts();
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

// Mobile tab navigation
function setupMobileTabs() {
    const mobileTabs = document.querySelectorAll('.mobile-tab');
    if (mobileTabs.length > 0) {
        mobileTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Update active tab
                document.querySelectorAll('.mobile-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Show selected panel
                const targetPanel = this.getAttribute('data-target');
                document.querySelectorAll('.mobile-panel').forEach(panel => {
                    panel.classList.remove('active');
                });
                document.getElementById(targetPanel).classList.add('active');
            });
        });
    }
}

// Function to sync desktop and mobile components
function syncDesktopMobileElements() {
    // Sync profile sections
    const profileDesktop = document.getElementById('userProfileSectionDesktop');
    const profileMobile = document.getElementById('userProfileSection');
    if (profileDesktop && profileMobile) {
        // When desktop is updated, update mobile too
        const observer = new MutationObserver(function() {
            profileMobile.innerHTML = profileDesktop.innerHTML;
        });
        observer.observe(profileDesktop, { childList: true, subtree: true });
    }
    
    // Sync channel lists
    const channelListDesktop = document.getElementById('channelListDesktop');
    const channelList = document.getElementById('channelList');
    if (channelListDesktop && channelList) {
        // Make sure both lists respond to channel changes
        channelListDesktop.querySelectorAll('.list-group-item').forEach(item => {
            item.addEventListener('click', function() {
                const channel = this.getAttribute('data-channel');
                if (channel) {
                    changeChannel(channel);
                }
            });
        });
        
        // Update both lists when channels change
        const updateChannelLists = () => {
            const badges = document.querySelectorAll('#channelList .badge');
            const badgesDesktop = document.querySelectorAll('#channelListDesktop .badge');
            
            for (let i = 0; i < badges.length && i < badgesDesktop.length; i++) {
                const channel = badges[i].closest('.list-group-item').getAttribute('data-channel');
                const messages = loadMessages(channel);
                badges[i].textContent = messages.length;
                badgesDesktop[i].textContent = messages.length;
            }
        };
        
        // Override updateCategoryPostCounts to update both lists
        const originalUpdateCounts = updateCategoryPostCounts;
        updateCategoryPostCounts = function() {
            originalUpdateCounts();
            updateChannelLists();
        };
    }
    
    // Sync online users lists
    const onlineUsersDesktop = document.getElementById('onlineUsersDesktop');
    const onlineUsers = document.getElementById('onlineUsers');
    if (onlineUsersDesktop && onlineUsers) {
        // When desktop is updated, update mobile too
        const observer = new MutationObserver(function() {
            onlineUsers.innerHTML = onlineUsersDesktop.innerHTML;
        });
        observer.observe(onlineUsersDesktop, { childList: true, subtree: true });
    }
    
    // Sync refresh buttons
    const refreshUsersDesktop = document.getElementById('refreshUsersDesktop');
    const refreshUsers = document.getElementById('refreshUsers');
    if (refreshUsersDesktop && refreshUsers) {
        refreshUsersDesktop.addEventListener('click', function() {
            refreshUsers.click();
        });
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
    
    // Setup mobile tabs
    setupMobileTabs();

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
        
        // Update online users list on page load
        updateOnlineUsersList();
        
        // Sync desktop and mobile elements
        syncDesktopMobileElements();

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

        // Function to update online users list
        function updateOnlineUsersList() {
            const usersList = document.getElementById('onlineUsers');
            if (!usersList) return;
            
            // Clear current list
            usersList.innerHTML = '';
            
            // Add current logged-in user first
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser) {
                const currentUserItem = document.createElement('li');
                currentUserItem.className = 'list-group-item d-flex align-items-center';
                currentUserItem.innerHTML = `
                    <span class="online-indicator"></span>
                    ${currentUser.username} (Anda)
                    <span class="badge bg-success ms-auto">Online</span>
                `;
                usersList.appendChild(currentUserItem);
            }
            
            // Add admin user
            const adminUserItem = document.createElement('li');
            adminUserItem.className = 'list-group-item d-flex align-items-center';
            adminUserItem.innerHTML = `
                <span class="online-indicator"></span>
                Raymondo
                <span class="badge bg-primary ms-auto">Admin</span>
            `;
            usersList.appendChild(adminUserItem);
            
            // Get other logged-in users from localStorage (in a real app, this would come from server)
            // For demo, we'll check all users in the system and randomly make some of them "online"
            const allUsers = JSON.parse(localStorage.getItem('users')) || [];
            const onlineUsers = allUsers.filter(user => 
                user.username !== currentUser?.username && 
                Math.random() > 0.5 // Randomly select some users as online for demo
            ).slice(0, 3); // Limit to max 3 other online users for demo
            
            onlineUsers.forEach(user => {
                const userItem = document.createElement('li');
                userItem.className = 'list-group-item d-flex align-items-center';
                userItem.innerHTML = `
                    <span class="online-indicator"></span>
                    ${user.username}
                `;
                usersList.appendChild(userItem);
            });
            
            // If no other users are online
            if (onlineUsers.length === 0 && !currentUser) {
                const noUsersItem = document.createElement('li');
                noUsersItem.className = 'list-group-item text-center text-muted';
                noUsersItem.textContent = 'Tidak ada pengguna online';
                usersList.appendChild(noUsersItem);
            }
        }
        
        // Refresh users list
        const refreshUsersBtn = document.getElementById('refreshUsers');
        if (refreshUsersBtn) {
            refreshUsersBtn.addEventListener('click', function() {
                // Show loading state
                this.textContent = 'Menyegarkan...';
                this.disabled = true;
                
                // After a brief delay, update the user list
                setTimeout(() => {
                    updateOnlineUsersList();
                    
                    // Reset button
                    this.textContent = 'Refresh Pengguna';
                    this.disabled = false;
                    
                    // Show success message in chat
                    addChatMessage('Daftar pengguna berhasil diperbarui!', false, 'Admin', true);
                }, 1000);
            });
        }
    }
});
