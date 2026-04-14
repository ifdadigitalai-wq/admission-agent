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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", color: "#64748b", fontFamily: "sans-serif" }}>
      <div className="loader">Loading IDFA Intelligence...</div>
    </div>
  );

  const conversionRate = analytics!.leads.total > 0
    ? Math.round((analytics!.leads.converted / analytics!.leads.total) * 100)
    : 0;

  // New Analysis Logic: Efficiency Score
  const efficiencyScore = analytics!.leads.total > 0 
    ? Math.round(((analytics!.leads.contacted + analytics!.leads.converted) / analytics!.leads.total) * 100)
    : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        
        :root {
          --bg: #f8fafc;
          --surface: #ffffff;
          --border: #e2e8f0;
          --panel: #f1f5f9;
          --accent: #2563eb;
          --accent-soft: rgba(37, 99, 235, 0.05);
          --text-primary: #0f172a;
          --text-secondary: #64748b;
          --success: #10b981;
          --warning: #f59e0b;
          --danger: #ef4444;
          --font-main: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
        }

        body { background: var(--bg); color: var(--text-primary); font-family: var(--font-main); -webkit-font-smoothing: antialiased; }

        /* Layout */
        .dash { min-height: 100vh; display: flex; flex-direction: column; }
        .topbar { 
          display: flex; align-items: center; justify-content: space-between; 
          padding: 0 32px; height: 64px; background: var(--surface); 
          border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100;
        }

        /* Branding */
        .brand { display: flex; align-items: center; gap: 12px; }
        .logo-mark { background: var(--accent); color: white; padding: 4px 8px; border-radius: 6px; font-family: var(--font-mono); font-weight: 700; font-size: 12px; }
        .brand-name { font-weight: 700; font-size: 16px; letter-spacing: -0.02em; }

        /* User Profile */
        .user-nav { display: flex; align-items: center; gap: 20px; }
        .user-info { text-align: right; }
        .user-name { display: block; font-size: 13px; font-weight: 600; }
        .user-role { display: block; font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
        
        .logout-btn { 
          padding: 8px 16px; border-radius: 6px; border: 1px solid var(--border);
          background: white; color: var(--text-secondary); font-size: 12px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .logout-btn:hover { background: #fff1f2; border-color: #fecdd3; color: var(--danger); }

        /* Main Content */
        .content { padding: 32px; max-width: 1400px; margin: 0 auto; width: 100%; }

        /* Nav Tabs */
        .navigation { display: flex; gap: 8px; margin-bottom: 32px; border-bottom: 1px solid var(--border); padding-bottom: 1px; }
        .nav-link { 
          padding: 12px 16px; font-size: 14px; font-weight: 500; color: var(--text-secondary);
          text-decoration: none; border-bottom: 2px solid transparent; transition: all 0.2s;
        }
        .nav-link:hover { color: var(--accent); }
        .nav-link.active { color: var(--accent); border-bottom-color: var(--accent); }

        /* Grid Headers */
        .grid-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 16px; margin-top: 40px; }
        .grid-header:first-of-type { margin-top: 0; }
        .grid-header h2 { font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }

        /* Stat Cards */
        .stats-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
        .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 24px; transition: transform 0.2s, box-shadow 0.2s; }
        .card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
        
        .card-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
        .card-value { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; color: var(--text-primary); }
        .card-meta { margin-top: 12px; font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; }
        
        .trend-up { color: var(--success); font-weight: 600; }
        .trend-neutral { color: var(--accent); font-weight: 600; }

        /* Data Visualization Area */
        .viz-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; margin-top: 20px; }
        
        /* Bar Chart Styling */
        .course-item { margin-bottom: 16px; }
        .course-meta { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
        .course-progress-bg { height: 8px; background: var(--panel); border-radius: 4px; overflow: hidden; }
        .course-progress-fill { height: 100%; background: var(--accent); border-radius: 4px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }

        /* Table Components */
        .table-wrapper { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
        .table-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: #fafafa; }
        .table-header h3 { font-size: 14px; font-weight: 600; }
        
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 12px 20px; font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; background: #fafafa; }
        td { padding: 14px 20px; font-size: 13px; border-bottom: 1px solid var(--border); vertical-align: middle; }
        tr:last-child td { border-bottom: none; }
        
        /* Status Pills */
        .status-pill { 
          padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; 
          text-transform: capitalize; display: inline-flex; align-items: center;
        }
        .status-pill.pending { background: #fef3c7; color: #92400e; }
        .status-pill.contacted { background: #dbeafe; color: #1e40af; }
        .status-pill.converted { background: #d1fae5; color: #065f46; }
        .status-pill.rejected { background: #fee2e2; color: #991b1b; }

        /* Analysis Chip */
        .analysis-chip { 
          background: var(--accent-soft); color: var(--accent); 
          padding: 4px 12px; border-radius: 50px; font-size: 11px; font-weight: 600; 
        }

        @media (max-width: 1024px) {
          .viz-grid, .stats-container { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="dash">
        <header className="topbar">
          <div className="brand">
            <span className="logo-mark">IDFA</span>
            <span className="brand-name">Intelligence Console</span>
          </div>
          <div className="user-nav">
            <div className="user-info">
              <span className="user-name">{admin?.name}</span>
              <span className="user-role">{admin?.role}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <main className="content">
          <nav className="navigation">
            <a href="#" className="nav-link active">Overview</a>
            <a href="/admin/conversations" className="nav-link">Conversations</a>
            <a href="/admin" className="nav-link">Leads Management</a>
            <a href="/api/admin/leads/export" className="nav-link">Data Export</a>
          </nav>

          <div className="grid-header">
            <h2>Acquisition Performance</h2>
            <span className="analysis-chip">Pipeline Efficiency: {efficiencyScore}%</span>
          </div>

          <div className="stats-container">
            <div className="card">
              <div className="card-label">Capture Volume</div>
              <div className="card-value">{analytics!.leads.total}</div>
              <div className="card-meta">Total Inbound Leads</div>
            </div>
            <div className="card">
              <div className="card-label">Conversion Rate</div>
              <div className="card-value">{conversionRate}%</div>
              <div className="card-meta">
                <span className={conversionRate > 20 ? "trend-up" : "trend-neutral"}>
                  {conversionRate > 20 ? "High Performance" : "Baseline Growth"}
                </span>
              </div>
            </div>
            <div className="card">
              <div className="card-label">Active Pipeline</div>
              <div className="card-value">{analytics!.leads.pending + analytics!.leads.contacted}</div>
              <div className="card-meta">Requiring Attention</div>
            </div>
            <div className="card">
              <div className="card-label">Completed Meets</div>
              <div className="card-value">{analytics!.appointments.completed}</div>
              <div className="card-meta">Counseling Sessions</div>
            </div>
          </div>

          <div className="viz-grid">
            {/* Table Area */}
            <div className="table-wrapper">
              <div className="table-header">
                <h3>Priority Leads</h3>
                <a href="/admin" style={{fontSize: '12px', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none'}}>View Full Ledger →</a>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Lead Identity</th>
                    <th>Interest Area</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics!.recentLeads.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <div style={{fontWeight: 600}}>{l.name}</div>
                        <div style={{fontSize: '11px', color: 'var(--text-secondary)'}}>{l.phone}</div>
                      </td>
                      <td>{l.course}</td>
                      <td>
                        <span className={`status-pill ${l.status.toLowerCase()}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Side Analysis Area */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
              <div className="card" style={{flex: 1}}>
                <div className="card-label">Course Distribution</div>
                <div style={{marginTop: '20px'}}>
                  {analytics!.leadsByCourse.length === 0 ? (
                    <p style={{color: 'var(--text-secondary)', fontSize: '13px'}}>Awaiting market data...</p>
                  ) : (
                    analytics!.leadsByCourse.map((c, i) => {
                      const max = analytics!.leadsByCourse[0]._count.course;
                      const pct = Math.round((c._count.course / max) * 100);
                      return (
                        <div key={i} className="course-item">
                          <div className="course-meta">
                            <span style={{fontWeight: 500}}>{c.course || "General Inquiry"}</span>
                            <span style={{fontFamily: 'var(--font-mono)', fontSize: '11px'}}>{c._count.course}</span>
                          </div>
                          <div className="course-progress-bg">
                            <div className="course-progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-label">Appointment Split</div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '10px'}}>
                  <div>
                    <div style={{fontSize: '20px', fontWeight: 700}}>{analytics!.appointments.calls}</div>
                    <div style={{fontSize: '11px', color: 'var(--text-secondary)'}}>Virtual Calls</div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{fontSize: '20px', fontWeight: 700}}>{analytics!.appointments.visits}</div>
                    <div style={{fontSize: '11px', color: 'var(--text-secondary)'}}>Campus Visits</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid-header">
            <h2>Recent Scheduled Events</h2>
          </div>
          
          <div className="table-wrapper" style={{marginBottom: '40px'}}>
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Engagement</th>
                  <th>Schedule</th>
                </tr>
              </thead>
              <tbody>
                {analytics!.recentAppointments.map((a) => (
                  <tr key={a.id}>
                    <td style={{fontWeight: 600}}>{a.name}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                        background: a.type === 'CALL' ? '#e0f2fe' : '#f0fdf4',
                        color: a.type === 'CALL' ? '#0369a1' : '#15803d'
                      }}>
                        {a.type === "CALL" ? "VOICE CONSULT" : "ONSITE VISIT"}
                      </span>
                    </td>
                    <td style={{fontFamily: 'var(--font-mono)', fontSize: '12px'}}>
                      {a.date} <span style={{color: 'var(--text-secondary)'}}>at</span> {a.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </>
  );
}