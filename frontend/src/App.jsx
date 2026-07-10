import { useState, useEffect } from "react";
import BudgetSetup from "./components/BudgetSetup";
import Dashboard from "./components/Dashboard";
import Transactions from "./components/Transactions";
import Chat from "./components/Chat";
import "./index.css";

const API = "http://localhost:8000";

export default function App() {
  const [budget, setBudget] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/budget`)
      .then((r) => r.json())
      .then((data) => {
        if (data.id) setBudget(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Loading CentSible...</p>
    </div>
  );

  if (!budget) return (
    <BudgetSetup
      API={API}
      onComplete={(b) => setBudget(b)}
    />
  );

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <span className="logo">💰 CentSible</span>
          <span className="tagline">your AI financial coach</span>
        </div>
        <div className="header-right">
          <span className="currency-badge">{budget.currency}</span>
          <span className="income-badge">
            Budget: {budget.monthly_income.toLocaleString()} {budget.currency}
          </span>
          <button
            className="btn-reset"
            onClick={async () => {
              if (!window.confirm("Reset everything and start over?")) return;
              await fetch(`${API}/api/budget`, { method: "DELETE" });
              window.location.reload();
            }}
          >
            ↺ Reset
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav className="nav">
        {["dashboard", "transactions", "chat"].map((tab) => (
          <button
            key={tab}
            className={`nav-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "dashboard" && "📊 Dashboard"}
            {tab === "transactions" && "💳 Transactions"}
            {tab === "chat" && "🤖 AI Coach"}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="main">
        {activeTab === "dashboard" && <Dashboard API={API} budget={budget} />}
        {activeTab === "transactions" && <Transactions API={API} budget={budget} />}
        {activeTab === "chat" && <Chat API={API} />}
      </main>
    </div>
  );
}