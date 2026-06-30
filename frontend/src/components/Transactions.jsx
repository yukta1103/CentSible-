// import { useState, useEffect } from "react";

// const CURRENCY_SYMBOLS = {
//   USD: "$", INR: "₹", EUR: "€", GBP: "£",
//   CAD: "C$", AUD: "A$", SGD: "S$", JPY: "¥",
// };

// export default function Transactions({ API, budget }) {
//   const [transactions, setTransactions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showForm, setShowForm] = useState(false);
//   const [form, setForm] = useState({
//     merchant: "",
//     amount: "",
//     category: budget.categories[0] || "Other",
//     description: "",
//     date: new Date().toISOString().split("T")[0],
//   });
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState("");
//   const symbol = CURRENCY_SYMBOLS[budget.currency] || budget.currency;

//   const fetchTransactions = () => {
//     fetch(`${API}/api/transactions`)
//       .then((r) => r.json())
//       .then((data) => setTransactions(Array.isArray(data) ? data : []))
//       .catch(() => {})
//       .finally(() => setLoading(false));
//   };

//   useEffect(() => {
//     fetchTransactions();
//   }, []);

//   const handleSubmit = async () => {
//     if (!form.merchant.trim()) { setError("Merchant name is required."); return; }
//     if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) {
//       setError("Please enter a valid amount."); return;
//     }
//     setSubmitting(true);
//     setError("");
//     try {
//       const res = await fetch(`${API}/api/transactions`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           ...form,
//           amount: parseFloat(form.amount),
//         }),
//       });
//       const data = await res.json();
//       if (data.id) {
//         setTransactions([data, ...transactions]);
//         setForm({
//           merchant: "",
//           amount: "",
//           category: budget.categories[0] || "Other",
//           description: "",
//           date: new Date().toISOString().split("T")[0],
//         });
//         setShowForm(false);
//       } else {
//         setError("Failed to add transaction.");
//       }
//     } catch {
//       setError("Could not connect to server.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     try {
//       await fetch(`${API}/api/transactions/${id}`, { method: "DELETE" });
//       setTransactions(transactions.filter((t) => t.id !== id));
//     } catch {}
//   };

//   return (
//     <div className="transactions">

//       {/* ── Header ── */}
//       <div className="section-header">
//         <h3>Transactions</h3>
//         <button className="btn-primary small" onClick={() => setShowForm(!showForm)}>
//           {showForm ? "Cancel" : "+ Add Transaction"}
//         </button>
//       </div>

//       {/* ── Add Form ── */}
//       {showForm && (
//         <div className="form-card">
//           <div className="form-row">
//             <div className="form-field">
//               <label className="field-label">Merchant</label>
//               <input
//                 className="input"
//                 placeholder="e.g. Whole Foods"
//                 value={form.merchant}
//                 onChange={(e) => setForm({ ...form, merchant: e.target.value })}
//               />
//             </div>
//             <div className="form-field">
//               <label className="field-label">Amount ({symbol})</label>
//               <input
//                 className="input"
//                 type="number"
//                 placeholder="e.g. 45.00"
//                 value={form.amount}
//                 onChange={(e) => setForm({ ...form, amount: e.target.value })}
//               />
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-field">
//               <label className="field-label">Category</label>
//               <select
//                 className="input"
//                 value={form.category}
//                 onChange={(e) => setForm({ ...form, category: e.target.value })}
//               >
//                 {budget.categories.map((cat) => (
//                   <option key={cat} value={cat}>{cat}</option>
//                 ))}
//               </select>
//             </div>
//             <div className="form-field">
//               <label className="field-label">Date</label>
//               <input
//                 className="input"
//                 type="date"
//                 value={form.date}
//                 onChange={(e) => setForm({ ...form, date: e.target.value })}
//               />
//             </div>
//           </div>

//           <div className="form-field">
//             <label className="field-label">Description (optional)</label>
//             <input
//               className="input"
//               placeholder="Any notes..."
//               value={form.description}
//               onChange={(e) => setForm({ ...form, description: e.target.value })}
//             />
//           </div>

//           {error && <p className="error">{error}</p>}

//           <button
//             className="btn-primary"
//             onClick={handleSubmit}
//             disabled={submitting}
//           >
//             {submitting ? "Adding..." : "Add Transaction ✓"}
//           </button>
//         </div>
//       )}

