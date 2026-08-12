import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, saveSession } from "../api.js";

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login"); 
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (mode === "login") {
        const result = await api.login(username, password);
        saveSession(result.token, result.user);
        onAuth?.();
        navigate("/", { replace: true });
      } else {
        await api.register(username, password);
        setPassword("");
        setMode("login");
        setSuccess("Account created ");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">Personal Finance Management</div>
        <div className="auth-tagline">
          
        </div>

        {error && <div className="error-banner" style={{ marginBottom: 14 }}>{error}</div>}
        {success && <div className="success-banner" style={{ marginBottom: 14 }}>{success}</div>}

        <form className="auth-form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              minLength={3}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "login" ? (
            <>
              New here?{" "}
              <button type="button" onClick={() => { setMode("register"); setError(""); setSuccess(""); }}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
