import { useState } from "react";

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
];

const DEFAULT_CATEGORIES = [
  "Rent", "Groceries", "Transport", "Eating Out",
  "Entertainment", "Shopping", "Health", "Other"
];

export default function BudgetSetup({ API, onComplete }) {
  const [step, setStep] = useState(1);
  const [income, setIncome] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol || "$";

  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setNewCategory("");
    }
  };

  const removeCategory = (cat) => {
    setCategories(categories.filter((c) => c !== cat));
  };

  const handleSubmit = async () => {
    if (!income || isNaN(income) || parseFloat(income) <= 0) {
      setError("Please enter a valid monthly budget.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly_income: parseFloat(income),
          currency,
          categories,
        }),
      });
      const data = await res.json();
      if (data.id) onComplete(data);
      else setError("Something went wrong. Please try again.");
    } catch {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-screen">
      <div className="setup-card">
        {/* Logo */}
        <div className="setup-logo">💰 CentSible</div>
        <p className="setup-subtitle">Let's set up your financial profile</p>

        {/* Step indicator */}
        <div className="steps">
          {[1, 2].map((s) => (
            <div key={s} className={`step-dot ${step >= s ? "active" : ""}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="setup-step">
            <h2>What's your monthly budget?</h2>
            <p className="step-hint">This could be your allowance, part-time income, or scholarship.</p>

            {/* Currency selector */}
            <label className="field-label">Currency</label>
            <select
              className="input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code} — {c.name}
                </option>
              ))}
            </select>

            {/* Income input */}
            <label className="field-label">Monthly Budget</label>
            <div className="input-prefix-wrapper">
              <span className="input-prefix">{symbol}</span>
              <input
                className="input with-prefix"
                type="number"
                placeholder="e.g. 1500"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button className="btn-primary" onClick={() => {
              if (!income || isNaN(income) || parseFloat(income) <= 0) {
                setError("Please enter a valid monthly budget.");
                return;
              }
              setError("");
              setStep(2);
            }}>
              Next →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="setup-step">
            <h2>Customize your categories</h2>
            <p className="step-hint">These are the spending buckets we'll track for you.</p>

            <div className="category-list">
              {categories.map((cat) => (
                <div key={cat} className="category-tag">
                  {cat}
                  <button
                    className="remove-cat"
                    onClick={() => removeCategory(cat)}
                  >×</button>
                </div>
              ))}
            </div>

            <div className="add-category-row">
              <input
                className="input"
                placeholder="Add custom category..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
              />
              <button className="btn-secondary" onClick={addCategory}>Add</button>
            </div>

            {error && <p className="error">{error}</p>}

            <div className="step-actions">
              <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? "Setting up..." : "Let's go! 🚀"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}