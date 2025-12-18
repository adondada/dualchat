import { useState } from "react";

export default function Chat({ conversationId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  async function send() {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages(m => [...m, userMsg]);
    setInput("");

    const res = await fetch("http://localhost:3001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, message: input }),
    });

    const data = await res.json();
    setMessages(m => [...m, { role: "assistant", content: data.reply }]);
  }

  return (
    <div className="chat">
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.content}
          </div>
        ))}
      </div>
      <div className="input">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}
