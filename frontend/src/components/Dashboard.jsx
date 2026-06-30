import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CURRENCY_SYMBOLS = {
  USD: "$", INR: "₹", EUR: "€", GBP: "£",
  CAD: "C$", AUD: "A$", SGD: "S$", JPY: "¥",
};

export default function Dashboard({ API, budget }) {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const symbol = CURRENCY_SYMBOLS[budget.currency] || budget.currency;

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/summary`).then(r => r.json()),
      fetch(`${API}/api/transactions`).then(r => r.json()),
    ])
      .then(([summaryData, txData]) => {
        setSummary(summaryData);
        setTransactions(Array.isArray(txData) ? txData : []);
      })
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

  // ── Build daily spending trend data ──
  const dailyMap = {};
  transactions.forEach(tx => {
    const day = tx.date?.slice(0, 10);
    if (day) dailyMap[day] = (dailyMap[day] || 0) + tx.amount;
  });

  const trendData = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({
      date: date.slice(5), // show MM-DD
      amount: Math.round(amount * 100) / 100,
    }));

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

      {/* ── Spending Trend Chart ── */}
      <div className="section">
        <h3>Daily Spending Trend</h3>
        {trendData.length === 0 ? (
          <p className="empty-hint">Add transactions to see your spending trend!</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#666", fontSize: 11 }}
                axisLine={{ stroke: "#2a2a35" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#666", fontSize: 11 }}
                axisLine={{ stroke: "#2a2a35" }}
                tickLine={false}
                tickFormatter={(v) => `${symbol}${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "#16161e",
                  border: "1px solid #2a2a35",
                  borderRadius: "8px",
                  color: "#f1f1f1",
                }}
                formatter={(value) => [`${symbol}${value}`, "Spent"]}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#7c6fff"
                strokeWidth={2.5}
                dot={{ fill: "#7c6fff", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
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
                      <div className="cat-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* ── Status Banner ── */}
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