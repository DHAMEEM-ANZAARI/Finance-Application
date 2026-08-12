import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function DataPage() {
  const [backups, setBackups] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const list = await api.listBackups();
      setBackups(list);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createBackup = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await api.createBackup();
      setMessage(res.message + `: ${res.file}`);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const restore = async (file) => {
    if (!window.confirm(`Restore the database from "${file}"? This replaces current data.`)) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await api.restoreBackup(file);
      setMessage(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Backup &amp; Restore</h1>
      
      </div>

      {error && <div className="error-banner section-gap">{error}</div>}
      {message && <div className="success-banner section-gap">{message}</div>}

      <div className="card section-gap">
        <div className="card-title">Create a backup</div>
        <p className="small-muted" style={{ marginBottom: 14 }}>
          Copies the current database file to a timestamped snapshot on the server.
        </p>
        <button className="btn btn-primary" onClick={createBackup} disabled={busy}>
          {busy ? "Working…" : "Back up now"}
        </button>
      </div>

      <div className="card">
        <div className="card-title">Available backups</div>
        {backups.length === 0 ? (
          <div className="empty-state">No backups yet. Create one above.</div>
        ) : (
          <table className="ledger">
            <thead>
              <tr>
                <th>Snapshot file</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {backups.map((file) => (
                <tr key={file}>
                  <td className="small-muted" style={{ fontFamily: "var(--font-mono)" }}>{file}</td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" disabled={busy} onClick={() => restore(file)}>
                        Restore
                      </button>
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
