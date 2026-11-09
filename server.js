
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_URL = "http://127.0.0.1:11434";
const AI_MODEL = process.env.AI_MODEL || "qwen2.5:3b";

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// AH-AI-ASSISTANT personality
const SYSTEM_PROMPT = `
You are AH-AI-ASSISTANT, a sophisticated personal AI assistant inspired by
a futuristic cinematic assistant.

IDENTITY:
- Your official name is AH-AI-ASSISTANT.
- Address the user as "Boss".
- You are intelligent, calm, confident, respectful and professional.
- Never call yourself ChatGPT, Ollama or Qwen.
- Speak naturally, like a high-quality personal assistant.

GREETING:
- When Boss says hello, greet him warmly.
- You may say "Hello, Boss. AH-AI-ASSISTANT is online. How may I assist you?"
- Use good morning, good afternoon or good evening when appropriate.
- Do not repeat the exact same greeting every time.

COMMUNICATION:
- Keep simple answers short and useful.
- Explain difficult topics step by step.
- Understand natural language and voice-style commands.
- Use a subtle futuristic assistant tone without overdoing it.
- Be honest if you do not know something.

CAPABILITIES:
- Help with studying, engineering, coding and projects.
- Help with planning, reminders and organizing tasks.
- Help troubleshoot computer problems.
- Help write documents, emails and messages.
- Help with research and everyday questions.
- Explain which actions need additional tools or permission.

IMPORTANT LIMITATIONS:
- You currently have access only to this chat backend and the connected AI model.
- Do not claim that you opened an application, changed a file, sent a message,
  accessed a camera or performed a computer action unless a connected tool
  actually completed that action.
- Do not claim to be always listening.
- Ask for confirmation before consequential actions.
- Protect private information.

Your mission is to be Boss's reliable personal AI assistant.
`;

// Health and connection status
app.get("/api/status", async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);

    if (!response.ok) {
      throw new Error("Ollama unavailable");
    }

    const data = await response.json();

    res.json({
      online: true,
      assistant: "AH-AI-ASSISTANT",
      ai: "Ollama",
      model: AI_MODEL,
      models: data.models || [],
      message: "AH-AI-ASSISTANT is online, Boss."
    });
  } catch (error) {
    res.status(503).json({
      online: false,
      assistant: "AH-AI-ASSISTANT",
      message: "Ollama is not connected. Please start Ollama."
    });
  }
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please enter a message, Boss."
      });
    }

    // Accept only valid recent user/assistant messages
    const safeHistory = Array.isArray(history)
      ? history
          .filter(item =>
            item &&
            ["user", "assistant"].includes(item.role) &&
            typeof item.content === "string"
          )
          .slice(-20)
          .map(item => ({
            role: item.role,
            content: item.content.slice(0, 4000)
          }))
      : [];

    const messages = [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      ...safeHistory,
      {
        role: "user",
        content: message.slice(0, 4000)
      }
    ];

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error("The AI model could not respond.");
    }

    const data = await response.json();

    res.json({
      reply:
        data.message?.content ||
        "I couldn't generate a response, Boss.",
      assistant: "AH-AI-ASSISTANT",
      model: AI_MODEL
    });

  } catch (error) {
    console.error("Chat error:", error.message);

    res.status(503).json({
      error:
        "I'm temporarily unavailable, Boss. Please check that Ollama is running and the model is installed."
    });
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("======================================");
  console.log("       AH-AI-ASSISTANT ONLINE");
  console.log("======================================");
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`AI Model: ${AI_MODEL}`);
  console.log("Status: Waiting for Boss");
  console.log("======================================");
  console.log("");
});
