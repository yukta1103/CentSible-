import os
import base64
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
# @app.post("/api/chat", response_model=ChatResponse)
# def chat_endpoint(request: ChatRequest):
#     try:
#         response = agent_chat(request.message)
#         return ChatResponse(response=response)
#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat", response_model=None)
def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        # First check if this is a "log transaction" message
        import re
        msg = request.message.lower()
        
        # Simple pattern: "spent $X on Y" or "paid $X at Y" or "bought Y for $X"
        amount_match = re.search(r'\$?(\d+(?:\.\d{1,2})?)', request.message)
        is_logging = any(word in msg for word in [
            "spent", "paid", "bought", "purchased", "ordered", "got"
        ])

        if is_logging and amount_match:
            # Ask agent to parse and respond
            response = agent_chat(request.message + 
                "\n[If this is a spending log, extract: merchant name, amount, and best matching category from: Rent, Groceries, Transport, Eating Out, Entertainment, Shopping, Health, Other. Reply normally AND include at the very end a JSON block like: TRANSACTION_JSON:{\"merchant\":\"...\",\"amount\":0.0,\"category\":\"...\"}]"
            )
            
            # Try to extract transaction JSON from response
            import json
            tx_match = re.search(r'TRANSACTION_JSON:(\{.*?\})', response, re.DOTALL)
            if tx_match:
                try:
                    tx_data = json.loads(tx_match.group(1))
                    tx_data["date"] = datetime.utcnow().strftime("%Y-%m-%d")
                    
                    # Save to DB
                    transaction = Transaction(
                        merchant=tx_data.get("merchant", "Unknown"),
                        amount=float(tx_data.get("amount", 0)),
                        category=tx_data.get("category", "Other"),
                        date=tx_data["date"],
                    )
                    db.add(transaction)
                    db.commit()

                    # Clean response
                    clean_response = re.sub(r'TRANSACTION_JSON:\{.*?\}', '', response, flags=re.DOTALL).strip()
                    return {
                        "response": clean_response,
                        "transaction_logged": tx_data
                    }
                except:
                    pass

        # Normal chat
        response = agent_chat(request.message)
        return {"response": response}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
    
    import base64
from fastapi import UploadFile, File

@app.post("/api/scan-receipt")
async def scan_receipt(file: UploadFile = File(...)):
    try:
        # Read and encode image
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode("utf-8")
        media_type = file.content_type or "image/jpeg"

        # Use Groq vision
        from groq import Groq
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{media_type};base64,{base64_image}"
                            }
                        },
                        {
                            "type": "text",
                            "text": """Extract transaction details from this receipt. 
Reply ONLY with a valid JSON object, nothing else:
{
  "merchant": "store name here",
  "amount": 0.00,
  "category": "one of: Rent, Groceries, Transport, Eating Out, Entertainment, Shopping, Health, Other",
  "date": "YYYY-MM-DD or empty string if not found"
}"""
                        }
                    ]
                }
            ],
            max_tokens=200,
        )

        raw = response.choices[0].message.content.strip()
        
        # Clean and parse JSON
        import re, json
        json_match = re.search(r'\{.*?\}', raw, re.DOTALL)
        if not json_match:
            raise ValueError("No JSON found in response")
        
        data = json.loads(json_match.group())
        
        # Set today's date if not found
        if not data.get("date"):
            data["date"] = datetime.utcnow().strftime("%Y-%m-%d")

        return data

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
    
@app.delete("/api/transactions")
def clear_all_transactions(db: Session = Depends(get_db)):
    db.query(Transaction).delete()
    db.commit()
    return {"message": "All transactions cleared."}

@app.post("/api/budget/suggest")
def suggest_budget(data: dict, db: Session = Depends(get_db)):
    try:
        income = data.get("monthly_income", 1000)
        city = data.get("city", "")
        currency = data.get("currency", "USD")

        from groq import Groq
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": f"""You are a financial advisor for college students.
A student has a monthly income/budget of {income} {currency} and lives in {city if city else "a typical US city"}.

Suggest a realistic monthly budget allocation for a college student.
Reply ONLY with a valid JSON object, nothing else, no explanation:
{{
  "Rent": 0,
  "Groceries": 0,
  "Eating Out": 0,
  "Transport": 0,
  "Entertainment": 0,
  "Health": 0,
  "Shopping": 0,
  "Savings": 0,
  "Other": 0
}}

Rules:
- All values must be realistic dollar amounts (not percentages)
- All values must add up to exactly {income}
- Rent should reflect actual costs in {city if city else "a typical US city"}
- Savings should be at least 5% of income
- Be realistic for a college student lifestyle
"""
                }
            ],
            max_tokens=300,
        )

        raw = response.choices[0].message.content.strip()

        import re, json
        json_match = re.search(r'\{.*?\}', raw, re.DOTALL)
        if not json_match:
            raise ValueError("No JSON found")

        allocation = json.loads(json_match.group())

        # Calculate percentages
        result = []
        for category, amount in allocation.items():
            result.append({
                "category": category,
                "amount": round(float(amount), 2),
                "percent": round(float(amount) / income * 100, 1)
            })

        return {"allocations": result, "total": income, "currency": currency}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
    
@app.delete("/api/budget")
def reset_budget(db: Session = Depends(get_db)):
    db.query(Transaction).delete()
    db.query(Budget).delete()
    db.commit()
    return {"message": "Budget and transactions reset."}