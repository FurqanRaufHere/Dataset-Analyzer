// Global variables
let currentFile = null;
let conversationMemory = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeFileUpload();
    addFormattingStyles();
});

// File upload initialization
function initializeFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const fileDropArea = document.getElementById('fileDropArea');
    
    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileDropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        fileDropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        fileDropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        fileDropArea.style.borderColor = '#667eea';
        fileDropArea.style.backgroundColor = '#f8f9ff';
    }
    
    function unhighlight() {
        fileDropArea.style.borderColor = '#ccc';
        fileDropArea.style.backgroundColor = '';
    }
    
    fileDropArea.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFileSelect, false);
}

// Handle file drop
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

// Handle file selection
function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

// Process uploaded files
function handleFiles(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    const validExtensions = ['.csv', '.xlsx', '.json'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
        alert('Please upload a valid CSV, Excel, or JSON file.');
        return;
    }
    
    currentFile = file;
    showFileInfo(file.name);
    
    // Upload file to backend
    uploadFile(file);
}

// Show file information
function showFileInfo(fileName) {
    const fileInfo = document.getElementById('fileInfo');
    const fileNameSpan = document.getElementById('fileName');
    
    fileNameSpan.textContent = fileName;
    fileInfo.style.display = 'block';
}

// Remove file
function removeFile() {
    currentFile = null;
    const fileInfo = document.getElementById('fileInfo');
    const fileInput = document.getElementById('fileInput');
    
    fileInfo.style.display = 'none';
    fileInput.value = '';
}

// Upload file to backend
async function uploadFile(file) {
    showLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('File upload failed');
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Switch to chat interface
            showChatInterface();
        } else {
            alert('Error uploading file: ' + result.message);
            removeFile();
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading file. Please try again.');
        removeFile();
    } finally {
        showLoading(false);
    }
}

// Show chat interface
function showChatInterface() {
    const uploadSection = document.getElementById('uploadSection');
    const chatSection = document.getElementById('chatSection');
    
    uploadSection.style.display = 'none';
    chatSection.style.display = 'block';
    
    // Add welcome message
    addMessage('assistant', 'Hello! I\'m ready to help you analyze your dataset. What would you like to know?');
    
    // Focus on input field
    setTimeout(() => {
        document.getElementById('questionInput').focus();
    }, 100);
}

// Reset application
function resetApp() {
    currentFile = null;
    conversationMemory = [];
    
    const uploadSection = document.getElementById('uploadSection');
    const chatSection = document.getElementById('chatSection');
    const chatMessages = document.getElementById('chatMessages');
    
    uploadSection.style.display = 'block';
    chatSection.style.display = 'none';
    chatMessages.innerHTML = '';
    removeFile();
}

// Handle key press in input field
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendQuestion();
    }
}

// Send question to backend
async function sendQuestion() {
    const questionInput = document.getElementById('questionInput');
    const question = questionInput.value.trim();
    
    if (!question) return;
    
    if (!currentFile) {
        alert('Please upload a dataset first.');
        return;
    }
    
    // Add user message to chat
    addMessage('user', question);
    questionInput.value = '';
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: question,
                memory: conversationMemory
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to get answer');
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Add assistant message to chat
            addMessage('assistant', result.answer);
            
            // Update conversation memory
            conversationMemory.push({ role: 'user', content: question });
            conversationMemory.push({ role: 'assistant', content: result.answer });
        } else {
            addMessage('assistant', 'Sorry, I encountered an error while processing your question.');
        }
    } catch (error) {
        console.error('Error:', error);
        addMessage('assistant', 'Sorry, I\'m having trouble connecting to the server. Please try again.');
    } finally {
        showLoading(false);
        scrollToBottom();
    }
}

// Add message to chat
function addMessage(role, content) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const icon = role === 'user' ? 'fas fa-user' : 'fas fa-robot';
    const iconClass = role === 'user' ? 'user' : 'assistant';
    
    // Format the content with proper HTML formatting
    const formattedContent = formatMessageContent(content);
    
    messageDiv.innerHTML = `
        ${role === 'assistant' ? `
            <div class="message-icon ${iconClass}">
                <i class="${icon}"></i>
            </div>
        ` : ''}
        
        <div class="message-content">
            ${formattedContent}
        </div>
        
        ${role === 'user' ? `
            <div class="message-icon ${iconClass}">
                <i class="${icon}"></i>
            </div>
        ` : ''}
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Format message content with proper HTML
function formatMessageContent(content) {
    if (!content) return '';
    
    // Handle line breaks
    let formatted = content
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Handle code blocks
    formatted = formatted.replace(/```(\w+)?\s*([\s\S]*?)```/g, function(match, lang, code) {
        return `<div class="code-block"><pre><code class="language-${lang || ''}">${escapeHtml(code.trim())}</code></pre></div>`;
    });
    
    // Handle lists
    formatted = formatted.replace(/^\- (.*)$/gm, '<li>$1</li>');
    if (formatted.includes('<li>')) {
        formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    }
    
    // Handle numbers
    formatted = formatted.replace(/^(\d+)\. (.*)$/gm, '<li>$2</li>');
    if (formatted.match(/<li>.*<\/li>/)) {
        formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
    }
    
    return formatted;
}

// Escape HTML special characters
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add CSS for code blocks and formatting
function addFormattingStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .message-content code {
            background: #f1f3f4;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.9em;
            color: #d63384;
        }
        
        .code-block {
            margin: 10px 0;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .code-block pre {
            margin: 0;
            padding: 15px;
            overflow-x: auto;
        }
        
        .code-block code {
            background: none;
            padding: 0;
            color: #24292e;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.9em;
            line-height: 1.4;
        }
        
        .message-content ul,
        .message-content ol {
            margin: 极10px 0;
            padding-left: 20px;
        }
        
        .message-content li {
            margin: 5px 0;
            line-height: 1.4;
        }
        
        .message-content strong {
            font-weight: 600;
            color: #2c3e50;
        }
        
        .message-content em {
            font-style: italic;
            color: #555;
        }
    `;
    document.head.appendChild(style);
}

// Scroll chat to bottom
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show/hide loading overlay
function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Error handling
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        background: #ff4757;
        color: white;
        padding: 10px;
        border-radius: 5px;
        margin: 10px 0;
        text-align: center;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Initialize tooltips if needed
function initializeTooltips() {
    // Could add tooltip functionality here if needed
}

// Export functions for global access
window.handleKeyPress = handleKeyPress;
window.sendQuestion = sendQuestion;
window.resetApp = resetApp;
window.removeFile = removeFile;
