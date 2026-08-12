# Finance-Application

Tech stack: **Python (Flask) · SQL (SQLite) · React · HTML/CSS/JS (Vite)**.

```
finance-app/
├── backend/          Flask REST API + SQLite database
│   ├── app.py
│   ├── models.py
│   ├── auth.py
│   ├── routes_auth.py
│   ├── routes_transactions.py
│   ├── routes_reports.py
│   ├── routes_budgets.py
│   ├── routes_backup.py
│   └── requirements.txt
└── frontend/         React (Vite) single-page app
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx, api.js, main.jsx
        ├── components/  (AuthPage, Dashboard, TransactionsPage,
        │                 ReportsPage, BudgetsPage, DataPage)
        └── styles/index.css
```

## 1. Run the backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
python app.py
```
The API starts at **http://127.0.0.1:5000**. A `finance.db` SQLite file is
created automatically on first run — no setup needed.

## 2. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies all `/api/*`
requests to the Flask backend (see `vite.config.js`), so both must be
running at the same time.

## 3. Using the app

1. Register an account (username ≥ 3 chars, password ≥ 6 chars).
2. Add income/expense entries under **Transactions**.
3. View totals and category breakdowns under **Reports**.
4. Set monthly category limits under **Budgets** — entries turn red when
   you go over.
5. Snapshot or roll back your data under **Backup & Restore**.

## API summary

| Method | Endpoint                          | Purpose                     |
|--------|------------------------------------|------------------------------|
| POST   | `/api/auth/register`               | Create account               |
| POST   | `/api/auth/login`                  | Log in, get JWT              |
| GET    | `/api/transactions`                | List (filter by type/category/date) |
| POST   | `/api/transactions`                | Create entry                 |
| PUT    | `/api/transactions/<id>`           | Update entry                 |
| DELETE | `/api/transactions/<id>`           | Delete entry                 |
| GET    | `/api/reports/monthly?year&month`  | Monthly report               |
| GET    | `/api/reports/yearly?year`         | Yearly report                |
| GET    | `/api/budgets`                     | List budgets                 |
| POST   | `/api/budgets`                     | Create budget                |
| GET    | `/api/budgets/status?month`        | Spend vs. limit per category |
| POST   | `/api/backup`                      | Snapshot the database        |
| POST   | `/api/backup/restore`              | Restore from a snapshot      |

All endpoints except register/login require `Authorization: Bearer <token>`.

