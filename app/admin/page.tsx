"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasPermission, getDefaultPage } from "@/lib/auth/permissions";

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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  :root {
    --bg: #f8fafc;
    --surface: #ffffff;
    --panel: #f1f5f9;
    --border: #e2e8f0;
    --accent: #2563eb;
    --text: #0f172a;
    --muted: #64748b;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
    --font: 'Inter', sans-serif;
    --mono: 'JetBrains Mono', monospace;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font); -webkit-font-smoothing: antialiased; }

  .page { min-height: 100vh; display: flex; flex-direction: column; }

  /* Topbar */
  .topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px; height: 64px; background: var(--surface);
    border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 50;
  }
  .topbar-left { display: flex; align-items: center; gap: 14px; }
  .logo { font-family: var(--mono); font-size: 12px; font-weight: 700; color: var(--accent); letter-spacing: .05em; text-transform: uppercase; background: rgba(37, 99, 235, 0.05); padding: 4px 8px; border-radius: 4px; }
  .divider { width: 1px; height: 20px; background: var(--border); }
  .page-title { font-size: 14px; font-weight: 600; color: var(--text); }
  
  .topbar-right { display: flex; align-items: center; gap: 10px; }
  .topbar-btn {
    padding: 8px 16px; border-radius: 6px; font-family: var(--font);
    font-size: 12px; font-weight: 500; cursor: pointer; transition: all .2s; text-decoration: none;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .btn-outline { background: #fff; border: 1px solid var(--border); color: var(--muted); }
  .btn-outline:hover { border-color: var(--accent); color: var(--accent); background: #f0f7ff; }
  .btn-primary { background: var(--accent); border: none; color: #fff; }
  .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }

  /* Content Container */
  .content { padding: 40px 32px; flex: 1; max-width: 1440px; margin: 0 auto; width: 100%; }

  /* Header Section */
  .header-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 24px;
  }
  .header-left h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
  .header-left p { font-size: 13px; color: var(--muted); margin-top: 4px; }

  /* Enhanced Stats Row */
  .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .stat-pill {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; padding: 16px 20px;
    display: flex; flex-direction: column; gap: 8px;
    transition: transform 0.2s;
  }
  .stat-pill:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
  .stat-pill-label { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-pill-value { font-size: 22px; font-weight: 700; color: var(--text); }

  /* Search & Toolbar */
  .toolbar { display: flex; gap: 12px; margin-bottom: 20px; }
  .search-box {
    display: flex; align-items: center; gap: 10px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 0 16px; flex: 1;
    transition: all .2s; height: 42px;
  }
  .search-box:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,0.06); }
  .search-box input { background: none; border: none; outline: none; font-family: var(--font); font-size: 14px; color: var(--text); width: 100%; }
  
  .filter-select {
    background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
    padding: 0 16px; font-family: var(--font); font-size: 13px; color: var(--text);
    outline: none; cursor: pointer; height: 42px; min-width: 160px;
  }

  /* Table Design */
  .table-wrap {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  table { width: 100%; border-collapse: collapse; }
  thead { background: #fafafa; }
  th {
    padding: 12px 20px; font-size: 11px; color: var(--muted);
    font-weight: 600; text-transform: uppercase; letter-spacing: .05em;
    text-align: left; border-bottom: 1px solid var(--border);
  }
  td { padding: 16px 20px; font-size: 14px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tbody tr:hover td { background: #fcfcfd; }

  /* Cells */
  .name-cell .name { font-weight: 600; color: var(--text); }
  .name-cell .email { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .phone-cell { font-family: var(--mono); font-size: 12px; color: var(--muted); }
  .course-cell { font-weight: 500; font-size: 13px; }
  .date-cell { font-size: 12px; color: var(--muted); }

  /* Badges — keyed to the canonical status values */
  .badge { 
    display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; 
    font-size: 11px; font-weight: 600; letter-spacing: 0.02em; 
  }
  .badge-NEW_LEAD          { background: #fffbeb; color: #92400e; }
  .badge-INTERESTED        { background: #eff6ff; color: #1e40af; }
  .badge-PENDING_FOLLOW_UP { background: #f0fdf4; color: #166534; }
  .badge-HOT_LEAD          { background: #fff7ed; color: #9a3412; }
  .badge-NOT_INTERESTED    { background: #fef2f2; color: #991b1b; }
  .badge-CONVERTED         { background: #f0fdf4; color: #065f46; }
  .badge-REJECTED          { background: #fef2f2; color: #7f1d1d; }

  /* Inline Inputs */
  .status-select {
    background: #f8fafc; border: 1px solid var(--border); border-radius: 6px;
    padding: 6px 10px; font-family: var(--font); font-size: 12px; color: var(--text);
    outline: none; cursor: pointer; font-weight: 500;
  }
  .notes-input {
    background: #f8fafc; border: 1px solid var(--border); border-radius: 6px;
    padding: 8px 12px; font-family: var(--font); font-size: 12px; color: var(--text);
    outline: none; width: 100%; transition: all .2s;
  }
  .notes-input:focus { border-color: var(--accent); background: #fff; }

  /* Utilities */
  .empty { text-align: center; padding: 80px 20px; color: var(--muted); background: #fff; }
  .loading { display: flex; align-items: center; justify-content: center; min-height: 80vh; font-weight: 500; color: var(--muted); gap: 12px; }
  .spinner { width: 20px; height: 20px; border: 2px solid #e2e8f0; border-top-color: var(--accent); border-radius: 50%; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .toast {
    position: fixed; bottom: 32px; right: 32px;
    background: #0f172a; color: #fff; border-radius: 8px;
    padding: 12px 24px; font-size: 14px; font-weight: 500;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15); animation: slideIn .3s ease;
  }
  @keyframes slideIn { from{opacity:0; transform: translateY(20px)} to{opacity:1; transform: translateY(0)} }
`;

// Single source of truth for all status values used throughout the file
const STATUS = {
  NEW_LEAD:          "NEW_LEAD",
  INTERESTED:        "INTERESTED",
  PENDING_FOLLOW_UP: "PENDING_FOLLOW_UP",
  HOT_LEAD:          "HOT_LEAD",
  NOT_INTERESTED:    "NOT_INTERESTED",
  CONVERTED:         "CONVERTED",
  REJECTED:          "REJECTED",
} as const;

type StatusKey = keyof typeof STATUS;

const STATUS_LABELS: Record<string, string> = {
  NEW_LEAD:          "New Lead",
  INTERESTED:        "Interested",
  PENDING_FOLLOW_UP: "Pending Follow-up",
  HOT_LEAD:          "Hot Lead",
  NOT_INTERESTED:    "Not Interested",
  CONVERTED:         "Converted",
  REJECTED:          "Rejected",
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toast, setToast] = useState("");
  const router = useRouter();

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };

  // Auth + permission check
  useEffect(() => {
    fetch("/api/admin/auth/me", { headers: authHeaders })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push("/admin/login"); return; }
        if (!hasPermission(data.admin.role, "leads")) {
          router.push(getDefaultPage(data.admin.role));
          return;
        }
        setAuthorized(true);
      })
      .catch(() => router.push("/admin/login"));
  }, []);

  useEffect(() => {
    if (!authorized) return;
    fetch("/api/admin/leads", { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => {
        setLeads(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [authorized]);

  const updateLead = async (id: string, status: string, notes: string) => {
    await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ status, notes }),
    });
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status, notes } : l)));
    showToast("Lead updated successfully");
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const filtered = leads.filter((l) => {
    const matchSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.course?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // All counts use the same canonical STATUS values
  const counts = {
    total:            leads.length,
    NEW_LEAD:         leads.filter((l) => l.status === STATUS.NEW_LEAD).length,
    INTERESTED:       leads.filter((l) => l.status === STATUS.INTERESTED).length,
    PENDING_FOLLOW_UP:leads.filter((l) => l.status === STATUS.PENDING_FOLLOW_UP).length,
    HOT_LEAD:         leads.filter((l) => l.status === STATUS.HOT_LEAD).length,
    NOT_INTERESTED:   leads.filter((l) => l.status === STATUS.NOT_INTERESTED).length,
    CONVERTED:        leads.filter((l) => l.status === STATUS.CONVERTED).length,
    REJECTED:         leads.filter((l) => l.status === STATUS.REJECTED).length,
  };

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="loading"><div className="spinner" /> Synchronizing Leads…</div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="page">
        <div className="topbar">
          <div className="topbar-left">
            <span className="logo">IDFA</span>
            <div className="divider" />
            <span className="page-title">Lead Management</span>
          </div>
          <div className="topbar-right">
            <a href="/admin/dashboard" className="topbar-btn btn-outline">Back to Dashboard</a>
            <a href="/api/admin/leads/export" className="topbar-btn btn-primary" download>
              Export Dataset
            </a>
          </div>
        </div>

        <div className="content">
          <div className="header-row">
            <div className="header-left">
              <h1>Inbound Leads</h1>
              <p>Managing {counts.total} prospects across the enrollment funnel</p>
            </div>
          </div>

          <div className="stats-row">
            {[
              { label: "Total Leads",       value: counts.total,             color: "var(--accent)"  },
              { label: "New Leads",         value: counts.NEW_LEAD,          color: "var(--warning)" },
              { label: "Interested",        value: counts.INTERESTED,        color: "var(--accent)"  },
              { label: "Pending Follow-up", value: counts.PENDING_FOLLOW_UP, color: "var(--success)" },
              { label: "Hot Leads",         value: counts.HOT_LEAD,          color: "var(--danger)"  },
              { label: "Not Interested",    value: counts.NOT_INTERESTED,    color: "var(--muted)"   },
              { label: "Converted",         value: counts.CONVERTED,         color: "var(--success)" },
              { label: "Rejected",          value: counts.REJECTED,          color: "var(--danger)"  },
            ].map((s) => (
              <div key={s.label} className="stat-pill">
                <span className="stat-pill-label">{s.label}</span>
                <span className="stat-pill-value" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          <div className="toolbar">
            <div className="search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                placeholder="Search candidates by name, email or course…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Lifecycle Stages</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Prospect</th>
                  <th>Channel</th>
                  <th>Interest Area</th>
                  <th>Status</th>
                  <th>Action</th>
                  <th>Internal Notes</th>
                  <th>Recorded</th>
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
                      {/* badge class matches badge-{STATUS_VALUE} in CSS exactly */}
                      <span className={`badge badge-${lead.status}`}>
                        {STATUS_LABELS[lead.status] ?? lead.status}
                      </span>
                    </td>
                    <td>
                      <select
                        className="status-select"
                        value={lead.status}
                        onChange={(e) => updateLead(lead.id, e.target.value, lead.notes || "")}
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="notes-input"
                        defaultValue={lead.notes || ""}
                        onBlur={(e) => updateLead(lead.id, lead.status, e.target.value)}
                        placeholder="Click to add note…"
                      />
                    </td>
                    <td className="date-cell">
                      {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric"
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="empty">
                <p>{search || statusFilter !== "ALL" ? "No records match these criteria." : "Lead ledger is currently empty."}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}