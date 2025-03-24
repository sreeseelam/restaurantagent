// Create the chat widget HTML
const chatHTML = `
<!-- 💬 Chat Toggle -->
<button id="chat-toggle" onclick="toggleChat()" class="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 z-50">
  💬 Chat
</button>

<!-- 💬 Chat Box -->
<div id="chat-box" class="hidden fixed bottom-20 right-6 h-[500px] flex bg-white border shadow-lg rounded-lg z-40" style="width: 450px;">
  <div id="resizer" class="h-full" style="width: 6px; background-color: #cbd5e1; cursor: ew-resize;"></div>
  <div class="flex flex-col w-full h-full">
    <div class="flex justify-between items-center bg-blue-600 text-white p-3 font-semibold rounded-t-lg">
      <span>Ask the Assistant</span>
      <button onclick="minimizeChat()" class="text-white text-lg">▁</button>
    </div>
    <div class="flex flex-col flex-1 overflow-hidden">
      <div id="chat-container" class="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100"></div>
      <div class="flex items-center p-2 border-t bg-white">
        <textarea id="user-input" rows="1" placeholder="Type your message..." class="flex-1 p-2 border rounded resize-none focus:outline-none focus:ring" onkeydown="handleEnter(event)"></textarea>
        <button onclick="sendMessage()" class="ml-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Send</button>
        <button onclick="resetChat()" class="ml-2 px-3 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">Reset</button>
      </div>
    </div>
  </div>
</div>
`;

// Inject into DOM
document.body.insertAdjacentHTML('beforeend', chatHTML);

// Chat widget behavior
let sessionId = "session_" + Math.random().toString(36).substring(2);

function toggleChat() {
  document.getElementById("chat-box").classList.remove("hidden");
}
function minimizeChat() {
  document.getElementById("chat-box").classList.add("hidden");
}
function handleEnter(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

async function startSession() {
  await fetch('/start-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId })
  });
}

async function sendMessage() {
  const input = document.getElementById('user-input');
  const message = input.value.trim();
  if (!message) return;

  appendMessage('user', message);
  input.value = '';
  appendMessage('assistant', 'Typing...', true);

  const res = await fetch('/send-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message })
  });

  const data = await res.json();
  removeTyping();
  appendMessage('assistant', data.response);
}

async function resetChat() {
  await fetch('/clear-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId })
  });
  sessionId = "session_" + Math.random().toString(36).substring(2);
  await startSession();
  document.getElementById('chat-container').innerHTML = '';
}

function appendMessage(role, content, isTyping = false) {
  const div = document.createElement('div');
  div.className = `text-sm rounded p-2 max-w-xl whitespace-pre-wrap ${role === 'user' ? 'bg-blue-100 self-end' : 'bg-green-100 self-start'}`;
  div.textContent = `${role === 'user' ? 'You' : 'Assistant'}: ${content}`;
  if (isTyping) div.id = "typing-indicator";
  const time = document.createElement('div');
  time.className = "text-xs text-gray-500 mt-1";
  time.textContent = new Date().toLocaleTimeString();
  div.appendChild(time);
  document.getElementById('chat-container').appendChild(div);
  div.scrollIntoView({ behavior: 'smooth' });
}

function removeTyping() {
  const typing = document.getElementById('typing-indicator');
  if (typing) typing.remove();
}

// Drag-to-resize
const chatBox = () => document.getElementById("chat-box");
const resizer = () => document.getElementById("resizer");
let isResizing = false;

document.addEventListener("mousedown", (e) => {
  if (e.target === resizer()) {
    isResizing = true;
    document.body.style.cursor = "ew-resize";
  }
});

document.addEventListener("mousemove", (e) => {
  if (!isResizing) return;
  const newWidth = window.innerWidth - e.clientX - 24;
  chatBox().style.width = `${Math.max(300, Math.min(800, newWidth))}px`;
});

document.addEventListener("mouseup", () => {
  isResizing = false;
  document.body.style.cursor = "";
});

startSession();

// Hide chat when clicking outside the widget
document.addEventListener("click", (event) => {
    const chatBoxEl = document.getElementById("chat-box");
    const toggleBtn = document.getElementById("chat-toggle");
  
    if (!chatBoxEl.contains(event.target) && !toggleBtn.contains(event.target)) {
      chatBoxEl.classList.add("hidden");
    }
  });