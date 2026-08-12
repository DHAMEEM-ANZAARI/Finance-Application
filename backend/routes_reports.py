"""
Step 3 — Financial Reports
"""
from datetime import date
from sqlalchemy import extract, func

from flask import Blueprint, request, jsonify

from models import db, Transaction
from auth import login_required

reports_bp = Blueprint("reports_bp", __name__, url_prefix="/api/reports")


def _summary(query):
    income = 0.0
    expense = 0.0
    by_category = {}

    for t in query:
        if t.type == "income":
            income += t.amount
        else:
            expense += t.amount
            by_category[t.category] = by_category.get(t.category, 0.0) + t.amount

    return {
        "total_income": round(income, 2),
        "total_expense": round(expense, 2),
        "savings": round(income - expense, 2),
        "expense_by_category": {k: round(v, 2) for k, v in by_category.items()},
    }


@reports_bp.get("/monthly")
@login_required
def monthly_report(current_user_id):
    year = request.args.get("year", type=int) or date.today().year
    month = request.args.get("month", type=int) or date.today().month

    items = Transaction.query.filter(
        Transaction.user_id == current_user_id,
        extract("year", Transaction.date) == year,
        extract("month", Transaction.date) == month,
    ).all()

    result = _summary(items)
    result.update({"year": year, "month": month})
    return jsonify(result), 200


@reports_bp.get("/yearly")
@login_required
def yearly_report(current_user_id):
    year = request.args.get("year", type=int) or date.today().year

    items = Transaction.query.filter(
        Transaction.user_id == current_user_id,
        extract("year", Transaction.date) == year,
    ).all()

    result = _summary(items)
    result["year"] = year

    # Monthly breakdown within the year
    monthly = {m: {"income": 0.0, "expense": 0.0} for m in range(1, 13)}
    for t in items:
        bucket = monthly[t.date.month]
        if t.type == "income":
            bucket["income"] += t.amount
        else:
            bucket["expense"] += t.amount
    result["monthly_breakdown"] = {
        m: {"income": round(v["income"], 2), "expense": round(v["expense"], 2)}
        for m, v in monthly.items()
    }
    return jsonify(result), 200
