const BASE = "/api";

function getToken() {
  return localStorage.getItem("finance_token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  register: (username, password) =>
    request("/auth/register", { method: "POST", body: { username, password }, auth: false }),
  login: (username, password) =>
    request("/auth/login", { method: "POST", body: { username, password }, auth: false }),
  me: () => request("/auth/me"),

  listTransactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/transactions${qs ? `?${qs}` : ""}`);
  },
  createTransaction: (payload) => request("/transactions", { method: "POST", body: payload }),
  updateTransaction: (id, payload) => request(`/transactions/${id}`, { method: "PUT", body: payload }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: "DELETE" }),

  monthlyReport: (year, month) => request(`/reports/monthly?year=${year}&month=${month}`),
  yearlyReport: (year) => request(`/reports/yearly?year=${year}`),

  listBudgets: (month) => request(`/budgets${month ? `?month=${month}` : ""}`),
  createBudget: (payload) => request("/budgets", { method: "POST", body: payload }),
  updateBudget: (id, payload) => request(`/budgets/${id}`, { method: "PUT", body: payload }),
  deleteBudget: (id) => request(`/budgets/${id}`, { method: "DELETE" }),
  budgetStatus: (month) => request(`/budgets/status?month=${month}`),

  createBackup: () => request("/backup", { method: "POST" }),
  listBackups: () => request("/backup"),
  restoreBackup: (file) => request("/backup/restore", { method: "POST", body: { file } }),
};

export function saveSession(token, user) {
  localStorage.setItem("finance_token", token);
  localStorage.setItem("finance_user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("finance_token");
  localStorage.removeItem("finance_user");
}

export function getSessionUser() {
  const raw = localStorage.getItem("finance_user");
  return raw ? JSON.parse(raw) : null;
}

export function isLoggedIn() {
  return Boolean(getToken());
}
