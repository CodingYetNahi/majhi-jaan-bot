import { botBrain } from './bot.js';

const chatWindow = document.getElementById('chatWindow');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// Initialize chat
function init() {
    const memory = JSON.parse(localStorage.getItem('majhiJaanMemory'));
    if (memory && memory.name) {
        addMessage(`Welcome back, majhi ${memory.name}! ❤️ Kasa kai?`, 'bot');
    } else {
        addMessage("Hello jaan! ❤️ Maza nav tula mahay na? Ani tujha nav kay?", 'bot');
    }
}

function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender === 'bot' ? 'bot-msg' : 'user-msg');
    msgDiv.textContent = text;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('typing-indicator');
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    chatWindow.appendChild(typingDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function hideTyping() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    userInput.value = '';

    showTyping();

    // Simulate natural typing delay
    const delay = Math.random() * 1000 + 800;
    setTimeout(() => {
        hideTyping();
        const reply = botBrain.processInput(text);
        addMessage(reply, 'bot');
    }, delay);
}

// Event Listeners
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});

// Start app
init();
