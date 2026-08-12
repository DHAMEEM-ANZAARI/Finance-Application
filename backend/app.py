
import os
from flask import Flask, jsonify
from flask_cors import CORS

from models import db

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.environ.get("FINANCE_APP_SECRET", "dev-secret-change-me")
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(BASE_DIR, "finance.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    CORS(app) 
    db.init_app(app)

    from routes_auth import auth_bp
    from routes_transactions import tx_bp
    from routes_reports import reports_bp
    from routes_budgets import budgets_bp
    from routes_backup import backup_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(tx_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(budgets_bp)
    app.register_blueprint(backup_bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"}), 200

    @app.errorhandler(404)
    def not_found(_e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(_e):
        return jsonify({"error": "Internal server error"}), 500

    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
