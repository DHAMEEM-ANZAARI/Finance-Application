import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, NavLink, useNavigate } from "react-router-dom";

import { isLoggedIn, clearSession, getSessionUser } from "./api.js";
import AuthPage from "./components/AuthPage.jsx";
import Dashboard from "./components/Dashboard.jsx";
import TransactionsPage from "./components/TransactionsPage.jsx";
import ReportsPage from "./components/ReportsPage.jsx";
import BudgetsPage from "./components/BudgetsPage.jsx";
import DataPage from "./components/DataPage.jsx";

function ProtectedLayout({ children }) {
  const navigate = useNavigate();
  const user = getSessionUser();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  const links = [
    { to: "/", label: "Dashboard" },
    { to: "/transactions", label: "Transactions" },
    { to: "/reports", label: "Reports" },
    { to: "/budgets", label: "Budgets" },
    { to: "/data", label: "Backup & Restore" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand">Personal </div>
          <div className="brand-sub">Finance Management</div>
        </div>
        <ul className="nav-list">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <div className="user-chip">Signed in as {user?.username}</div>
          <button className="logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

export default function App() {
  const [, forceRender] = useState(0);

  // re-render on login/logout since we read localStorage directly
  useEffect(() => {
    const handler = () => forceRender((n) => n + 1);
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <Routes>
      <Route
        path="/login"
        element={isLoggedIn() ? <Navigate to="/" replace /> : <AuthPage onAuth={() => forceRender((n) => n + 1)} />}
      />
      <Route
        path="/"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedLayout>
            <TransactionsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedLayout>
            <ReportsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/budgets"
        element={
          <ProtectedLayout>
            <BudgetsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/data"
        element={
          <ProtectedLayout>
            <DataPage />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
