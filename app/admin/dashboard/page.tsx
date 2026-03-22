"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Analytics = {
  leads: { total: number; pending: number; contacted: number; converted: number; rejected: number };
  appointments: { total: number; scheduled: number; completed: number; cancelled: number; calls: number; visits: number };
  leadsByCourse: { course: string; _count: { course: number } }[];
  recentLeads: { id: string; name: string; email: string; phone: string; course: string; status: string; createdAt: string }[];
  recentAppointments: { id: string; name: string; type: string; date: string; time: string; status: string }[];
};

type Admin = { name: string; email: string; role: string };

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch("/api/admin/auth/me", { headers }).then((r) => r.json()),
      fetch("/api/admin/analytics", { headers }).then((r) => r.json()),
    ]).then(([meData, analyticsData]) => {
      if (meData.error) { router.push("/admin/login"); return; }
      setAdmin(meData.admin);
      setAnalytics(analyticsData);
      setLoading(false);
    }).catch(() => router.push("/admin/login"));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0e14", color: "#5a6a85", fontFamily: "monospace" }}>
      Loading dashboard…
    </div>
  );

  const conversionRate = analytics!.leads.total > 0
    ? Math.round((analytics!.leads.converted / analytics!.leads.total) * 100)
    : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0b0e14; --surface: #111520; --panel: #161c2a; --border: #1f2a3d;
          --accent: #3d8bff; --accent2: #6c63ff; --text: #e2e8f4; --muted: #5a6a85;
          --green: #34d399; --yellow: #f5c842; --red: #f87171; --orange: #fb923c;
          --font: 'Sora', sans-serif; --mono: 'JetBrains Mono', monospace;
        }
        body { background: var(--bg); color: var(--text); font-family: var(--font); }
        .dash { min-height: 100vh; display: flex; flex-direction: column; }

        /* Topbar */
        .topbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 28px; background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 50; }
        .topbar-left { display: flex; align-items: center; gap: 14px; }
        .logo { font-family: var(--mono); font-size: 13px; font-weight: 600; color: var(--accent); letter-spacing: .08em; text-transform: uppercase; }
        .divider { width: 1px; height: 20px; background: var(--border); }
        .page-title { font-size: 15px; font-weight: 600; color: var(--text); }
        .topbar-right { display: flex; align-items: center; gap: 12px; }
        .admin-badge { font-size: 12px; color: var(--muted); font-family: var(--mono); }
        .admin-badge span { color: var(--text); font-weight: 500; }
        .logout-btn { padding: 7px 14px; background: transparent; border: 1px solid var(--border); border-radius: 8px; color: var(--muted); font-family: var(--font); font-size: 12px; cursor: pointer; transition: border-color .2s, color .2s; }
        .logout-btn:hover { border-color: var(--red); color: var(--red); }

        /* Content */
        .content { padding: 28px; flex: 1; max-width: 1300px; margin: 0 auto; width: 100%; }

        /* Section title */
        .section-title { font-size: 11px; font-weight: 600; color: var(--muted); font-family: var(--mono); letter-spacing: .1em; text-transform: uppercase; margin-bottom: 14px; margin-top: 28px; }
        .section-title:first-child { margin-top: 0; }

        /* Stat cards */
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
        .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 8px; transition: border-color .2s; }
        .stat-card:hover { border-color: var(--accent); }
        .stat-label { font-size: 11px; color: var(--muted); font-family: var(--mono); text-transform: uppercase; letter-spacing: .08em; }
        .stat-value { font-size: 32px; font-weight: 700; font-family: var(--mono); line-height: 1; }
        .stat-sub { font-size: 11px; color: var(--muted); }
        .c-blue { color: var(--accent); }
        .c-green { color: var(--green); }
        .c-yellow { color: var(--yellow); }
        .c-red { color: var(--red); }
        .c-orange { color: var(--orange); }
        .c-purple { color: #a78bfa; }

        /* Course bars */
        .course-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .course-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 20px; }
        .course-card h3 { font-size: 13px; font-weight: 600; margin-bottom: 16px; }
        .course-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .course-name { font-size: 12px; color: var(--text); min-width: 120px; }
        .bar-wrap { flex: 1; height: 6px; background: var(--panel); border-radius: 3px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--accent), var(--accent2)); transition: width .6s ease; }
        .bar-count { font-size: 11px; color: var(--muted); font-family: var(--mono); min-width: 24px; text-align: right; }

        /* Appt breakdown */
        .appt-breakdown { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
        .appt-chip { padding: 6px 12px; border-radius: 20px; font-size: 11px; font-family: var(--mono); border: 1px solid var(--border); background: var(--panel); }

        /* Tables */
        .table-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .table-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
        .table-head { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
        .table-head h3 { font-size: 13px; font-weight: 600; }
        .view-all { font-size: 11px; color: var(--accent); text-decoration: none; font-family: var(--mono); }
        table { width: 100%; border-collapse: collapse; }
        th { padding: 10px 16px; font-size: 10px; color: var(--muted); font-family: var(--mono); text-transform: uppercase; letter-spacing: .06em; text-align: left; border-bottom: 1px solid var(--border); }
        td { padding: 11px 16px; font-size: 12.5px; border-bottom: 1px solid rgba(31,42,61,.5); }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: var(--panel); }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 20px; font-size: 10px; font-family: var(--mono); font-weight: 500; }
        .badge-pending  { background: rgba(245,200,66,.1);  color: var(--yellow); border: 1px solid rgba(245,200,66,.2); }
        .badge-contacted{ background: rgba(61,139,255,.1);  color: var(--accent); border: 1px solid rgba(61,139,255,.2); }
        .badge-converted{ background: rgba(52,211,153,.1);  color: var(--green);  border: 1px solid rgba(52,211,153,.2); }
        .badge-rejected { background: rgba(248,113,113,.1); color: var(--red);    border: 1px solid rgba(248,113,113,.2); }
        .badge-scheduled{ background: rgba(61,139,255,.1);  color: var(--accent); border: 1px solid rgba(61,139,255,.2); }
        .badge-call     { background: rgba(167,139,250,.1); color: #a78bfa;       border: 1px solid rgba(167,139,250,.2); }
        .badge-visit    { background: rgba(52,211,153,.1);  color: var(--green);  border: 1px solid rgba(52,211,153,.2); }

        /* Nav tabs */
        .nav-tabs { display: flex; gap: 4px; margin-bottom: 24px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 4px; width: fit-content; }
        .tab { padding: 8px 18px; border-radius: 8px; border: none; background: none; color: var(--muted); font-family: var(--font); font-size: 13px; cursor: pointer; transition: background .2s, color .2s; }
        .tab.active { background: var(--panel); color: var(--text); border: 1px solid var(--border); }

        @media (max-width: 768px) {
          .course-grid, .table-grid { grid-template-columns: 1fr; }
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
          .content { padding: 16px; }
        }
      `}</style>

      <div className="dash">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <span className="logo">IDFA.AI</span>
            <div className="divider" />
            <span className="page-title">Admin Dashboard</span>
          </div>
          <div className="topbar-right">
            <span className="admin-badge">Signed in as <span>{admin?.name}</span></span>
            <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>

        <div className="content">
          {/* Nav */}
          <div className="nav-tabs">
            <button className="tab active">Overview</button>
            <a href="/admin" className="tab" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Leads</a>
            <a href="/api/admin/leads/export" className="tab" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Export CSV</a>
          </div>

          {/* Lead Stats */}
          <div className="section-title">Lead Overview</div>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Total Leads</div>
              <div className="stat-value c-blue">{analytics!.leads.total}</div>
              <div className="stat-sub">All time</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending</div>
              <div className="stat-value c-yellow">{analytics!.leads.pending}</div>
              <div className="stat-sub">Awaiting contact</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Contacted</div>
              <div className="stat-value c-blue">{analytics!.leads.contacted}</div>
              <div className="stat-sub">In progress</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Converted</div>
              <div className="stat-value c-green">{analytics!.leads.converted}</div>
              <div className="stat-sub">{conversionRate}% conversion rate</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Rejected</div>
              <div className="stat-value c-red">{analytics!.leads.rejected}</div>
              <div className="stat-sub">Not interested</div>
            </div>
          </div>

          {/* Appointments + Course breakdown */}
          <div className="section-title">Appointments & Courses</div>
          <div className="course-grid">
            {/* Appointments */}
            <div className="course-card">
              <h3>Appointment Overview</h3>
              <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                <div className="stat-card" style={{ padding: "14px" }}>
                  <div className="stat-label">Total</div>
                  <div className="stat-value c-blue" style={{ fontSize: "24px" }}>{analytics!.appointments.total}</div>
                </div>
                <div className="stat-card" style={{ padding: "14px" }}>
                  <div className="stat-label">Scheduled</div>
                  <div className="stat-value c-yellow" style={{ fontSize: "24px" }}>{analytics!.appointments.scheduled}</div>
                </div>
                <div className="stat-card" style={{ padding: "14px" }}>
                  <div className="stat-label">Completed</div>
                  <div className="stat-value c-green" style={{ fontSize: "24px" }}>{analytics!.appointments.completed}</div>
                </div>
              </div>
              <div className="appt-breakdown">
                <span className="appt-chip">📞 Calls: {analytics!.appointments.calls}</span>
                <span className="appt-chip">🏫 Visits: {analytics!.appointments.visits}</span>
                <span className="appt-chip">❌ Cancelled: {analytics!.appointments.cancelled}</span>
              </div>
            </div>

            {/* Leads by Course */}
            <div className="course-card">
              <h3>Leads by Course</h3>
              {analytics!.leadsByCourse.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "13px" }}>No data yet</p>
              ) : (
                analytics!.leadsByCourse.map((c) => {
                  const max = analytics!.leadsByCourse[0]._count.course;
                  const pct = Math.round((c._count.course / max) * 100);
                  return (
                    <div key={c.course} className="course-row">
                      <span className="course-name">{c.course || "Unknown"}</span>
                      <div className="bar-wrap">
                        <div className="bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="bar-count">{c._count.course}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent tables */}
          <div className="section-title">Recent Activity</div>
          <div className="table-grid">
            {/* Recent Leads */}
            <div className="table-card">
              <div className="table-head">
                <h3>Recent Leads</h3>
                <a href="/admin" className="view-all">View all →</a>
              </div>
              <table>
                <thead>
                  <tr><th>Name</th><th>Course</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {analytics!.recentLeads.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{l.name}</div>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>{l.email}</div>
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "12px" }}>{l.course}</td>
                      <td>
                        <span className={`badge badge-${l.status.toLowerCase()}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {analytics!.recentLeads.length === 0 && (
                    <tr><td colSpan={3} style={{ color: "var(--muted)", textAlign: "center", padding: "24px" }}>No leads yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Recent Appointments */}
            <div className="table-card">
              <div className="table-head">
                <h3>Recent Appointments</h3>
              </div>
              <table>
                <thead>
                  <tr><th>Name</th><th>Type</th><th>Date & Time</th></tr>
                </thead>
                <tbody>
                  {analytics!.recentAppointments.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 500 }}>{a.name}</td>
                      <td>
                        <span className={`badge badge-${a.type.toLowerCase()}`}>
                          {a.type === "CALL" ? "📞 Call" : "🏫 Visit"}
                        </span>
                      </td>
                      <td style={{ fontSize: "11px", color: "var(--muted)", fontFamily: "var(--mono)" }}>
                        {a.date}<br />{a.time}
                      </td>
                    </tr>
                  ))}
                  {analytics!.recentAppointments.length === 0 && (
                    <tr><td colSpan={3} style={{ color: "var(--muted)", textAlign: "center", padding: "24px" }}>No appointments yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
