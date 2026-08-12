"""
Step 1 — User Registration and Authentication
"""
from flask import Blueprint, request, jsonify

from models import db, User
from auth import hash_password, verify_password, create_token, login_required

auth_bp = Blueprint("auth_bp", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already taken"}), 409

    user = User(username=username, password_hash=hash_password(password))
    db.session.add(user)
    db.session.commit()

    token = create_token(user.id)
    return jsonify({"user": user.to_dict(), "token": token}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = User.query.filter_by(username=username).first()
    if not user or not verify_password(password, user.password_hash):
        return jsonify({"error": "Invalid username or password"}), 401

    token = create_token(user.id)
    return jsonify({"user": user.to_dict(), "token": token}), 200


@auth_bp.get("/me")
@login_required
def me(current_user_id):
    user = User.query.get_or_404(current_user_id)
    return jsonify({"user": user.to_dict()}), 200
