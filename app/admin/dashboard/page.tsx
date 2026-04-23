"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { hasPermission, getDefaultPage } from "@/lib/auth/permissions";
import type { Feature } from "@/lib/auth/permissions";

type Analytics = {
  leads: { total: number; pending: number; contacted: number; converted: number; rejected: number };
  appointments: { total: number; scheduled: number; completed: number; cancelled: number; calls: number; visits: number };
  leadsByCourse: { course: string; _count: { course: number } }[];
  recentLeads: { id: string; name: string; email: string; phone: string; course: string; status: string; createdAt: string }[];
  recentAppointments: { id: string; name: string; type: string; date: string; time: string; status: string }[];
};

type Admin = { name: string; email: string; role: string };
type Task = { id: string; text: string; done: boolean; assignee: string };

const MEMBERS = ["Sales Person", "Telecaller", "Counselor", "Admin", "Marketing"];

const STATUS_LABELS: Record<string, string> = {
  NEW_LEAD: "New Lead", INTERESTED: "Interested", PENDING_FOLLOW_UP: "Follow-up",
  HOT_LEAD: "Hot Lead", NOT_INTERESTED: "Not Interested", CONVERTED: "Converted", REJECTED: "Rejected",
};

function greeting(name: string) {
  const h = new Date().getHours();
  const s = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${s}, ${name?.split(" ")[0] ?? "Admin"}`;
}

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const H = 100, barW = 44, gap = 12;
  const W = data.length * (barW + gap) - gap;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 30}`} style={{ overflow: "visible" }}>
      {data.map((d, i) => {
        const bH = Math.max(4, Math.round((d.value / max) * H));
        const x = i * (barW + gap);
        return (
          <g key={d.label}>
            <rect x={x} y={H - bH} width={barW} height={bH} rx="4" fill={d.color} opacity="0.85" />
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="inherit">{d.label}</text>
            <text x={x + barW / 2} y={H - bH - 5} textAnchor="middle" fontSize="9" fontWeight="600" fill={d.color} fontFamily="inherit">{d.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ slices, size = 90 }: { slices: { value: number; color: string }[], size?: number }) {
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  const r = 32, cx = size / 2, cy = size / 2;
  let offset = -Math.PI / 2;
  return (
    <svg width={size} height={size}>
      {slices.map((s, i) => {
        const angle = (s.value / total) * 2 * Math.PI;
        const x1 = cx + r * Math.cos(offset), y1 = cy + r * Math.sin(offset);
        offset += angle;
        const x2 = cx + r * Math.cos(offset), y2 = cy + r * Math.sin(offset);
        const large = angle > Math.PI ? 1 : 0;
        return s.value === 0 ? null : (
          <path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`} fill={s.color} opacity="0.85" />
        );
      })}
      <circle cx={cx} cy={cy} r={r - 11} fill="white" />
    </svg>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#f8fafc;--surface:#fff;--border:#e2e8f0;--panel:#f1f5f9;--accent:#2563eb;--asoft:rgba(37,99,235,.07);--tp:#0f172a;--ts:#64748b;--ok:#10b981;--warn:#f59e0b;--err:#ef4444;--font:'Inter',sans-serif;--mono:'JetBrains Mono',monospace}
  body{background:var(--bg);color:var(--tp);font-family:var(--font);-webkit-font-smoothing:antialiased}
  .dash{display:flex;min-height:100vh}
  .sidebar{width:220px;background:var(--surface);border-right:1px solid var(--border);padding:20px 14px;display:flex;flex-direction:column;flex-shrink:0}
  .brand{display:flex;align-items:center;gap:10px;margin-bottom:28px}
  .logo-mark{background:var(--accent);color:#fff;padding:4px 8px;border-radius:6px;font-family:var(--mono);font-weight:700;font-size:12px}
  .brand-name{font-weight:700;font-size:14px}
  .nav-list{list-style:none;display:flex;flex-direction:column;gap:2px}
  .nav-link{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:7px;color:var(--ts);text-decoration:none;font-size:13px;font-weight:500;transition:all .15s}
  .nav-link:hover{background:var(--panel);color:var(--tp)}
  .nav-link.active{background:var(--asoft);color:var(--accent);font-weight:600}
  .nav-icon{width:16px;height:16px;flex-shrink:0}
  .main{flex:1;padding:28px 30px;overflow-y:auto;min-width:0}
  .topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}
  .greeting h1{font-size:22px;font-weight:700;letter-spacing:-.02em}
  .greeting p{font-size:13px;color:var(--ts);margin-top:3px}
  .user-nav{display:flex;align-items:center;gap:12px}
  .role-chip{font-size:10px;color:var(--ts);text-transform:uppercase;letter-spacing:.05em;background:var(--panel);padding:4px 10px;border-radius:20px}
  .refresh-info{font-size:11px;color:var(--ts)}
  .logout-btn{padding:7px 14px;border-radius:6px;border:1px solid var(--border);background:#fff;color:var(--ts);font-size:12px;font-weight:500;cursor:pointer;transition:all .2s}
  .logout-btn:hover{background:#fff1f2;border-color:#fecdd3;color:var(--err)}
  .sec-title{font-size:11px;font-weight:700;color:var(--ts);text-transform:uppercase;letter-spacing:.06em;margin:22px 0 10px;display:flex;align-items:center;justify-content:space-between}
  .chip{padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700}
  .chip-blue{background:#eff6ff;color:#2563eb}
  .chip-green{background:#f0fdf4;color:#16a34a}
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px;transition:transform .2s,box-shadow .2s}
  .card:hover{transform:translateY(-2px);box-shadow:0 8px 16px rgba(0,0,0,.05)}
  .card-label{font-size:11px;font-weight:600;color:var(--ts);margin-bottom:5px;text-transform:uppercase;letter-spacing:.04em}
  .card-value{font-size:28px;font-weight:800;letter-spacing:-.03em}
  .card-meta{margin-top:7px;font-size:11px;color:var(--ts)}
  .charts-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
  .chart-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px}
  .chart-title{font-size:11px;font-weight:700;color:var(--ts);text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px}
  .two-col{display:grid;grid-template-columns:1.4fr 1fr;gap:12px}
  .table-wrapper{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden}
  .table-header{padding:12px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:#fafafa}
  .table-header h3{font-size:13px;font-weight:600}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;padding:9px 16px;font-size:10px;font-weight:700;color:var(--ts);text-transform:uppercase;background:#fafafa;border-bottom:1px solid var(--border)}
  td{padding:11px 16px;font-size:13px;border-bottom:1px solid var(--border);vertical-align:middle}
  tr:last-child td{border-bottom:none}
  .sp{padding:3px 8px;border-radius:5px;font-size:10px;font-weight:700;display:inline-flex}
  .sp-new_lead{background:#fffbeb;color:#78350f}.sp-interested{background:#eff6ff;color:#1e40af}
  .sp-pending_follow_up{background:#f0fdf4;color:#065f46}.sp-hot_lead{background:#fff7ed;color:#9a3412}
  .sp-not_interested{background:#f1f5f9;color:#475569}.sp-converted{background:#d1fae5;color:#065f46}
  .sp-rejected{background:#fee2e2;color:#991b1b}.sp-pending{background:#fef3c7;color:#92400e}
  .sp-contacted{background:#dbeafe;color:#1e40af}
  .task-panel{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:40px}
  .task-hdr{padding:12px 16px;border-bottom:1px solid var(--border);background:#fafafa}
  .task-hdr h3{font-size:13px;font-weight:600}
  .task-add{display:flex;gap:8px;padding:10px 16px;border-bottom:1px solid var(--border);flex-wrap:wrap}
  .t-input{flex:1;min-width:120px;border:1px solid var(--border);border-radius:7px;padding:7px 11px;font-family:var(--font);font-size:12px;outline:none;background:var(--panel)}
  .t-input:focus{border-color:var(--accent);background:#fff}
  .t-sel{border:1px solid var(--border);border-radius:7px;padding:7px 10px;font-family:var(--font);font-size:12px;background:var(--panel);outline:none;cursor:pointer}
  .t-btn{padding:7px 14px;background:var(--accent);color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer}
  .t-btn:hover{background:#1d4ed8}
  .task-list{max-height:300px;overflow-y:auto}
  .task-item{display:flex;align-items:center;gap:10px;padding:9px 16px;border-bottom:1px solid var(--border);transition:background .15s}
  .task-item:last-child{border-bottom:none}
  .task-item:hover{background:#fafafa}
  .task-item.done .task-text{text-decoration:line-through;color:var(--ts)}
  .t-cb{width:14px;height:14px;cursor:pointer;accent-color:var(--accent);flex-shrink:0}
  .task-text{flex:1;font-size:13px}
  .t-asgn{font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;background:var(--panel);color:var(--ts);white-space:nowrap}
  .t-del{background:none;border:none;color:#cbd5e1;cursor:pointer;font-size:16px;line-height:1;padding:0 2px}
  .t-del:hover{color:var(--err)}
  .task-empty{padding:22px 16px;text-align:center;font-size:13px;color:var(--ts)}
  @media(max-width:1200px){.stats-grid{grid-template-columns:repeat(2,1fr)}.charts-row{grid-template-columns:1fr 1fr}.two-col{grid-template-columns:1fr}}
  @media(max-width:768px){.dash{flex-direction:column}.sidebar{width:100%}.stats-grid{grid-template-columns:1fr 1fr}.charts-row{grid-template-columns:1fr}}
`;

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("idfa_tasks") || "[]"); } catch { return []; }
  });
  const [newTask, setNewTask] = useState("");
  const [newAssignee, setNewAssignee] = useState(MEMBERS[0]);
  const router = useRouter();

  const getHeaders = (): HeadersInit => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchAnalytics = useCallback(async () => {
    const data = await fetch("/api/admin/analytics", { headers: getHeaders() }).then(r => r.json());
    setAnalytics(data);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    fetch("/api/admin/auth/me", { headers: getHeaders() })
      .then(r => r.json())
      .then(async (me) => {
        if (me.error) { router.push("/admin/login"); return; }
        if (!hasPermission(me.admin.role, "overview")) { router.push(getDefaultPage(me.admin.role)); return; }
        setAdmin(me.admin);
        if (hasPermission(me.admin.role, "analytics")) await fetchAnalytics();
        setLoading(false);
      })
      .catch(() => router.push("/admin/login"));
  }, []);

  useEffect(() => {
    if (!admin) return;
    const id = setInterval(fetchAnalytics, 30_000);
    return () => clearInterval(id);
  }, [admin, fetchAnalytics]);

  useEffect(() => {
    const h = () => fetchAnalytics();
    window.addEventListener("idfa:leads-updated", h);
    return () => window.removeEventListener("idfa:leads-updated", h);
  }, [fetchAnalytics]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("idfa_tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks(p => [...p, { id: Date.now().toString(), text: newTask.trim(), done: false, assignee: newAssignee }]);
    setNewTask("");
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", color: "#64748b", fontFamily: "sans-serif" }}>
      Loading IDFA Intelligence…
    </div>
  );

  const leads = analytics?.leads ?? { total: 0, pending: 0, contacted: 0, converted: 0, rejected: 0 };
  const appointments = analytics?.appointments ?? { total: 0, scheduled: 0, completed: 0, cancelled: 0, calls: 0, visits: 0 };
  const conversionRate = leads.total > 0 ? Math.round((leads.converted / leads.total) * 100) : 0;
  const efficiencyScore = leads.total > 0 ? Math.round(((leads.contacted + leads.converted) / leads.total) * 100) : 0;

  return (
    <>
      <style>{CSS}</style>
      <div className="dash">
        <aside className="sidebar">
          <div>
            <div className="brand">
              <span className="logo-mark">IDFA</span>
              <span className="brand-name">Intelligence</span>
            </div>
            <ul className="nav-list">
              {([
                { label: "Overview",        href: "/admin/dashboard",    feature: "overview"      as Feature, icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
                { label: "Conversations",   href: "/admin/conversations", feature: "conversations" as Feature, icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                { label: "Lead Management", href: "/admin",               feature: "leads"         as Feature, icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                { label: "Members",         href: "/admin/dashboard/members", feature: "overview"  as Feature, icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> },
                { label: "Data Export",     href: "/api/admin/leads/export", feature: "export"    as Feature, icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> },
                { label: "Knowledge Base", href: "/admin/knowledge",         feature: "knowledge" as Feature, icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg> },
              ]).filter(i => hasPermission(admin?.role || "", i.feature)).map(item => (
                <li key={item.label}>
                  <a href={item.href} className={`nav-link${item.href === "/admin/dashboard" ? " active" : ""}`}>
                    {item.icon}{item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="main">
          <header className="topbar">
            <div className="greeting">
              <h1>{greeting(admin?.name ?? "")}</h1>
              <p>Here's what's happening with your leads today.</p>
            </div>
            <div className="user-nav">
              <span className="role-chip">{admin?.role}</span>
              <span className="refresh-info">Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </header>

          {/* ... Rest of your Main Content Area (Stats, Charts, Tasks) Remains Exactly The Same ... */}
          <div className="sec-title">
            <span>Acquisition Performance</span>
            <span className="chip chip-blue">Efficiency {efficiencyScore}%</span>
          </div>
          <div className="stats-grid">
            {[
              { label: "Total Leads",     value: leads.total,                    color: "var(--accent)", meta: "All inbound leads" },
              { label: "Conversion Rate", value: `${conversionRate}%`,           color: "var(--ok)",     meta: conversionRate > 20 ? "High Performance" : "Baseline Growth" },
              { label: "Active Pipeline", value: leads.pending + leads.contacted, color: "var(--warn)",   meta: "Requiring attention" },
              { label: "Completed Meets", value: appointments.completed,          color: "var(--tp)",     meta: "Counseling sessions" },
            ].map(c => (
              <div key={c.label} className="card">
                <div className="card-label">{c.label}</div>
                <div className="card-value" style={{ color: c.color }}>{c.value}</div>
                <div className="card-meta">{c.meta}</div>
              </div>
            ))}
          </div>

          <div className="sec-title"><span>Visual Analytics</span></div>
          <div className="charts-row">
            <div className="chart-card">
              <div className="chart-title">Lead Pipeline</div>
              <BarChart data={[
                { label: "Pending",   value: leads.pending,   color: "#f59e0b" },
                { label: "Contacted", value: leads.contacted,  color: "#2563eb" },
                { label: "Converted", value: leads.converted,  color: "#10b981" },
                { label: "Rejected",  value: leads.rejected,   color: "#ef4444" },
              ]} />
            </div>
            <div className="chart-card">
              <div className="chart-title">Appointments</div>
              <BarChart data={[
                { label: "Scheduled",  value: appointments.scheduled,  color: "#2563eb" },
                { label: "Completed",  value: appointments.completed,  color: "#10b981" },
                { label: "Cancelled",  value: appointments.cancelled,  color: "#ef4444" },
              ]} />
            </div>
            <div className="chart-card">
              <div className="chart-title">Lead Distribution</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                <DonutChart slices={[
                  { value: leads.pending,   color: "#f59e0b" },
                  { value: leads.contacted, color: "#2563eb" },
                  { value: leads.converted, color: "#10b981" },
                  { value: leads.rejected,  color: "#ef4444" },
                ]} />
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    { label: "Pending",   val: leads.pending,   color: "#f59e0b" },
                    { label: "Contacted", val: leads.contacted,  color: "#2563eb" },
                    { label: "Converted", val: leads.converted,  color: "#10b981" },
                    { label: "Rejected",  val: leads.rejected,   color: "#ef4444" },
                  ].map(d => (
                    <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                      <span style={{ color: "#64748b", minWidth: 56 }}>{d.label}</span>
                      <span style={{ fontWeight: 700 }}>{d.val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>Virtual Calls <strong style={{ color: "#0f172a" }}>{appointments.calls}</strong></div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Campus Visits <strong style={{ color: "#0f172a" }}>{appointments.visits}</strong></div>
              </div>
            </div>
          </div>

          <div className="sec-title"><span>Recent Activity</span></div>
          <div className="two-col">
            <div className="table-wrapper">
              <div className="table-header">
                <h3>Priority Leads</h3>
                <a href="/admin" style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>View all →</a>
              </div>
              <table>
                <thead><tr><th>Lead</th><th>Course</th><th>Status</th></tr></thead>
                <tbody>
                  {(analytics?.recentLeads ?? []).map(l => (
                    <tr key={l.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{l.name}</div>
                        <div style={{ fontSize: 11, color: "var(--ts)" }}>{l.phone}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{l.course}</td>
                      <td><span className={`sp sp-${l.status.toLowerCase()}`}>{STATUS_LABELS[l.status] ?? l.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="chart-card">
              <div className="chart-title">Course Interest</div>
              {(analytics?.leadsByCourse ?? []).length === 0
                ? <p style={{ color: "var(--ts)", fontSize: 13 }}>No data yet</p>
                : (analytics?.leadsByCourse ?? []).map((c, i) => {
                  const mx = (analytics?.leadsByCourse ?? [])[0]._count.course;
                  return (
                    <div key={i} style={{ marginBottom: 11 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ fontWeight: 500 }}>{c.course || "General"}</span>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{c._count.course}</span>
                      </div>
                      <div style={{ height: 6, background: "var(--panel)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.round((c._count.course / mx) * 100)}%`, background: "var(--accent)", borderRadius: 3, transition: "width 1s" }} />
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>

          <div className="sec-title"><span>Team Task Board</span></div>
          <div className="task-panel">
            <div className="task-hdr"><h3>Assigned Tasks</h3></div>
            <div className="task-add">
              <input
                className="t-input"
                placeholder="Write a task and press Enter…"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTask()}
              />
              <select className="t-sel" value={newAssignee} onChange={e => setNewAssignee(e.target.value)}>
                {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <button className="t-btn" onClick={addTask}>Add</button>
            </div>
            <div className="task-list">
              {tasks.length === 0
                ? <div className="task-empty">No tasks yet. Add one above.</div>
                : tasks.map(t => (
                  <div key={t.id} className={`task-item${t.done ? " done" : ""}`}>
                    <input type="checkbox" className="t-cb" checked={t.done} onChange={() => setTasks(p => p.map(x => x.id === t.id ? { ...x, done: !x.done } : x))} />
                    <span className="task-text">{t.text}</span>
                    <span className="t-asgn">{t.assignee}</span>
                    <button className="t-del" onClick={() => setTasks(p => p.filter(x => x.id !== t.id))}>×</button>
                  </div>
                ))
              }
            </div>
          </div>
        </main>
      </div>
    </>
  );
}