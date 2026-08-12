"""
Step 2 — Income and Expense Tracking
"""
from datetime import date as date_cls

from flask import Blueprint, request, jsonify

from models import db, Transaction
from auth import login_required

tx_bp = Blueprint("tx_bp", __name__, url_prefix="/api/transactions")

VALID_TYPES = {"income", "expense"}


def _parse_date(value):
    if not value:
        return date_cls.today()
    try:
        return date_cls.fromisoformat(value)
    except ValueError:
        return None


@tx_bp.get("")
@login_required
def list_transactions(current_user_id):
    """Optional filters: type, category, start, end (ISO dates)."""
    q = Transaction.query.filter_by(user_id=current_user_id)

    tx_type = request.args.get("type")
    if tx_type in VALID_TYPES:
        q = q.filter_by(type=tx_type)

    category = request.args.get("category")
    if category:
        q = q.filter_by(category=category)

    start = request.args.get("start")
    end = request.args.get("end")
    if start:
        q = q.filter(Transaction.date >= start)
    if end:
        q = q.filter(Transaction.date <= end)

    items = q.order_by(Transaction.date.desc(), Transaction.id.desc()).all()
    return jsonify([t.to_dict() for t in items]), 200


@tx_bp.post("")
@login_required
def create_transaction(current_user_id):
    data = request.get_json(silent=True) or {}

    tx_type = data.get("type")
    category = (data.get("category") or "").strip()
    amount = data.get("amount")
    tx_date = _parse_date(data.get("date"))

    if tx_type not in VALID_TYPES:
        return jsonify({"error": "type must be 'income' or 'expense'"}), 400
    if not category:
        return jsonify({"error": "category is required"}), 400
    if not isinstance(amount, (int, float)) or amount <= 0:
        return jsonify({"error": "amount must be a positive number"}), 400
    if tx_date is None:
        return jsonify({"error": "date must be in YYYY-MM-DD format"}), 400

    transaction = Transaction(
        user_id=current_user_id,
        type=tx_type,
        category=category,
        amount=float(amount),
        date=tx_date,
    )
    db.session.add(transaction)
    db.session.commit()
    return jsonify(transaction.to_dict()), 201


@tx_bp.put("/<int:tx_id>")
@login_required
def update_transaction(current_user_id, tx_id):
    transaction = Transaction.query.filter_by(id=tx_id, user_id=current_user_id).first()
    if not transaction:
        return jsonify({"error": "Transaction not found"}), 404

    data = request.get_json(silent=True) or {}

    if "type" in data:
        if data["type"] not in VALID_TYPES:
            return jsonify({"error": "type must be 'income' or 'expense'"}), 400
        transaction.type = data["type"]

    if "category" in data:
        category = (data["category"] or "").strip()
        if not category:
            return jsonify({"error": "category cannot be empty"}), 400
        transaction.category = category

    if "amount" in data:
        amount = data["amount"]
        if not isinstance(amount, (int, float)) or amount <= 0:
            return jsonify({"error": "amount must be a positive number"}), 400
        transaction.amount = float(amount)

    if "date" in data:
        parsed = _parse_date(data["date"])
        if parsed is None:
            return jsonify({"error": "date must be in YYYY-MM-DD format"}), 400
        transaction.date = parsed

    db.session.commit()
    return jsonify(transaction.to_dict()), 200


@tx_bp.delete("/<int:tx_id>")
@login_required
def delete_transaction(current_user_id, tx_id):
    transaction = Transaction.query.filter_by(id=tx_id, user_id=current_user_id).first()
    if not transaction:
        return jsonify({"error": "Transaction not found"}), 404

    db.session.delete(transaction)
    db.session.commit()
    return jsonify({"message": "Transaction deleted"}), 200
