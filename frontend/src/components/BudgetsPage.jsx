import React, { useEffect, useState } from "react";
import { api } from "../api.js";

const CATEGORIES = ["Food", "Rent", "Utilities", "Transport", "Health", "Entertainment", "Shopping", "Other"];

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function BudgetsPage() {
  const [month, setMonth] = useState(currentMonth());
  const [status, setStatus] = useState([]);
  const [form, setForm] = useState({ category: "Food", limit_amount: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.budgetStatus(month);
      setStatus(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [month]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.createBudget({ category: form.category, month, limit_amount: parseFloat(form.limit_amount) });
      setForm({ category: "Food", limit_amount: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

 
  const [budgetIds, setBudgetIds] = useState({});
  useEffect(() => {
    (async () => {
      try {
        const budgets = await api.listBudgets(month);
        const map = {};
        budgets.forEach((b) => (map[b.category] = b.id));
        setBudgetIds(map);
      } catch {
        /* non-fatal */
      }
    })();
  }, [month, status.length]);

  const removeBudget = async (category) => {
    const id = budgetIds[category];
    if (!id) return;
    if (!window.confirm(`Remove budget for ${category}?`)) return;
    try {
      await api.deleteBudget(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Budgets</h1>
    
      </div>

      <div className="card section-gap">
        <div className="form-grid">
          <div className="field">
            <label>Month</label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-title">Set a budget</div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Monthly limit</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.limit_amount}
                onChange={(e) => setForm({ ...form, limit_amount: e.target.value })}
              />
            </div>
            <div className="field" style={{ flexDirection: "row" }}>
              <button className="btn btn-primary" type="submit">Save budget</button>
            </div>
          </div>
        </form>
      </div>

      {error && <div className="error-banner section-gap">{error}</div>}

      <div className="card">
        <div className="card-title">Status for {month}</div>
        {loading ? (
          <p className="small-muted">Loading…</p>
        ) : status.length === 0 ? (
          <div className="empty-state">No budgets set for this month yet.</div>
        ) : (
          status.map((b) => {
            const pct = Math.min(100, b.percent_used);
            const fillClass = b.exceeded ? "exceeded" : b.percent_used >= 80 ? "warn" : "";
            return (
              <div className="budget-row" key={b.category}>
                <div className="budget-row-top">
                  <span>
                    {b.category}{" "}
                    {b.exceeded ? (
                      <span className="badge exceeded">Over budget</span>
                    ) : b.percent_used >= 80 ? (
                      <span className="badge exceeded" style={{ background: "var(--warn-bg)", color: "var(--warn)" }}>
                        Near limit
                      </span>
                    ) : (
                      <span className="badge ok">On track</span>
                    )}
                  </span>
                  <span className="budget-figures">
                    ${b.spent.toFixed(2)} / ${b.limit_amount.toFixed(2)}
                  </span>
                </div>
                <div className="budget-track">
                  <div className={`budget-fill ${fillClass}`} style={{ width: `${pct}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="icon-btn danger" onClick={() => removeBudget(b.category)}>Remove</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
