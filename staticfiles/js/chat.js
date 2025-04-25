// Chat functionality for CoderX
document.addEventListener('DOMContentLoaded', function() {
    // Initialize chat UI components
    initChatUI();
    
    // Handle form submission
    const messageForm = document.getElementById('message-form');
    if (messageForm) {
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendMessage();
        });
    }
    
    // Handle new conversation creation
    const newConversationBtn = document.querySelector('.new-conversation-btn');
    if (newConversationBtn) {
        newConversationBtn.addEventListener('click', function() {
            window.location.href = '/chat/new/';
        });
    }
    
    // Handle conversation deletion
    const deleteButtons = document.querySelectorAll('.delete-conversation-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const conversationId = this.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this conversation?')) {
                deleteConversation(conversationId);
            }
        });
    });
    
    // Auto-scroll chat to bottom on load
    scrollChatToBottom();
});

// Initialize chat UI elements and effects
function initChatUI() {
    // Apply scanner effect to active conversation
    const activeConversation = document.querySelector('.conversation-item.active');
    if (activeConversation) {
        activeConversation.classList.add('scanner');
    }
    
    // Add hex pattern to chat sidebar
    const chatSidebar = document.querySelector('.chat-sidebar');
    if (chatSidebar) {
        chatSidebar.classList.add('hex-pattern');
    }
    
    // Add circuit pattern to chat main area
    const chatMain = document.querySelector('.chat-main');
    if (chatMain) {
        chatMain.classList.add('circuit-pattern');
    }
    
    // Add tech borders to message input
    const messageInput = document.querySelector('.chat-input textarea');
    if (messageInput) {
        messageInput.parentElement.classList.add('tech-border');
    }
}

// Send message via AJAX
function sendMessage() {
    const messageInput = document.getElementById('id_content');
    const messageContent = messageInput.value.trim();
    
    if (!messageContent) return;
    
    // Disable input and show loading state
    messageInput.disabled = true;
    const submitBtn = document.querySelector('.chat-input button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    // Get conversation ID
    const conversationId = document.querySelector('.chat-container').getAttribute('data-conversation-id');
    
    // Get CSRF token
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    // Create form data
    const formData = new FormData();
    formData.append('content', messageContent);
    formData.append('csrfmiddlewaretoken', csrfToken);
    
    // Send AJAX request
    fetch(`/chat/${conversationId}/send/`, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Clear input
            messageInput.value = '';
            
            // Add user message to chat
            addMessageToChat(data.user_message.content, true, data.user_message.timestamp);
            
            // Add AI response to chat
            addMessageToChat(data.ai_message.content, false, data.ai_message.timestamp);
            
            // Enable input
            messageInput.disabled = false;
            messageInput.focus();
        } else {
            console.error('Error sending message:', data.error);
            alert('Error sending message. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error sending message. Please try again.');
    })
    .finally(() => {
        // Reset button state
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
        messageInput.disabled = false;
    });
}

// Add message to chat display
function addMessageToChat(message, isUser, timestamp) {
    const chatMessages = document.querySelector('.chat-messages');
    
    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.className = isUser ? 'message message-user' : 'message message-ai';
    
    // Add sender info
    const senderElement = document.createElement('div');
    senderElement.className = 'message-sender';
    senderElement.textContent = isUser ? 'You' : 'AI';
    messageContainer.appendChild(senderElement);
    
    // Add message content with escaped HTML
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.textContent = message; // This automatically escapes HTML
    messageContainer.appendChild(contentElement);
    
    // Add timestamp
    const timestampElement = document.createElement('div');
    timestampElement.className = 'message-timestamp';
    timestampElement.textContent = timestamp;
    messageContainer.appendChild(timestampElement);
    
    // Add to chat
    chatMessages.appendChild(messageContainer);
    
    // Scroll to bottom
    scrollChatToBottom();
}

// Delete conversation
function deleteConversation(conversationId) {
    // Get CSRF token
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    // Create form data
    const formData = new FormData();
    formData.append('csrfmiddlewaretoken', csrfToken);
    
    // Send AJAX request
    fetch(`/chat/${conversationId}/delete/`, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Redirect to the next available conversation or create a new one
            window.location.href = '/chat/';
        } else {
            console.error('Error deleting conversation:', data.error);
            alert('Error deleting conversation. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error deleting conversation. Please try again.');
    });
}

// Scroll chat to bottom
function scrollChatToBottom() {
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}