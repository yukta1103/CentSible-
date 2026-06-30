import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from dotenv import load_dotenv
load_dotenv()

from database import get_db, init_db, Budget, Transaction
from schemas import (
    BudgetSetup, BudgetUpdate, BudgetResponse,
    TransactionCreate, TransactionResponse,
    ChatRequest, ChatResponse,
    SpendingSummary
)
from agent import chat as agent_chat
import calendar

# ─── App Setup ────────────────────────────────────────────
app = FastAPI(title="CentSible API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

# ─── Budget ───────────────────────────────────────────────
@app.post("/api/budget", response_model=BudgetResponse)
def setup_budget(data: BudgetSetup, db: Session = Depends(get_db)):
    existing = db.query(Budget).first()
    if existing:
        existing.monthly_income = data.monthly_income
        existing.currency = data.currency
        existing.categories = data.categories
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    budget = Budget(
        monthly_income=data.monthly_income,
        currency=data.currency,
        categories=data.categories,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget

@app.get("/api/budget", response_model=BudgetResponse)
def get_budget(db: Session = Depends(get_db)):
    budget = db.query(Budget).order_by(Budget.id.desc()).first()
    if not budget:
        raise HTTPException(status_code=404, detail="No budget found. Please set up your budget first.")
    return budget

# ─── Transactions ─────────────────────────────────────────
@app.post("/api/transactions", response_model=TransactionResponse)
def add_transaction(data: TransactionCreate, db: Session = Depends(get_db)):
    transaction = Transaction(
        merchant=data.merchant,
        amount=data.amount,
        category=data.category,
        description=data.description,
        date=data.date or datetime.utcnow().strftime("%Y-%m-%d"),
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

@app.get("/api/transactions", response_model=List[TransactionResponse])
def get_transactions(db: Session = Depends(get_db)):
    return db.query(Transaction).order_by(Transaction.date.desc()).all()

@app.delete("/api/transactions/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    db.delete(transaction)
    db.commit()
    return {"message": "Transaction deleted."}

# ─── Summary ──────────────────────────────────────────────
@app.get("/api/summary", response_model=SpendingSummary)
def get_summary(db: Session = Depends(get_db)):
    budget = db.query(Budget).order_by(Budget.id.desc()).first()
    if not budget:
        raise HTTPException(status_code=404, detail="No budget found.")

    transactions = db.query(Transaction).all()
    total_spent = sum(t.amount for t in transactions)
    remaining = budget.monthly_income - total_spent
    percent_used = (total_spent / budget.monthly_income * 100) if budget.monthly_income > 0 else 0

    by_category = {}
    for t in transactions:
        by_category[t.category] = by_category.get(t.category, 0) + t.amount

    today = datetime.now()
    _, last_day = calendar.monthrange(today.year, today.month)
    days_left = max(1, last_day - today.day)

    return SpendingSummary(
        total_spent=round(total_spent, 2),
        remaining=round(remaining, 2),
        percent_used=round(percent_used, 1),
        days_left=days_left,
        daily_budget_remaining=round(remaining / days_left, 2) if days_left > 0 else 0,
        by_category={k: round(v, 2) for k, v in by_category.items()},
        currency=budget.currency,
    )

# ─── Chat ─────────────────────────────────────────────────
@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    try:
        response = agent_chat(request.message)
        return ChatResponse(response=response)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))