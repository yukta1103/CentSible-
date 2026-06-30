import { useState, useRef, useEffect } from "react";

const SUGGESTED_PROMPTS = [
  "How am I doing with my budget this month?",
  "Where am I spending the most?",
  "Will I run out of money before the end of the month?",
  "Can I afford a $50 dinner this weekend?",
  "Where can I cut back?",
  "I spent $12 on coffee at Starbucks today",
];

export default function Chat({ API, budget }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hey! 👋 I'm CentSible, your AI financial coach. Ask me anything about your spending, or just tell me what you spent — like 'spent $12 on coffee at Starbucks' and I'll log it for you! 💰",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const logTransaction = async (tx) => {
    try {
      await fetch(`${API}/api/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tx),
      });
    } catch {}
  };

  const sendMessage = async (text) => {
    const message = text || input.trim();
    if (!message) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();

      // Check if agent logged a transaction
      if (data.transaction_logged) {
        const tx = data.transaction_logged;
        await logTransaction(tx);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response,
          },
          {
            role: "assistant",
            content: `✅ Logged: **${tx.merchant}** — $${tx.amount} (${tx.category})`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response || "Sorry, I couldn't process that." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Could not reach the server. Is the backend running?" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat">

      {/* ── Suggested Prompts ── */}
      <div className="suggested-prompts">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            className="prompt-chip"
            onClick={() => sendMessage(prompt)}
            disabled={loading}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* ── Messages ── */}
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.role === "assistant" && (
              <div className="avatar">💰</div>
            )}
            <div className="bubble">{msg.content}</div>
          </div>
        ))}

        {loading && (
          <div className="message assistant">
            <div className="avatar">💰</div>
            <div className="bubble typing">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="chat-input-row">
        <input
          className="chat-input"
          placeholder="Ask me anything, or say 'spent $20 at Walmart'..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
          disabled={loading}
        />
        <button
          className="btn-send"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
        >
          {loading ? "..." : "Send ➤"}
        </button>
      </div>

    </div>
  );
}