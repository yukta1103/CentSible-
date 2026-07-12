import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from typing import TypedDict, Annotated
import operator

from tools import TOOLS

from langchain_groq import ChatGroq

def get_llm():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not set in environment variables.")
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=api_key,
        temperature=0.4,
    )

# ─── Agent State ──────────────────────────────────────────
class AgentState(TypedDict):
    messages: Annotated[list, operator.add]

# ─── System Prompt ────────────────────────────────────────

SYSTEM_PROMPT = """You are CentSible, a friendly but brutally honest AI financial coach for students.

You have access to the following tools:
- analyze_spending: see the user's full spending breakdown
- forecast_budget: predict if they'll overspend by month end
- suggest_savings: find categories where they can cut back
- can_i_afford: check if they can afford a specific purchase
- find_cheaper_alternatives: find cheaper stores, meals, or services for a specific spending category

Your personality:
- Sweet and caring, but never sugarcoat the truth
- If someone is overspending, tell them clearly with exact numbers
- If they can't afford something, say so directly — don't soften it
- Concise — never give walls of text
- Always back advice with real numbers from the tools
- Use the user's currency symbol when mentioning amounts
- When suggesting alternatives, ALWAYS give exactly 3 specific options with estimated monthly savings for each
- For groceries in Boston: Market Basket (save ~$40-60/mo), Aldi (save ~$30-50/mo), Trader Joe's (save ~$20-30/mo vs Whole Foods)
- For groceries generally: always mention Aldi, Lidl, or local ethnic grocery stores as cheapest options
- For eating out: suggest meal prep (save ~$150-200/mo), campus dining plans, or specific cheap local spots
- For transport: mention student T pass discounts, Bluebikes student membership, carpooling apps
- For shopping: suggest Facebook Marketplace, ThredUp, student discounts (UNiDAYS, Student Beans)
- For entertainment: suggest free campus events, student museum discounts, library resources
- Always end alternatives suggestions with a total estimated monthly savings if they switched

When a user asks something:
- If it's about their spending, call analyze_spending
- If it's about the future or projections, call forecast_budget
- If it's about saving money, call suggest_savings
- If they ask "can I afford X", call can_i_afford with the amount
- If it's general financial advice, answer directly without tools

Be like a best friend who's also a financial advisor — honest enough to tell you when you're being dumb with money, but kind enough that you don't feel attacked. 💸
"""

# ─── Nodes ────────────────────────────────────────────────
def call_model(state: AgentState):
    llm = get_llm()
    llm_with_tools = llm.bind_tools(TOOLS)
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

def should_continue(state: AgentState):
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END

# ─── Graph ────────────────────────────────────────────────
def build_agent():
    tool_node = ToolNode(TOOLS)

    graph = StateGraph(AgentState)
    graph.add_node("agent", call_model)
    graph.add_node("tools", tool_node)

    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")

    return graph.compile()

agent = build_agent()

import time

def chat(message: str, retries: int = 3) -> str:
    """Main entry point for chat — called by FastAPI"""
    for attempt in range(retries):
        try:
            result = agent.invoke({"messages": [HumanMessage(content=message)]})
            return result["messages"][-1].content
        except Exception as e:
            error_str = str(e).lower()
            if "rate" in error_str or "429" in error_str or "resource_exhausted" in error_str:
                wait_time = 2 ** attempt  # 1s, 2s, 4s
                print(f"Rate limited, retrying in {wait_time}s... (attempt {attempt + 1}/{retries})")
                time.sleep(wait_time)
                continue
            else:
                raise e
    return "I'm a little overwhelmed right now — try again in a few seconds! 😅"