import React, { useEffect, useState } from "react";
import { api } from "../api.js";

function money(n) {
  return "$" + n.toFixed(2);
}

const now = new Date();
const MONTH_NAMES = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleString("default", { month: "short" })
);
const YEARS = Array.from({ length: 11 }, (_, i) => now.getFullYear() - 8 + i); // 8 years back, 2 ahead

export default function ReportsPage() {
  const [view, setView] = useState("monthly");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = view === "monthly" ? await api.monthlyReport(year, month) : await api.yearlyReport(year);
        setReport(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [view, year, month]);

  const maxMonthly = report?.monthly_breakdown
    ? Math.max(1, ...Object.values(report.monthly_breakdown).map((m) => Math.max(m.income, m.expense)))
    : 1;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
       
      </div>

      <div className="card section-gap">
        <div className="form-grid">
          <div className="field">
            <label>Report type</label>
            <select value={view} onChange={(e) => setView(e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="field">
            <label>Year</label>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))}>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {view === "monthly" && (
            <div className="field">
              <label>Month</label>
              <select value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))}>
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-banner section-gap">{error}</div>}
      {loading && <p className="small-muted">Loading…</p>}

      {report && !loading && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Total income</div>
              <div className="stat-value income">{money(report.total_income)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total expenses</div>
              <div className="stat-value expense">{money(report.total_expense)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Net savings</div>
              <div className="stat-value">{money(report.savings)}</div>
            </div>
          </div>

          <div className="two-col">
            <div className="card">
              <div className="card-title">Expenses by category</div>
              {Object.keys(report.expense_by_category).length === 0 ? (
                <div className="empty-state">No expenses in this period.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(report.expense_by_category)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, amt]) => {
                      const pct = report.total_expense ? (amt / report.total_expense) * 100 : 0;
                      return (
                        <div key={cat}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                            <span>{cat}</span>
                            <span className="small-muted">{money(amt)} · {pct.toFixed(0)}%</span>
                          </div>
                          <div className="budget-track">
                            <div className="budget-fill" style={{ width: `${pct}%`, background: "var(--expense)" }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {view === "yearly" && report.monthly_breakdown && (
              <div className="card">
                <div className="card-title">Monthly breakdown</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(report.monthly_breakdown).map(([m, vals]) => (
                    <div key={m} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="small-muted" style={{ width: 32 }}>{MONTH_NAMES[parseInt(m, 10) - 1]}</span>
                      <div style={{ flex: 1, display: "flex", gap: 2, height: 14 }}>
                        <div style={{ width: `${(vals.income / maxMonthly) * 100}%`, background: "var(--income)", borderRadius: 3 }} />
                        <div style={{ width: `${(vals.expense / maxMonthly) * 100}%`, background: "var(--expense)", borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12 }} className="small-muted">
                  <span><span style={{ display: "inline-block", width: 8, height: 8, background: "var(--income)", borderRadius: 2, marginRight: 6 }} />Income</span>
                  <span><span style={{ display: "inline-block", width: 8, height: 8, background: "var(--expense)", borderRadius: 2, marginRight: 6 }} />Expense</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
