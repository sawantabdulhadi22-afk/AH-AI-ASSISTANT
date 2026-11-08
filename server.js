const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/status", async (req, res) => {
  try {
    const response = await fetch("http://127.0.0.1:11434/api/tags");
    const data = await response.json();

    res.json({
      online: true,
      assistant: "AH-AI-ASSISTANT",
      ai: "Ollama",
      models: data.models || []
    });
  } catch {
    res.json({
      online: false,
      assistant: "AH-AI-ASSISTANT",
      message: "Ollama is not connected"
    });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    const messages = [
      {
        role: "system",
        content: `You are AH-AI-ASSISTANT, a helpful personal AI assistant.
Your personality is intelligent, friendly, calm and professional.
You can help with studying, coding, planning and everyday questions.
Call yourself AH-AI-ASSISTANT.
Never claim to have performed an action unless it actually happened.
Ask for confirmation before any consequential action.`
      },
      ...history.slice(-20),
      { role: "user", content: message }
    ];

    const response = await fetch(
      "http://127.0.0.1:11434/api/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || "qwen2.5:3b",
          messages,
          stream: false
        })
      }
    );

    if (!response.ok) {
      throw new Error("AI model could not respond.");
    }

    const data = await response.json();

    res.json({
      reply: data.message?.content || "I couldn't generate a response."
    });

  } catch (error) {
    res.status(503).json({
      error: "AI is currently unavailable. Please check the Ollama connection."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AH-AI-ASSISTANT running on port ${PORT}`);
});
