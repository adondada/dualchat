import { useState, useRef, useEffect } from "react";

export default function Chat({ conversationId, mode, onMessageSent }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function loadChat() {
      try {
        const res = await fetch(`http://localhost:3001/chat/${conversationId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        } else {
          setMessages([]);
        }
      } catch (err) {
        setMessages([]);
      }
    }
    loadChat();
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const res = await fetch("http://localhost:3001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: userMsg.content, type: mode }),
      });

      const data = await res.json();
      
      // We now include the sources in the message object
      const aiMsg = { 
        role: "assistant", 
        content: data.reply, 
        sources: data.sources // <--- Capture the sources
      };
      
      setMessages((prev) => [...prev, aiMsg]);
      if (onMessageSent) onMessageSent();
    } catch (err) {
      console.error("Error sending message:", err);
    }
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.length === 0 && (
          <div style={{ textAlign: "center", marginTop: "50px", color: "#666" }}>
            <h2>{mode === "quick" ? "Quick Search" : "Project Workspace"}</h2>
            <p>Ask anything to start...</p>
          </div>
        )}
        
        {messages.map((m, i) => {
          // Skip system messages
          if (m.role === "system" || m.role === "tool") return null;

          return (
            <div key={i} className={`message-row ${m.role}`}>
              <div className="message-content">
                <div className={`avatar ${m.role}`}>{m.role === "user" ? "U" : "AI"}</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div className="text">{m.content}</div>

                  {/* RENDER SOURCES IF THEY EXIST */}
                  {m.sources && m.sources.length > 0 && (
                    <div className="sources-container">
                      <div className="sources-label">Sources:</div>
                      <div className="sources-list">
                        {m.sources.map((source, idx) => (
                          <a 
                            key={idx} 
                            href={source.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="source-chip"
                          >
                            {source.title.substring(0, 20)}...
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <div className="input-box">
          <textarea
            rows={1}
            value={input}
            placeholder={`Type a message in ${mode} mode...`}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button onClick={send} className="send-btn">➤</button>
        </div>
      </div>
    </div>
  );
}