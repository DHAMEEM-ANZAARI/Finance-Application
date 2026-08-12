"""
Step 5 — Data Persistence: backup & restore the SQLite database file.
"""
import os
import shutil
from datetime import datetime

from flask import Blueprint, current_app, jsonify, request, send_file

from auth import login_required

backup_bp = Blueprint("backup_bp", __name__, url_prefix="/api/backup")

BACKUP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backups")


def _db_path():
    uri = current_app.config["SQLALCHEMY_DATABASE_URI"]
    # sqlite:///relative/path.db  or sqlite:////absolute/path.db
    return uri.replace("sqlite:///", "", 1)


@backup_bp.post("")
@login_required
def create_backup(current_user_id):
    os.makedirs(BACKUP_DIR, exist_ok=True)
    db_path = _db_path()
    if not os.path.exists(db_path):
        return jsonify({"error": "Database file not found"}), 404

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    backup_name = f"finance_backup_{timestamp}.db"
    backup_path = os.path.join(BACKUP_DIR, backup_name)
    shutil.copy2(db_path, backup_path)

    return jsonify({"message": "Backup created", "file": backup_name}), 201


@backup_bp.get("")
@login_required
def list_backups(current_user_id):
    if not os.path.isdir(BACKUP_DIR):
        return jsonify([]), 200
    files = sorted(os.listdir(BACKUP_DIR), reverse=True)
    return jsonify(files), 200


@backup_bp.get("/<path:filename>/download")
@login_required
def download_backup(current_user_id, filename):
    path = os.path.join(BACKUP_DIR, os.path.basename(filename))
    if not os.path.exists(path):
        return jsonify({"error": "Backup file not found"}), 404
    return send_file(path, as_attachment=True)


@backup_bp.post("/restore")
@login_required
def restore_backup(current_user_id):
    data = request.get_json(silent=True) or {}
    filename = data.get("file")
    if not filename:
        return jsonify({"error": "file is required"}), 400

    backup_path = os.path.join(BACKUP_DIR, os.path.basename(filename))
    if not os.path.exists(backup_path):
        return jsonify({"error": "Backup file not found"}), 404

    db_path = _db_path()
    # Safety copy of current state before overwriting, in case restore is a mistake
    safety_path = db_path + ".before_restore"
    shutil.copy2(db_path, safety_path)
    shutil.copy2(backup_path, db_path)

    return jsonify({"message": f"Database restored from {filename}"}), 200
