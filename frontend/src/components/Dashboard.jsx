import React, { useEffect, useState } from "react";
import { api } from "../api.js";

function money(n) {
  return (n < 0 ? "-" : "") + "$" + Math.abs(n).toFixed(2);
}

export default function Dashboard() {
  const [report, setReport] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const now = new Date();

  useEffect(() => {
    (async () => {
      try {
        const [monthly, txs] = await Promise.all([
          api.monthlyReport(now.getFullYear(), now.getMonth() + 1),
          api.listTransactions(),
        ]);
        setReport(monthly);
        setRecent(txs.slice(0, 6));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const monthLabel = now.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview for {monthLabel}</p>
      </div>

      {error && <div className="error-banner section-gap">{error}</div>}
      {loading && <p className="small-muted">Loading…</p>}

      {report && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Income</div>
            <div className="stat-value income">{money(report.total_income)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Expenses</div>
            <div className="stat-value expense">{money(report.total_expense)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Savings</div>
            <div className="stat-value">{money(report.savings)}</div>
          </div>
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <div className="card-title">Recent entries</div>
          {recent.length === 0 ? (
            <div className="empty-state">No transactions yet. Add your first one on the Transactions page.</div>
          ) : (
            <table className="ledger">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>
                      <span className="category-tag">{t.category}</span>
                    </td>
                    <td className={`ledger-amount ${t.type}`}>{t.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-title">Expense breakdown</div>
          {report && Object.keys(report.expense_by_category).length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(report.expense_by_category)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amt]) => (
                  <div key={cat} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span>{cat}</span>
                    <span className="ledger-amount expense" style={{ fontSize: 13 }}>
                      {amt.toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="empty-state">No expenses recorded this month.</div>
          )}
        </div>
      </div>
    </div>
  );
}
