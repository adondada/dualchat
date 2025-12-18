import { useState, useRef, useEffect } from "react";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  function scrollToBottom() {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function send() {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    const res = await fetch("http://localhost:3001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: "default", message: userMsg.content }),
    });
    const data = await res.json();
    const aiMsg = { role: "assistant", content: data.reply };
    setMessages(prev => [...prev, aiMsg]);
  }

  useEffect(scrollToBottom, [messages]);

  return (
    <div style={{ width: "400px", margin: "20px auto", fontFamily: "sans-serif" }}>
      <div style={{ height: "500px", overflowY: "auto", border: "1px solid #333", padding: "10px", background: "#111" }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              textAlign: m.role === "user" ? "right" : "left",
              margin: "5px 0",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: "12px",
                background: m.role === "user" ? "#0f62fe" : "#333",
                color: "#fff",
                maxWidth: "80%",
                wordWrap: "break-word",
              }}
            >
              {m.content}
            </span>
          </div>
        ))}
        <div ref={chatEndRef}></div>
      </div>
      <div style={{ marginTop: "10px", display: "flex" }}>
        <input
          style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #333" }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          style={{ marginLeft: "5px", padding: "8px 12px", borderRadius: "6px", border: "none", background: "#0f62fe", color: "#fff" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
