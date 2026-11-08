const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatMessages = document.getElementById("chatMessages");
const welcome = document.getElementById("welcome");
const sendBtn = document.getElementById("sendBtn");
const voiceBtn = document.getElementById("voiceBtn");
const newChatBtn = document.getElementById("newChat");
const statusDot = document.getElementById("statusDot");
const connectionText = document.getElementById("connectionText");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

let conversationHistory = [];
let isSending = false;

// SYSTEM STATUS

async function checkConnection() {
  try {
    const response = await fetch("/api/status");
    const data = await response.json();

    if (data.online) {
      statusDot.className = "status-dot online";
      connectionText.textContent = "AI system connected";
    } else {
      statusDot.className = "status-dot offline";
      connectionText.textContent = "AI model offline";
    }
  } catch {
    statusDot.className = "status-dot offline";
    connectionText.textContent = "Backend unavailable";
  }
}

checkConnection();

// DISPLAY MESSAGE

function addMessage(role, content) {
  welcome.style.display = "none";

  const message = document.createElement("div");
  message.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = role === "user" ? "YOU" : "AH";

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";

  // Use textContent to safely display AI and user text.
  messageContent.textContent = content;

  message.appendChild(avatar);
  message.appendChild(messageContent);

  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return messageContent;
}

// SEND MESSAGE

async function sendMessage(text) {
  if (!text.trim() || isSending) return;

  isSending = true;
  sendBtn.disabled = true;

  addMessage("user", text);

  const previousHistory = [...conversationHistory];

  conversationHistory.push({
    role: "user",
    content: text
  });

  messageInput.value = "";

  const loadingMessage = addMessage("assistant", "AH-AI-ASSISTANT is thinking...");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        history: previousHistory
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "AI connection failed.");
    }

    const reply = data.reply || "I couldn't generate a response.";

    loadingMessage.textContent = reply;

    conversationHistory.push({
      role: "assistant",
      content: reply
    });

    speak(reply);

  } catch (error) {
    loadingMessage.textContent =
      "Connection error: " + error.message;

    conversationHistory = previousHistory;
    conversationHistory.push({
      role: "user",
      content: text
    });

  } finally {
    isSending = false;
    sendBtn.disabled = false;
    messageInput.focus();
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// FORM SUBMISSION

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(messageInput.value);
});

// ENTER TO SEND

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

// TEXTAREA RESIZE

messageInput.addEventListener("input", () => {
  messageInput.style.height = "auto";
  messageInput.style.height =
    Math.min(messageInput.scrollHeight, 130) + "px";
});

// SUGGESTED PROMPTS

document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => {
    sendMessage(button.dataset.prompt || "");
  });
});

// NEW CHAT

newChatBtn.addEventListener("click", () => {
  conversationHistory = [];
  chatMessages.replaceChildren();
  welcome.style.display = "";
  messageInput.value = "";
  messageInput.focus();
  sidebar.classList.remove("open");
});

// MOBILE MENU

menuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// VOICE INPUT

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    messageInput.value = transcript;
    messageInput.focus();
    messageInput.dispatchEvent(new Event("input"));
  };

  recognition.onend = () => {
    voiceBtn.classList.remove("listening");
  };

  recognition.onerror = () => {
    voiceBtn.classList.remove("listening");
  };
}

voiceBtn.addEventListener("click", () => {
  if (!recognition) {
    alert("Voice input is not supported in this browser. Try Chrome.");
    return;
  }

  try {
    voiceBtn.classList.add("listening");
    recognition.start();
  } catch {
    voiceBtn.classList.remove("listening");
  }
});

// VOICE RESPONSE

function speak(text) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = 1;
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
}

// SERVICE WORKER

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .catch((error) => {
        console.warn("Service worker registration failed:", error);
      });
  });
}
