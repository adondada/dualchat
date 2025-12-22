import { useState, useEffect } from "react";
import Chat from "./Chat";
import { v4 as uuid } from "uuid";

export default function App() {
  const [conversationId, setConversationId] = useState(() => uuid());
  const [mode, setMode] = useState("quick"); // 'quick' or 'project'
  const [history, setHistory] = useState([]);

  // Fetch history when app starts
  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch("http://localhost:3001/history");
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  }

  function startNewChat() {
    setConversationId(uuid());
    // We don't add it to history list yet; it appears after first message
  }

  // Filter history based on the current mode
  const filteredHistory = history.filter((h) => h.type === mode);

  return (
    <>
      {/* SIDEBAR */}
      <div className="sidebar">
        
        {/* Dual Mode Switcher */}
        <div className="mode-switch">
          <button 
            className={mode === "quick" ? "active" : ""} 
            onClick={() => setMode("quick")}
          >
            🔍 Quick
          </button>
          <button 
            className={mode === "project" ? "active" : ""} 
            onClick={() => setMode("project")}
          >
            🚀 Project
          </button>
        </div>

        <button className="new-chat-btn" onClick={startNewChat}>
          + New {mode === "quick" ? "Search" : "Project"}
        </button>

        <div className="history-list">
          <p style={{ color: "#666", fontSize: "12px", marginBottom: "10px" }}>
            {mode === "quick" ? "RECENT SEARCHES" : "YOUR PROJECTS"}
          </p>
          {filteredHistory.map((chat) => (
            <div
              key={chat.id}
              className={`history-item ${chat.id === conversationId ? "active" : ""}`}
              onClick={() => setConversationId(chat.id)}
            >
              {chat.title}
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA - We pass the 'mode' so Chat.jsx knows what type to save */}
      <Chat 
        key={conversationId} 
        conversationId={conversationId} 
        mode={mode}
        onMessageSent={fetchHistory} 
      />
    </>
  );
}