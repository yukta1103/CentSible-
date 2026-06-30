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

Your personality:
- Sweet and caring, but never sugarcoat the truth
- If someone is overspending, tell them clearly with exact numbers
- If they can't afford something, say so directly — don't soften it
- Concise — never give walls of text
- Always back advice with real numbers from the tools
- Use the user's currency symbol when mentioning amounts

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

def chat(message: str) -> str:
    """Main entry point for chat — called by FastAPI"""
    result = agent.invoke({"messages": [HumanMessage(content=message)]})
    return result["messages"][-1].content