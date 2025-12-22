import express from "express";
import cors from "cors";
import { openai } from "./openai.js";
import { conversations } from "./store.js";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// --- HISTORY & CHAT GET ENDPOINTS (Unchanged) ---
app.get("/history", (req, res) => {
  const history = Object.keys(conversations).map((id) => ({
    id,
    title: conversations[id].title,
    type: conversations[id].type,
  }));
  res.json(history);
});

app.get("/chat/:id", (req, res) => {
  const { id } = req.params;
  const chat = conversations[id];
  if (chat) {
    res.json(chat.messages);
  } else {
    res.status(404).json({ error: "Chat not found" });
  }
});

// --- SEARCH TOOL ---
const tools = [
  {
    type: "function",
    function: {
      name: "google_search",
      description: "Perform a Google search. Use this for ANY question about current events, facts, or data.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query. You can call this multiple times for different aspects.",
          },
        },
        required: ["query"],
      },
    },
  },
];

async function searchGoogle(query) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Search error:", error);
    return null;
  }
}

// --- MAIN CHAT LOGIC ---
app.post("/chat", async (req, res) => {
  const { conversationId, message, type } = req.body;

  if (!conversations[conversationId]) {
    conversations[conversationId] = {
      type: type || "quick",
      title: message.substring(0, 30) + "...",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful AI. If you use the google_search tool, do NOT explicitly list the URLs in your text response unless the user specifically asks for them. Just use the information to answer naturally. The system will automatically display the source buttons to the user." 
        }
      ],
    };
  }

  const chat = conversations[conversationId];
  chat.messages.push({ role: "user", content: message });

  // This will hold the links we find during this turn
  let collectedSources = [];

  try {
    // 1. Initial Call
    let completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chat.messages,
      tools: tools,
      tool_choice: "auto",
    });

    let aiMessage = completion.choices[0].message;

    // 2. Handle Tool Calls
    if (aiMessage.tool_calls) {
      chat.messages.push(aiMessage); // Save the "intent to call"

      for (const toolCall of aiMessage.tool_calls) {
        if (toolCall.function.name === "google_search") {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`🔎 Searching for: ${args.query}`);
          
          const rawResult = await searchGoogle(args.query);
          
          // Collect sources for the frontend
          if (rawResult && rawResult.organic) {
            rawResult.organic.slice(0, 3).forEach(item => {
              collectedSources.push({ title: item.title, link: item.link });
            });
          }

          // Feed simplified text back to AI
          const toolOutput = rawResult 
            ? JSON.stringify(rawResult.organic?.slice(0, 4) || "No results") 
            : "Search failed";

          chat.messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolOutput,
          });
        }
      }

      // 3. Final Answer (after searching)
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: chat.messages,
      });
      aiMessage = completion.choices[0].message;
    }

    // Save final message to history (with sources attached!)
    const finalMessageObj = { 
      role: "assistant", 
      content: aiMessage.content,
      sources: collectedSources.length > 0 ? collectedSources : undefined 
    };
    
    chat.messages.push(finalMessageObj);

    // Send both reply and sources to frontend
    res.json({ 
      reply: aiMessage.content, 
      sources: collectedSources 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI Error" });
  }
});

app.listen(3001, () => {
  console.log("Backend running on http://localhost:3001");
});