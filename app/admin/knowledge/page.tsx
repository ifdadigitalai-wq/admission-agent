"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { hasPermission, getDefaultPage } from "@/lib/auth/permissions";
import type { Feature } from "@/lib/auth/permissions";

type KnowledgeFile = {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  entries: number;
  status: string;
  error: string | null;
  uploadedBy: string;
  createdAt: string;
};

type Admin = { name: string; email: string; role: string };

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
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
  .logout-btn{padding:7px 14px;border-radius:6px;border:1px solid var(--border);background:#fff;color:var(--ts);font-size:12px;font-weight:500;cursor:pointer;transition:all .2s}
  .logout-btn:hover{background:#fff1f2;border-color:#fecdd3;color:var(--err)}

  .kb-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px}
  .kb-header h2{font-size:16px;font-weight:700}
  .upload-btn{display:flex;align-items:center;gap:8px;padding:9px 18px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;font-family:var(--font)}
  .upload-btn:hover{background:#1d4ed8;transform:translateY(-1px);box-shadow:0 4px 12px rgba(37,99,235,.3)}
  .upload-btn:disabled{opacity:.6;cursor:not-allowed;transform:none;box-shadow:none}
  .upload-btn svg{width:16px;height:16px}

  .format-info{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;gap:20px;flex-wrap:wrap;align-items:center}
  .format-info-label{font-size:11px;font-weight:700;color:var(--ts);text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
  .format-tags{display:flex;gap:6px;flex-wrap:wrap}
  .format-tag{padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;background:var(--asoft);color:var(--accent);font-family:var(--mono)}

  .files-table{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden}
  .files-table table{width:100%;border-collapse:collapse}
  .files-table th{text-align:left;padding:12px 16px;font-size:10px;font-weight:700;color:var(--ts);text-transform:uppercase;letter-spacing:.05em;background:#fafafa;border-bottom:1px solid var(--border)}
  .files-table td{padding:12px 16px;font-size:13px;border-bottom:1px solid var(--border);vertical-align:middle}
  .files-table tr:last-child td{border-bottom:none}
  .files-table tr:hover td{background:#fafbfc}

  .fname{display:flex;align-items:center;gap:10px}
  .ficon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;font-family:var(--mono);text-transform:uppercase;flex-shrink:0}
  .ficon-txt{background:#eff6ff;color:#2563eb}
  .ficon-csv{background:#f0fdf4;color:#16a34a}
  .ficon-json{background:#fef3c7;color:#92400e}
  .ficon-pdf{background:#fee2e2;color:#991b1b}
  .fname-text{font-weight:600;font-size:13px;word-break:break-all}

  .status-badge{padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:4px}
  .status-completed{background:#d1fae5;color:#065f46}
  .status-processing{background:#fef3c7;color:#92400e}
  .status-failed{background:#fee2e2;color:#991b1b}

  .del-btn{background:none;border:1px solid var(--border);border-radius:6px;padding:5px 10px;font-size:11px;font-weight:500;color:var(--ts);cursor:pointer;transition:all .15s;font-family:var(--font)}
  .del-btn:hover{background:#fff1f2;border-color:#fecdd3;color:var(--err)}

  .empty-state{padding:60px 20px;text-align:center}
  .empty-icon{width:48px;height:48px;margin:0 auto 16px;background:var(--panel);border-radius:12px;display:flex;align-items:center;justify-content:center}
  .empty-icon svg{width:24px;height:24px;color:var(--ts)}
  .empty-title{font-size:15px;font-weight:600;margin-bottom:4px}
  .empty-desc{font-size:13px;color:var(--ts)}

  .uploading-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,.4);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:999}
  .uploading-card{background:#fff;border-radius:16px;padding:32px 40px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.15)}
  .uploading-spinner{width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:kspin 1s linear infinite;margin:0 auto 16px}
  @keyframes kspin{to{transform:rotate(360deg)}}
  .uploading-title{font-size:15px;font-weight:600;margin-bottom:4px}
  .uploading-desc{font-size:12px;color:var(--ts)}

  .toast{position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:500;color:#fff;z-index:1000;animation:kslide .3s ease;box-shadow:0 8px 24px rgba(0,0,0,.15)}
  .toast-ok{background:#059669}
  .toast-err{background:#dc2626}
  @keyframes kslide{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}

  @media(max-width:768px){.dash{flex-direction:column}.sidebar{width:100%}.kb-header{flex-direction:column;align-items:flex-start}.format-info{flex-direction:column;gap:8px}}
`;

export default function KnowledgePage() {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "ok" | "err" } | null>(null);
  const router = useRouter();

  const getHeaders = (): HeadersInit => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const showToast = (message: string, type: "ok" | "err") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/knowledge", { headers: getHeaders() });
      const data = await res.json();
      if (data.files) setFiles(data.files);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetch("/api/admin/auth/me", { headers: getHeaders() })
      .then((r) => r.json())
      .then(async (me) => {
        if (me.error) { router.push("/admin/login"); return; }
        if (!hasPermission(me.admin.role, "knowledge")) { router.push(getDefaultPage(me.admin.role)); return; }
        setAdmin(me.admin);
        await fetchFiles();
        setLoading(false);
      })
      .catch(() => router.push("/admin/login"));
  }, []);

  const handleUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,.csv,.json,.pdf";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/knowledge", {
          method: "POST",
          headers: getHeaders(),
          body: formData,
        });
        const data = await res.json();

        if (res.ok) {
          showToast(data.message || "File processed successfully!", "ok");
          await fetchFiles();
        } else {
          showToast(data.error || "Upload failed", "err");
          await fetchFiles();
        }
      } catch {
        showToast("Upload failed — network error", "err");
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const handleDelete = async (id: string, filename: string) => {
    if (!confirm(`Delete "${filename}" and all its knowledge entries?`)) return;

    try {
      const res = await fetch(`/api/admin/knowledge/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || "Deleted successfully", "ok");
        setFiles((prev) => prev.filter((f) => f.id !== id));
      } else {
        showToast(data.error || "Delete failed", "err");
      }
    } catch {
      showToast("Delete failed — network error", "err");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", color: "#64748b", fontFamily: "sans-serif" }}>
        Loading Knowledge Base…
      </div>
    );
  }

  const navItems = [
    { label: "Overview", href: "/admin/dashboard", feature: "overview" as Feature, icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { label: "Conversations", href: "/admin/conversations", feature: "conversations" as Feature, icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { label: "Lead Management", href: "/admin", feature: "leads" as Feature, icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { label: "Data Export", href: "/api/admin/leads/export", feature: "export" as Feature, icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> },
    { label: "Knowledge Base", href: "/admin/knowledge", feature: "knowledge" as Feature, icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg> },
  ];

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
              {navItems
                .filter((i) => hasPermission(admin?.role || "", i.feature))
                .map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className={`nav-link${item.href === "/admin/knowledge" ? " active" : ""}`}>
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
              <h1>Knowledge Base</h1>
              <p>Upload files to teach the AI agent new information.</p>
            </div>
            <div className="user-nav">
              <span className="role-chip">{admin?.role}</span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </header>

          <div className="format-info">
            <span className="format-info-label">Accepted Formats</span>
            <div className="format-tags">
              <span className="format-tag">.csv</span>
              <span className="format-tag">.json</span>
              <span className="format-tag">.txt</span>
              <span className="format-tag">.pdf</span>
            </div>
            <span style={{ fontSize: 11, color: "var(--ts)", marginLeft: "auto" }}>Max 10MB per file</span>
          </div>

          <div className="kb-header">
            <h2>Uploaded Files ({files.length})</h2>
            <button className="upload-btn" onClick={handleUpload} disabled={uploading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload File
            </button>
          </div>

          <div className="files-table">
            {files.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
                <div className="empty-title">No knowledge files uploaded yet</div>
                <div className="empty-desc">Upload a .csv, .json, .txt, or .pdf file to teach the AI agent.</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Size</th>
                    <th>Entries</th>
                    <th>Status</th>
                    <th>Uploaded By</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <div className="fname">
                          <div className={`ficon ficon-${f.fileType}`}>{f.fileType}</div>
                          <span className="fname-text">{f.filename}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)" }}>{formatBytes(f.fileSize)}</td>
                      <td style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700 }}>{f.entries}</td>
                      <td>
                        <span className={`status-badge status-${f.status}`}>
                          {f.status === "processing" && "⏳ "}
                          {f.status === "completed" && "✓ "}
                          {f.status === "failed" && "✕ "}
                          {f.status}
                        </span>
                        {f.error && (
                          <div style={{ fontSize: 10, color: "var(--err)", marginTop: 3, maxWidth: 200 }}>{f.error}</div>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--ts)" }}>{f.uploadedBy}</td>
                      <td style={{ fontSize: 12, color: "var(--ts)", whiteSpace: "nowrap" }}>{formatDate(f.createdAt)}</td>
                      <td>
                        <button className="del-btn" onClick={() => handleDelete(f.id, f.filename)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {uploading && (
        <div className="uploading-overlay">
          <div className="uploading-card">
            <div className="uploading-spinner" />
            <div className="uploading-title">Processing file…</div>
            <div className="uploading-desc">Extracting knowledge and generating embeddings. This may take a moment.</div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </>
  );
}
