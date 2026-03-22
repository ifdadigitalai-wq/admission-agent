"use client";

import { useEffect, useState } from "react";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  status: string;
  notes?: string;
  createdAt: string;
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0b0e14; --surface: #111520; --panel: #161c2a; --border: #1f2a3d;
    --accent: #3d8bff; --accent2: #6c63ff; --text: #e2e8f4; --muted: #5a6a85;
    --green: #34d399; --yellow: #f5c842; --red: #f87171; --orange: #fb923c;
    --font: 'Sora', sans-serif; --mono: 'JetBrains Mono', monospace;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font); }

  .page { min-height: 100vh; display: flex; flex-direction: column; background: var(--bg); }

  /* Topbar */
  .topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 28px; background: var(--surface);
    border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 50;
  }
  .topbar-left { display: flex; align-items: center; gap: 14px; }
  .logo { font-family: var(--mono); font-size: 13px; font-weight: 600; color: var(--accent); letter-spacing: .08em; text-transform: uppercase; }
  .divider { width: 1px; height: 20px; background: var(--border); }
  .page-title { font-size: 15px; font-weight: 600; color: var(--text); }
  .topbar-right { display: flex; align-items: center; gap: 10px; }
  .topbar-btn {
    padding: 7px 14px; border-radius: 8px; font-family: var(--font);
    font-size: 12px; cursor: pointer; transition: all .2s; text-decoration: none;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--muted); }
  .btn-outline:hover { border-color: var(--accent); color: var(--accent); }
  .btn-primary { background: linear-gradient(135deg, var(--accent), var(--accent2)); border: none; color: #fff; }
  .btn-primary:hover { opacity: .88; transform: translateY(-1px); }

  /* Content */
  .content { padding: 28px; flex: 1; max-width: 1400px; margin: 0 auto; width: 100%; }

  /* Header row */
  .header-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
  }
  .header-left h1 { font-size: 20px; font-weight: 600; }
  .header-left p { font-size: 12px; color: var(--muted); margin-top: 3px; font-family: var(--mono); }

  /* Stats row */
  .stats-row { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
  .stat-pill {
    display: flex; align-items: center; gap: 8px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 10px 16px;
  }
  .stat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .stat-pill-label { font-size: 11px; color: var(--muted); font-family: var(--mono); }
  .stat-pill-value { font-size: 15px; font-weight: 600; font-family: var(--mono); margin-left: 2px; }

  /* Search & filter */
  .toolbar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
  .search-box {
    display: flex; align-items: center; gap: 8px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 9px 14px; flex: 1; min-width: 200px;
    transition: border-color .2s, box-shadow .2s;
  }
  .search-box:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(61,139,255,.1); }
  .search-box input { background: none; border: none; outline: none; font-family: var(--font); font-size: 13px; color: var(--text); width: 100%; }
  .search-box input::placeholder { color: var(--muted); }
  .filter-select {
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    padding: 9px 14px; font-family: var(--font); font-size: 13px; color: var(--text);
    outline: none; cursor: pointer; transition: border-color .2s;
  }
  .filter-select:focus { border-color: var(--accent); }

  /* Table */
  .table-wrap {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; overflow: hidden;
  }
  table { width: 100%; border-collapse: collapse; }
  thead { background: var(--panel); }
  th {
    padding: 12px 16px; font-size: 10px; color: var(--muted);
    font-family: var(--mono); text-transform: uppercase; letter-spacing: .08em;
    text-align: left; border-bottom: 1px solid var(--border); white-space: nowrap;
  }
  td {
    padding: 13px 16px; font-size: 13px;
    border-bottom: 1px solid rgba(31,42,61,.6);
    vertical-align: middle;
  }
  tr:last-child td { border-bottom: none; }
  tbody tr { transition: background .15s; }
  tbody tr:hover td { background: var(--panel); }

  .name-cell .name { font-weight: 500; color: var(--text); }
  .name-cell .email { font-size: 11px; color: var(--muted); margin-top: 2px; font-family: var(--mono); }
  .phone-cell { font-family: var(--mono); font-size: 12px; color: var(--muted); }
  .course-cell { font-size: 12px; color: var(--text); }
  .date-cell { font-family: var(--mono); font-size: 11px; color: var(--muted); white-space: nowrap; }

  /* Badge */
  .badge { display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: 10px; font-family: var(--mono); font-weight: 500; white-space: nowrap; }
  .badge-PENDING   { background: rgba(245,200,66,.1);  color: var(--yellow); border: 1px solid rgba(245,200,66,.2); }
  .badge-CONTACTED { background: rgba(61,139,255,.1);  color: var(--accent); border: 1px solid rgba(61,139,255,.2); }
  .badge-CONVERTED { background: rgba(52,211,153,.1);  color: var(--green);  border: 1px solid rgba(52,211,153,.2); }
  .badge-REJECTED  { background: rgba(248,113,113,.1); color: var(--red);    border: 1px solid rgba(248,113,113,.2); }

  /* Status select */
  .status-select {
    background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
    padding: 5px 8px; font-family: var(--mono); font-size: 11px; color: var(--text);
    outline: none; cursor: pointer; transition: border-color .2s;
  }
  .status-select:focus { border-color: var(--accent); }

  /* Notes input */
  .notes-input {
    background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
    padding: 5px 10px; font-family: var(--font); font-size: 12px; color: var(--text);
    outline: none; width: 100%; min-width: 120px; transition: border-color .2s;
  }
  .notes-input:focus { border-color: var(--accent); }
  .notes-input::placeholder { color: var(--muted); }

  /* Empty state */
  .empty {
    text-align: center; padding: 60px 20px; color: var(--muted);
  }
  .empty-icon { font-size: 36px; margin-bottom: 12px; }
  .empty p { font-size: 14px; }

  /* Loading */
  .loading {
    display: flex; align-items: center; justify-content: center;
    min-height: 60vh; color: var(--muted); font-family: var(--mono); font-size: 13px; gap: 10px;
  }
  .spinner {
    width: 18px; height: 18px; border: 2px solid var(--border);
    border-top-color: var(--accent); border-radius: 50%;
    animation: spin .6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Toast */
  .toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: var(--surface); border: 1px solid var(--green);
    border-radius: 10px; padding: 10px 20px; font-size: 13px; color: var(--green);
    font-family: var(--mono); z-index: 999; box-shadow: 0 8px 32px rgba(0,0,0,.4);
    animation: slideUp .3s ease;
  }
  @keyframes slideUp { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }

  @media (max-width: 768px) {
    .content { padding: 16px; }
    .stats-row { gap: 8px; }
    td, th { padding: 10px 12px; }
  }
