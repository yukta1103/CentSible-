from langchain_core.tools import tool
from sqlalchemy.orm import Session
from datetime import datetime
import calendar

from database import SessionLocal
from database import Budget, Transaction

def get_db_session():
    return SessionLocal()

# ─── Tool 1: Analyze Spending ─────────────────────────────
@tool
def analyze_spending(dummy: str = "") -> dict:
    """Analyze the user's current spending breakdown by category and overall budget usage."""
    db = get_db_session()
    try:
        budget = db.query(Budget).order_by(Budget.id.desc()).first()
        if not budget:
            return {"error": "No budget set up yet."}

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

        return {
            "monthly_income": budget.monthly_income,
            "currency": budget.currency,
            "total_spent": round(total_spent, 2),
            "remaining": round(remaining, 2),
            "percent_used": round(percent_used, 1),
            "days_left": days_left,
            "daily_budget_remaining": round(remaining / days_left, 2),
            "by_category": {k: round(v, 2) for k, v in by_category.items()},
        }
    finally:
        db.close()

# ─── Tool 2: Forecast Budget ──────────────────────────────
@tool
def forecast_budget(dummy: str = "") -> dict:
    """Forecast whether the user will run out of money before the end of the month based on current spending rate."""
    db = get_db_session()
    try:
        budget = db.query(Budget).order_by(Budget.id.desc()).first()
        if not budget:
            return {"error": "No budget set up yet."}

        transactions = db.query(Transaction).all()
        if not transactions:
            return {"message": "No transactions yet to forecast from."}

        today = datetime.now()
        days_passed = max(1, today.day)
        _, last_day = calendar.monthrange(today.year, today.month)
        days_left = max(1, last_day - today.day)

        total_spent = sum(t.amount for t in transactions)
        daily_rate = total_spent / days_passed
        projected_total = daily_rate * last_day
        projected_remaining = budget.monthly_income - projected_total

        return {
            "currency": budget.currency,
            "daily_spending_rate": round(daily_rate, 2),
            "projected_total_spend": round(projected_total, 2),
            "projected_remaining": round(projected_remaining, 2),
            "will_overspend": projected_total > budget.monthly_income,
            "days_left": days_left,
        }
    finally:
        db.close()

# ─── Tool 3: Suggest Savings ──────────────────────────────
@tool
def suggest_savings(dummy: str = "") -> dict:
    """Suggest categories where the user can cut back based on their spending patterns."""
    db = get_db_session()
    try:
        budget = db.query(Budget).order_by(Budget.id.desc()).first()
        if not budget:
            return {"error": "No budget set up yet."}

        transactions = db.query(Transaction).all()
        if not transactions:
            return {"message": "No transactions yet to analyze."}

        total_spent = sum(t.amount for t in transactions)

        by_category = {}
        for t in transactions:
            by_category[t.category] = by_category.get(t.category, 0) + t.amount

        # Flag categories that are more than 15% of total spend
        suggestions = []
        for category, amount in by_category.items():
            percent = (amount / total_spent * 100) if total_spent > 0 else 0
            if percent > 15 and category.lower() not in ["rent"]:
                suggestions.append({
                    "category": category,
                    "amount_spent": round(amount, 2),
                    "percent_of_total": round(percent, 1),
                    "suggestion": f"You're spending {percent:.1f}% of your budget on {category}. Consider cutting back here."
                })

        return {
            "currency": budget.currency,
            "suggestions": suggestions if suggestions else [{"suggestion": "Your spending looks balanced! Keep it up."}]
        }
    finally:
        db.close()

# ─── Tool 4: Can I Afford This? ───────────────────────────
@tool
def can_i_afford(amount: float) -> dict:
    """Check if the user can afford a specific purchase given their remaining budget and days left."""
    db = get_db_session()
    try:
        budget = db.query(Budget).order_by(Budget.id.desc()).first()
        if not budget:
            return {"error": "No budget set up yet."}

        transactions = db.query(Transaction).all()
        total_spent = sum(t.amount for t in transactions)
        remaining = budget.monthly_income - total_spent

        today = datetime.now()
        _, last_day = calendar.monthrange(today.year, today.month)
        days_left = max(1, last_day - today.day)

        after_purchase = remaining - amount
        daily_left_after = after_purchase / days_left if days_left > 0 else 0

        return {
            "currency": budget.currency,
            "purchase_amount": amount,
            "remaining_before": round(remaining, 2),
            "remaining_after": round(after_purchase, 2),
            "daily_budget_after": round(daily_left_after, 2),
            "can_afford": after_purchase >= 0,
            "tight": 0 <= after_purchase < (budget.monthly_income * 0.1),
        }
    finally:
        db.close()

@tool
def find_cheaper_alternatives(category: str) -> dict:
    """Find cheaper alternatives for a spending category based on the user's location and spending habits."""
    db = get_db_session()
    try:
        budget = db.query(Budget).order_by(Budget.id.desc()).first()
        if not budget:
            return {"error": "No budget set up yet."}

        transactions = db.query(Transaction).filter(
            Transaction.category == category
        ).all()

        total_spent = sum(t.amount for t in transactions)
        avg_transaction = total_spent / len(transactions) if transactions else 0

        return {
            "category": category,
            "currency": budget.currency,
            "total_spent_this_month": round(total_spent, 2),
            "avg_transaction": round(avg_transaction, 2),
            "num_transactions": len(transactions),
        }
    finally:
        db.close()
        
TOOLS = [analyze_spending, forecast_budget, suggest_savings, can_i_afford, find_cheaper_alternatives]