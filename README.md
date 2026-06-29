# 💰 CentSible — AI Financial Coach for Students

> A conversational AI-powered budgeting app that helps students manage their finances smarter. Not just a tracker — a coach.

![Python](https://img.shields.io/badge/Python-3.10+-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green) ![LangGraph](https://img.shields.io/badge/LangGraph-0.1+-purple) ![React](https://img.shields.io/badge/React-18+-61DAFB) ![Gemini](https://img.shields.io/badge/Gemini-1.5--Flash-orange)

---

## ✨ What It Does

CentSible is a full-stack AI financial coaching app built for students. Instead of just showing you a pie chart of your spending, it reasons over your data and talks to you like a financially savvy friend.

- 📊 **Dashboard** — real-time budget usage, category breakdown, daily spending allowance
- 💳 **Transactions** — log and manage expenses with custom categories
- 🤖 **AI Coach** — conversational agent powered by Gemini 1.5 Flash + LangGraph that can:
  - Analyze your spending patterns
  - Forecast if you'll run out of money before month end
  - Suggest where to cut back
  - Answer "can I afford this?" questions with real numbers
- 🌍 **Multi-currency** — supports USD, INR, EUR, GBP, CAD, AUD, SGD, JPY

---

## 🏗️ Architecture

```
centsible/
├── backend/
│   ├── main.py         # FastAPI app — all REST endpoints
│   ├── agent.py        # LangGraph agent with Gemini 1.5 Flash
│   ├── tools.py        # Agent tools: analyze, forecast, suggest, afford-check
│   ├── database.py     # SQLite + SQLAlchemy models
│   └── schemas.py      # Pydantic request/response schemas
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BudgetSetup.jsx    # Onboarding: income, currency, categories
│   │   │   ├── Dashboard.jsx      # Spending overview + progress bars
│   │   │   ├── Transactions.jsx   # Add/view/delete transactions
│   │   │   └── Chat.jsx           # Conversational AI interface
│   │   ├── App.jsx
│   │   └── index.css
└── README.md
```

### Agent Tools

| Tool | Description |
|---|---|
| `analyze_spending` | Full breakdown of spending by category and budget usage |
| `forecast_budget` | Projects total spend by month end based on daily rate |
| `suggest_savings` | Flags high-spend categories and recommends cuts |
| `can_i_afford` | Checks if a purchase is feasible given remaining budget |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A free [Gemini API key](https://makersuite.google.com/app/apikey)

---

### 1. Clone the repo

```bash
git clone https://github.com/yukta1103/CentSible.git
cd CentSible
```

---

### 2. Backend Setup

```bash
cd backend
pip install fastapi uvicorn sqlalchemy pydantic langchain-core langchain-google-genai langgraph
```

Create a `.env` file in the `backend/` folder:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend:

```bash
uvicorn main:app --reload
```

The API will be live at `http://localhost:8000`. You can explore the auto-generated docs at `http://localhost:8000/docs`.

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`.

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Free Gemini API key from Google AI Studio |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/budget` | Set up or update monthly budget |
| `GET` | `/api/budget` | Get current budget |
| `POST` | `/api/transactions` | Add a new transaction |
| `GET` | `/api/transactions` | Get all transactions |
| `DELETE` | `/api/transactions/{id}` | Delete a transaction |
| `GET` | `/api/summary` | Get full spending summary |
| `POST` | `/api/chat` | Send a message to the AI coach |

---

## 💬 Example AI Interactions

> **"Will I run out of money before the end of the month?"**
> → Agent calls `forecast_budget`, calculates your daily spending rate, projects total spend, and tells you exactly how tight things are.

> **"Can I afford a $80 concert ticket?"**
> → Agent calls `can_i_afford(80)`, checks remaining budget and days left, tells you your post-purchase daily allowance.

> **"Where am I overspending?"**
> → Agent calls `suggest_savings`, identifies categories above 30% of total spend, gives specific actionable cuts.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| LLM | Gemini 1.5 Flash (free tier) |
| Agent Framework | LangGraph |
| Backend | FastAPI + SQLAlchemy |
| Database | SQLite |
| Frontend | React 18 |
| Styling | Custom CSS (dark theme) |

---

## 🗺️ Roadmap

- [ ] Receipt photo scanning (OCR → auto-categorize)
- [ ] Monthly reports + export to PDF
- [ ] Savings goals tracker
- [ ] Deploy to Railway + Vercel

---

## 👩‍💻 Author

**Yukta Kasina**
MS Artificial Intelligence — Northeastern University

[Portfolio](https://yukta-portfolio-zeta.vercel.app) · [GitHub](https://github.com/yukta1103) · [LinkedIn](https://linkedin.com/in/yukta-kasina)