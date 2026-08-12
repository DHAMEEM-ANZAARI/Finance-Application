"""
Step 4 — Budgeting
"""
from datetime import date
from sqlalchemy import extract

from flask import Blueprint, request, jsonify

from models import db, Budget, Transaction
from auth import login_required

budgets_bp = Blueprint("budgets_bp", __name__, url_prefix="/api/budgets")


@budgets_bp.get("")
@login_required
def list_budgets(current_user_id):
    month = request.args.get("month")  # optional "YYYY-MM" filter
    q = Budget.query.filter_by(user_id=current_user_id)
    if month:
        q = q.filter_by(month=month)
    return jsonify([b.to_dict() for b in q.all()]), 200


@budgets_bp.post("")
@login_required
def create_budget(current_user_id):
    data = request.get_json(silent=True) or {}
    category = (data.get("category") or "").strip()
    month = (data.get("month") or "").strip()
    limit_amount = data.get("limit_amount")

    if not category:
        return jsonify({"error": "category is required"}), 400
    if len(month) != 7 or month[4] != "-":
        return jsonify({"error": "month must be in YYYY-MM format"}), 400
    if not isinstance(limit_amount, (int, float)) or limit_amount <= 0:
        return jsonify({"error": "limit_amount must be a positive number"}), 400

    existing = Budget.query.filter_by(
        user_id=current_user_id, category=category, month=month
    ).first()
    if existing:
        return jsonify({"error": "Budget for this category/month already exists"}), 409

    budget = Budget(
        user_id=current_user_id,
        category=category,
        month=month,
        limit_amount=float(limit_amount),
    )
    db.session.add(budget)
    db.session.commit()
    return jsonify(budget.to_dict()), 201


@budgets_bp.put("/<int:budget_id>")
@login_required
def update_budget(current_user_id, budget_id):
    budget = Budget.query.filter_by(id=budget_id, user_id=current_user_id).first()
    if not budget:
        return jsonify({"error": "Budget not found"}), 404

    data = request.get_json(silent=True) or {}
    if "limit_amount" in data:
        limit_amount = data["limit_amount"]
        if not isinstance(limit_amount, (int, float)) or limit_amount <= 0:
            return jsonify({"error": "limit_amount must be a positive number"}), 400
        budget.limit_amount = float(limit_amount)

    db.session.commit()
    return jsonify(budget.to_dict()), 200


@budgets_bp.delete("/<int:budget_id>")
@login_required
def delete_budget(current_user_id, budget_id):
    budget = Budget.query.filter_by(id=budget_id, user_id=current_user_id).first()
    if not budget:
        return jsonify({"error": "Budget not found"}), 404

    db.session.delete(budget)
    db.session.commit()
    return jsonify({"message": "Budget deleted"}), 200


@budgets_bp.get("/status")
@login_required
def budget_status(current_user_id):
    """For each budget in the given month, compare against actual spend
    and flag any that are exceeded (or close to it)."""
    month = request.args.get("month") or date.today().strftime("%Y-%m")
    year, mon = (int(p) for p in month.split("-"))

    budgets = Budget.query.filter_by(user_id=current_user_id, month=month).all()

    spend_by_category = {}
    expenses = Transaction.query.filter(
        Transaction.user_id == current_user_id,
        Transaction.type == "expense",
        extract("year", Transaction.date) == year,
        extract("month", Transaction.date) == mon,
    ).all()
    for t in expenses:
        spend_by_category[t.category] = spend_by_category.get(t.category, 0.0) + t.amount

    status = []
    for b in budgets:
        spent = round(spend_by_category.get(b.category, 0.0), 2)
        percent_used = round((spent / b.limit_amount) * 100, 1) if b.limit_amount else 0
        status.append({
            "category": b.category,
            "month": b.month,
            "limit_amount": b.limit_amount,
            "spent": spent,
            "remaining": round(b.limit_amount - spent, 2),
            "percent_used": percent_used,
            "exceeded": spent > b.limit_amount,
        })

    return jsonify(status), 200
