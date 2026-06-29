import { useState, useEffect } from "react";

const CURRENCY_SYMBOLS = {
  USD: "$", INR: "₹", EUR: "€", GBP: "£",
  CAD: "C$", AUD: "A$", SGD: "S$", JPY: "¥",
};

export default function Dashboard({ API, budget }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const symbol = CURRENCY_SYMBOLS[budget.currency] || budget.currency;

  useEffect(() => {
    fetch(`${API}/api/summary`)
      .then((r) => r.json())
      .then((data) => setSummary(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading your dashboard...</div>;
  if (!summary) return <div className="error">Could not load summary.</div>;

  const percent = Math.min(summary.percent_used, 100);
  const barColor =
    percent >= 90 ? "#ef4444" :
    percent >= 70 ? "#f59e0b" :
    "#22c55e";

  return (
    <div className="dashboard">

      {/* ── Top Cards ── */}
      <div className="cards-row">
        <div className="card">
          <p className="card-label">Monthly Budget</p>
          <p className="card-value">{symbol}{budget.monthly_income.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="card-label">Spent So Far</p>
          <p className="card-value spent">{symbol}{summary.total_spent.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="card-label">Remaining</p>
          <p className={`card-value ${summary.remaining < 0 ? "danger" : "safe"}`}>
            {symbol}{summary.remaining.toLocaleString()}
          </p>
        </div>
        <div className="card">
          <p className="card-label">Days Left</p>
          <p className="card-value">{summary.days_left} days</p>
        </div>
      </div>

      {/* ── Budget Progress Bar ── */}
      <div className="section">
        <div className="section-header">
          <h3>Budget Usage</h3>
          <span className="percent-label" style={{ color: barColor }}>
            {summary.percent_used}% used
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${percent}%`, backgroundColor: barColor }}
          />
        </div>
        <p className="progress-hint">
          {symbol}{summary.daily_budget_remaining.toLocaleString()} per day for the next {summary.days_left} days
        </p>
      </div>

      {/* ── Spending by Category ── */}
      <div className="section">
        <h3>Spending by Category</h3>
        {Object.keys(summary.by_category).length === 0 ? (
          <p className="empty-hint">No transactions yet. Add some to see your breakdown!</p>
        ) : (
          <div className="category-bars">
            {Object.entries(summary.by_category)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => {
                const pct = Math.min((amt / budget.monthly_income) * 100, 100);
                return (
                  <div key={cat} className="cat-row">
                    <div className="cat-meta">
                      <span className="cat-name">{cat}</span>
                      <span className="cat-amt">{symbol}{amt.toLocaleString()}</span>
                    </div>
                    <div className="cat-track">
                      <div
                        className="cat-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* ── Status Message ── */}
      <div className={`status-banner ${summary.remaining < 0 ? "danger" :
        summary.percent_used >= 80 ? "warning" : "good"}`}>
        {summary.remaining < 0
          ? `⚠️ You're over budget by ${symbol}${Math.abs(summary.remaining).toLocaleString()}!`
          : summary.percent_used >= 80
          ? `🔔 Heads up — you've used ${summary.percent_used}% of your budget.`
          : `✅ You're on track! ${symbol}${summary.remaining.toLocaleString()} left for ${summary.days_left} days.`}
      </div>

    </div>
  );
}