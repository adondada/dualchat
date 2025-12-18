  import express from "express";
  import cors from "cors";
  import { openai } from "./openai.js";
  import { conversations } from "./store.js";

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.post("/chat", async (req, res) => {
    const { conversationId, message } = req.body;

    if (!conversations[conversationId]) {
      conversations[conversationId] = [];
    }

    conversations[conversationId].push({ role: "user", content: message });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversations[conversationId],
    });

    const reply = completion.choices[0].message.content;
    conversations[conversationId].push({ role: "assistant", content: reply });

    res.json({ reply });
  });

  app.listen(3001, () => {
    console.log("Backend running on http://localhost:3001");
  });
