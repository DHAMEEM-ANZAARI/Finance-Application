import React, { useEffect, useState } from "react";
import { api } from "../api.js";

const CATEGORIES = [
  "Salary", "Freelance", "Investment", "Gift", 
  "Food", "Rent", "Utilities", "Transport", "Health", "Entertainment", "Shopping", "Other",
];

const emptyForm = {
  type: "expense",
  category: "Food",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (type = filterType) => {
    setLoading(true);
    try {
      const data = await api.listTransactions(type ? { type } : {});
      setTransactions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    load(filterType);
  }, [filterType]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = { ...form, amount: parseFloat(form.amount) };
    try {
      if (editingId) {
        await api.updateTransaction(editingId, payload);
      } else {
        await api.createTransaction(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setForm({ type: t.type, category: t.category, amount: String(t.amount), date: t.date });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await api.deleteTransaction(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
        </div>

      {error && <div className="error-banner section-gap">{error}</div>}

      <div className="card section-gap">
        <div className="card-title">{editingId ? "Edit entry" : "New entry"}</div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field">
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="field" style={{ flexDirection: "row", gap: 10 }}>
              <button className="btn btn-primary" type="submit">
                {editingId ? "Save changes" : "Add entry"}
              </button>
              {editingId && (
                <button className="btn btn-secondary" type="button" onClick={cancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>All entries</div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid var(--border)" }}>
            <option value="">All types</option>
            <option value="income">Income only</option>
            <option value="expense">Expense only</option>
          </select>
        </div>

        {loading ? (
          <p className="small-muted">Loading…</p>
        ) : transactions.length === 0 ? (
          <div className="empty-state">No transactions match. Add one above.</div>
        ) : (
          <table className="ledger">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td><span className="category-tag">{t.category}</span></td>
                  <td className={`ledger-amount ${t.type}`}>{t.amount.toFixed(2)}</td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => startEdit(t)}>Edit</button>
                      <button className="icon-btn danger" onClick={() => remove(t.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
