from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# ─── Budget ───────────────────────────────────────────────
class BudgetSetup(BaseModel):
    monthly_income: float
    currency: str = "USD"  # e.g. "USD", "INR", "EUR", "GBP"
    categories: List[str] = [
        "Rent", "Groceries", "Transport", "Eating Out",
        "Entertainment", "Shopping", "Health", "Other"
    ]

class BudgetUpdate(BaseModel):
    monthly_income: Optional[float] = None
    currency: Optional[str] = None
    categories: Optional[List[str]] = None

class BudgetResponse(BaseModel):
    id: int
    monthly_income: float
    currency: str
    categories: List[str]
    created_at: datetime
    updated_at: datetime

# ─── Transactions ─────────────────────────────────────────
class TransactionCreate(BaseModel):
    merchant: str
    amount: float
    category: str
    description: Optional[str] = None
    date: Optional[str] = None  # ISO format, defaults to today

class TransactionResponse(BaseModel):
    id: int
    merchant: str
    amount: float
    category: str
    description: Optional[str]
    date: str
    created_at: datetime

# ─── Chat ─────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    intent: Optional[str] = None  # e.g. "forecast", "analyze", "suggest"

# ─── Analytics ────────────────────────────────────────────
class SpendingSummary(BaseModel):
    total_spent: float
    remaining: float
    percent_used: float
    days_left: int
    daily_budget_remaining: float
    by_category: dict
    currency: str