//       {/* ── Transaction List ── */}
//       {loading ? (
//         <div className="loading">Loading transactions...</div>
//       ) : transactions.length === 0 ? (
//         <div className="empty-state">
//           <p>No transactions yet.</p>
//           <p className="empty-hint">Add your first one to start tracking!</p>
//         </div>
//       ) : (
//         <div className="tx-list">
//           {transactions.map((tx) => (
//             <div key={tx.id} className="tx-row">
//               <div className="tx-left">
//                 <span className="tx-merchant">{tx.merchant}</span>
//                 <span className="tx-meta">{tx.category} · {tx.date}</span>
//                 {tx.description && <span className="tx-desc">{tx.description}</span>}
//               </div>
//               <div className="tx-right">
//                 <span className="tx-amount">{symbol}{tx.amount.toLocaleString()}</span>
//                 <button
//                   className="btn-delete"
//                   onClick={() => handleDelete(tx.id)}
//                 >×</button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect } from "react";

const CURRENCY_SYMBOLS = {
  USD: "$", INR: "₹", EUR: "€", GBP: "£",
  CAD: "C$", AUD: "A$", SGD: "S$", JPY: "¥",
};

export default function Transactions({ API, budget }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [form, setForm] = useState({
    merchant: "",
    amount: "",
    category: budget.categories[0] || "Other",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const symbol = CURRENCY_SYMBOLS[budget.currency] || budget.currency;

  const fetchTransactions = () => {
    fetch(`${API}/api/transactions`)
      .then((r) => r.json())
      .then((data) => setTransactions(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleScanReceipt = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScanning(true);
    setScanError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API}/api/scan-receipt`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Scan failed");

      const data = await res.json();

      setForm({
        merchant: data.merchant || "",
        amount: data.amount?.toString() || "",
        category: data.category || budget.categories[0] || "Other",
        description: "Scanned from receipt 🧾",
        date: data.date || new Date().toISOString().split("T")[0],
      });
      setShowForm(true);
    } catch (err) {
      setScanError("Couldn't read receipt. Try a clearer photo or fill in manually.");
    } finally {
      setScanning(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!form.merchant.trim()) { setError("Merchant name is required."); return; }
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) {
      setError("Please enter a valid amount."); return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      const data = await res.json();
      if (data.id) {
        setTransactions([data, ...transactions]);
        setForm({
          merchant: "",
          amount: "",
          category: budget.categories[0] || "Other",
          description: "",
          date: new Date().toISOString().split("T")[0],
        });
        setShowForm(false);
      } else {
        setError("Failed to add transaction.");
      }
    } catch {
      setError("Could not connect to server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API}/api/transactions/${id}`, { method: "DELETE" });
      setTransactions(transactions.filter((t) => t.id !== id));
    } catch {}
  };

  return (
    <div className="transactions">

      {/* ── Header ── */}
      <div className="section-header">
        <h3>Transactions</h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {/* Receipt scan button */}
          <label className="btn-secondary small" style={{ cursor: "pointer", padding: "0.4rem 1rem", fontSize: "0.85rem" }}>
            {scanning ? "Scanning... 🔍" : "📸 Scan Receipt"}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleScanReceipt}
              disabled={scanning}
            />
          </label>
          <button className="btn-primary small" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Add Transaction"}
          </button>
        </div>
      </div>

      {scanError && <p className="error">{scanError}</p>}

      {/* ── Add Form ── */}
      {showForm && (
        <div className="form-card">
          {form.description === "Scanned from receipt 🧾" && (
            <div className="scan-success-banner">
              🧾 Receipt scanned! Review and confirm the details below.
            </div>
          )}
          <div className="form-row">
            <div className="form-field">
              <label className="field-label">Merchant</label>
              <input
                className="input"
                placeholder="e.g. Whole Foods"
                value={form.merchant}
                onChange={(e) => setForm({ ...form, merchant: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label className="field-label">Amount ({symbol})</label>
              <input
                className="input"
                type="number"
                placeholder="e.g. 45.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="field-label">Category</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {budget.categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="field-label">Date</label>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-field">
            <label className="field-label">Description (optional)</label>
            <input
              className="input"
              placeholder="Any notes..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Adding..." : "Add Transaction ✓"}
          </button>
        </div>
      )}

      {/* ── Transaction List ── */}
      {loading ? (
        <div className="loading">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions yet.</p>
          <p className="empty-hint">Add your first one to start tracking!</p>
        </div>
      ) : (
        <div className="tx-list">
          {transactions.map((tx) => (
            <div key={tx.id} className="tx-row">
              <div className="tx-left">
                <span className="tx-merchant">{tx.merchant}</span>
                <span className="tx-meta">{tx.category} · {tx.date}</span>
                {tx.description && <span className="tx-desc">{tx.description}</span>}
              </div>
              <div className="tx-right">
                <span className="tx-amount">{symbol}{tx.amount.toLocaleString()}</span>
                <button className="btn-delete" onClick={() => handleDelete(tx.id)}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}