`;

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toast, setToast] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };

  useEffect(() => {
    fetch("/api/admin/leads", { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => {
        setLeads(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateLead = async (id: string, status: string, notes: string) => {
    await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ status, notes }),
    });
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status, notes } : l)));
    showToast("✅ Lead updated");
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const filtered = leads.filter((l) => {
    const matchSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.course?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const counts = {
    total: leads.length,
    pending: leads.filter((l) => l.status === "PENDING").length,
    contacted: leads.filter((l) => l.status === "CONTACTED").length,
    converted: leads.filter((l) => l.status === "CONVERTED").length,
    rejected: leads.filter((l) => l.status === "REJECTED").length,
  };

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="loading"><div className="spinner" /> Loading leads…</div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="page">

        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <span className="logo">IDFA.AI</span>
            <div className="divider" />
            <span className="page-title">Lead Management</span>
          </div>
          <div className="topbar-right">
            <a href="/admin/dashboard" className="topbar-btn btn-outline">← Dashboard</a>
            <a href="/api/admin/leads/export" className="topbar-btn btn-primary" download>
              ⬇ Export CSV
            </a>
          </div>
        </div>

        <div className="content">

          {/* Header */}
          <div className="header-row">
            <div className="header-left">
              <h1>All Leads</h1>
              <p>{counts.total} total · {counts.converted} converted</p>
            </div>
          </div>

          {/* Stats pills */}
          <div className="stats-row">
            {[
              { label: "Total", value: counts.total, color: "#3d8bff" },
              { label: "Pending", value: counts.pending, color: "#f5c842" },
              { label: "Contacted", value: counts.contacted, color: "#3d8bff" },
              { label: "Converted", value: counts.converted, color: "#34d399" },
              { label: "Rejected", value: counts.rejected, color: "#f87171" },
            ].map((s) => (
              <div key={s.label} className="stat-pill">
                <div className="stat-dot" style={{ background: s.color }} />
                <span className="stat-pill-label">{s.label}</span>
                <span className="stat-pill-value" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5a6a85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                placeholder="Search by name, email or course…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONTACTED">Contacted</option>
              <option value="CONVERTED">Converted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Table */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Phone</th>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Update Status</th>
                  <th>Notes</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div className="name-cell">
                        <div className="name">{lead.name}</div>
                        <div className="email">{lead.email}</div>
                      </div>
                    </td>
                    <td className="phone-cell">{lead.phone}</td>
                    <td className="course-cell">{lead.course}</td>
                    <td>
                      <span className={`badge badge-${lead.status}`}>{lead.status}</span>
                    </td>
                    <td>
                      <select
                        className="status-select"
                        value={lead.status}
                        onChange={(e) => updateLead(lead.id, e.target.value, lead.notes || "")}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="CONVERTED">Converted</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </td>
                    <td>
                      <input
                        className="notes-input"
                        defaultValue={lead.notes || ""}
                        onBlur={(e) => updateLead(lead.id, lead.status, e.target.value)}
                        placeholder="Add note…"
                      />
                    </td>
                    <td className="date-cell">
                      {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="empty">
                <div className="empty-icon">🔍</div>
                <p>{search || statusFilter !== "ALL" ? "No leads match your filters." : "No leads yet."}</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}