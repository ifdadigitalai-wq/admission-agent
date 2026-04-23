"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasPermission, getDefaultPage } from "@/lib/auth/permissions";
import type { Feature } from "@/lib/auth/permissions";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  contactNumber: string | null;
  profilePicture: string | null;
};

type Admin = { name: string; email: string; role: string };

const DEPARTMENTS = ["Management", "Sales", "Tele caller", "Developer", "Marketing"];

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
  .main{flex:1;padding:28px 30px;overflow-y:auto;min-width:0; position: relative;}
  .topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}
  .greeting h1{font-size:22px;font-weight:700;letter-spacing:-.02em}
  .greeting p{font-size:13px;color:var(--ts);margin-top:3px}
  .user-nav{display:flex;align-items:center;gap:12px}
  .role-chip{font-size:10px;color:var(--ts);text-transform:uppercase;letter-spacing:.05em;background:var(--panel);padding:4px 10px;border-radius:20px}
  .logout-btn{padding:7px 14px;border-radius:6px;border:1px solid var(--border);background:#fff;color:var(--ts);font-size:12px;font-weight:500;cursor:pointer;transition:all .2s}
  .logout-btn:hover{background:#fff1f2;border-color:#fecdd3;color:var(--err)}

  .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .add-btn { background: var(--accent); color: #fff; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: background 0.2s;}
  .add-btn:hover { background: #1d4ed8; }
  
  .member-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
  .member-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; position: relative; display: flex; flex-direction: column; gap: 16px; transition: box-shadow 0.2s; }
  .member-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
  
  .m-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .m-avatar { width: 48px; height: 48px; border-radius: 50%; background: var(--panel); object-fit: cover; display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--accent); font-size: 18px; flex-shrink: 0;}
  
  .m-menu-container { position: relative; }
  .m-dots { background: none; border: none; cursor: pointer; color: var(--ts); padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center;}
  .m-dots:hover { background: var(--panel); color: var(--tp); }
  .m-dropdown { position: absolute; top: 100%; right: 0; margin-top: 4px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10; display: flex; flex-direction: column; min-width: 150px; overflow: hidden;}
  .m-drop-item { padding: 10px 14px; font-size: 12px; text-align: left; background: none; border: none; border-bottom: 1px solid var(--border); cursor: pointer; color: var(--tp); font-family: var(--font); }
  .m-drop-item:last-child { border-bottom: none; }
  .m-drop-item:hover { background: var(--panel); }
  .m-drop-item.danger { color: var(--err); }
  
  .m-info { display: flex; flex-direction: column; gap: 4px; }
  .m-name { font-size: 16px; font-weight: 700; color: var(--tp); }
  .m-role { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent); font-weight: 700; background: var(--asoft); align-self: flex-start; padding: 4px 10px; border-radius: 20px; margin-bottom: 4px; }
  
  .m-contact { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; padding-top: 16px; border-top: 1px dashed var(--border); }
  .m-detail { font-size: 12px; color: var(--ts); display: flex; align-items: center; gap: 8px; }
  .m-icon { width: 14px; height: 14px; color: #94a3b8; }

  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); z-index: 100; display: flex; align-items: center; justify-content: center; }
  .modal-box { background: var(--surface); width: 100%; max-width: 420px; border-radius: 12px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
  .modal-hdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .modal-title { font-size: 18px; font-weight: 700; color: var(--tp); }
  .modal-close { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--ts); transition: color 0.2s; }
  .modal-close:hover { color: var(--err); }
  .f-row { margin-bottom: 16px; }
  .f-label { display: block; font-size: 12px; font-weight: 600; color: var(--tp); margin-bottom: 6px; }
  .f-input { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-family: var(--font); font-size: 13px; background: var(--bg); color: var(--tp); outline: none; transition: border-color 0.2s; }
  .f-input:focus { border-color: var(--accent); background: var(--surface); }
  .f-select { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-family: var(--font); font-size: 13px; background: var(--bg); color: var(--tp); outline: none; appearance: none; cursor: pointer; }
  .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border); }
  .btn-cancel { padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--border); background: var(--surface); color: var(--tp); }
  .btn-cancel:hover { background: var(--bg); }
  .btn-save { padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; background: var(--accent); color: #fff; }
  .btn-save:hover { background: #1d4ed8; }
  .btn-save:disabled { opacity: 0.7; cursor: not-allowed; }
  
  @media(max-width:768px){.dash{flex-direction:column}.sidebar{width:100%}}
`;

export default function MembersPage() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Unified Modal State for Add & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editId, setEditId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    role: DEPARTMENTS[0],
    password: "" 
  });

  const router = useRouter();

  const getHeaders = (): HeadersInit => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  };

  useEffect(() => {
    fetch("/api/admin/auth/me", { headers: getHeaders() })
      .then(r => r.json())
      .then((me) => {
        if (me.error) { router.push("/admin/login"); return; }
        if (!hasPermission(me.admin.role, "overview")) { router.push(getDefaultPage(me.admin.role)); return; }
        setAdmin(me.admin);
        fetchMembers();
      })
      .catch(() => router.push("/admin/login"));
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/admin/members", { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (error) {
      console.error("Failed to fetch members", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  const handleRemoveMember = async (id: string) => {
    if(!confirm("Are you sure you want to remove this team member?")) return;
    try {
      const res = await fetch(`/api/admin/members?id=${id}`, { method: "DELETE", headers: getHeaders() });
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== id));
      } else {
        alert("Failed to delete member.");
      }
    } catch (err) {
      console.error(err);
    }
    setActiveDropdown(null);
  };

  // Open modal in ADD mode
  const openAddModal = () => {
    setModalMode("add");
    setFormData({ name: "", email: "", contactNumber: "", role: DEPARTMENTS[0], password: "" });
    setIsModalOpen(true);
  };

  // Helper to map DB Role to Select Option Dropdown
  const getDeptFromRole = (roleStr: string) => {
    const formatted = roleStr.replace("_", " ").toLowerCase();
    return DEPARTMENTS.find(d => d.toLowerCase() === formatted) || DEPARTMENTS[0];
  };

  // Open modal in EDIT mode and populate data
  const openEditModal = (member: TeamMember) => {
    setModalMode("edit");
    setEditId(member.id);
    setFormData({
      name: member.name,
      email: member.email,
      contactNumber: member.contactNumber || "",
      role: getDeptFromRole(member.role),
      password: "" // Keep blank so it's not required for edit
    });
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  // Handle Form Submission for both ADD and EDIT
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formattedRole = formData.role.toUpperCase().replace(" ", "_");
      const payload: any = {
        name: formData.name,
        email: formData.email,
        contactNumber: formData.contactNumber,
        role: formattedRole,
      };

      if (modalMode === "add") {
        payload.password = formData.password;
        const res = await fetch("/api/admin/members", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create member");
        setMembers(prev => [data, ...prev]);
      } else {
        // Edit Mode
        payload.id = editId;
        const res = await fetch("/api/admin/members", {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update member");
        // Update member in UI state
        setMembers(prev => prev.map(m => m.id === editId ? { ...m, ...data } : m));
      }

      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const closeMenu = () => setActiveDropdown(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", color: "#64748b", fontFamily: "sans-serif" }}>
      Loading Team Members…
    </div>
  );

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
                  <a href={item.href} className={`nav-link${item.href === "/admin/dashboard/members" ? " active" : ""}`}>
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
              <h1>Team Members</h1>
              <p>Manage access and roles for your dashboard.</p>
            </div>
            <div className="user-nav">
              <span className="role-chip">{admin?.role}</span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </header>

          <div className="header-actions">
             <div style={{ fontSize: "14px", fontWeight: "600" }}>Total Members ({members.length})</div>
             <button className="add-btn" onClick={openAddModal}>+ Add Member</button>
          </div>

          <div className="member-grid">
            {members.map(member => (
              <div key={member.id} className="member-card">
                <div className="m-top">
                  {member.profilePicture ? (
                    <img src={member.profilePicture} alt={member.name} className="m-avatar" />
                  ) : (
                    <div className="m-avatar">{member.name.charAt(0)}</div>
                  )}
                  
                  <div className="m-menu-container">
                    <button 
                      className="m-dots" 
                      onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === member.id ? null : member.id); }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                    </button>

                    {activeDropdown === member.id && (
                       <div className="m-dropdown">
                          <button className="m-drop-item" onClick={() => openEditModal(member)}>Edit Details & Role</button>
                          <button className="m-drop-item danger" onClick={() => handleRemoveMember(member.id)}>Remove Member</button>
                       </div>
                    )}
                  </div>
                </div>

                <div className="m-info">
                  <span className="m-role">{member.role.replace("_", " ")}</span>
                  <span className="m-name">{member.name}</span>
                </div>

                <div className="m-contact">
                  <div className="m-detail">
                    <svg className="m-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    {member.email}
                  </div>
                  <div className="m-detail">
                    <svg className="m-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    {member.contactNumber || "N/A"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title">{modalMode === "add" ? "Add New Member" : "Edit Member"}</div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="f-row">
                <label className="f-label">Full Name</label>
                <input required type="text" className="f-input" placeholder="e.g. Jane Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="f-row">
                <label className="f-label">Email Address</label>
                <input required type="email" className="f-input" placeholder="jane@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="f-row">
                <label className="f-label">Mobile Number</label>
                <input required type="tel" className="f-input" placeholder="+91 98765 43210" value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} />
              </div>
              <div className="f-row">
                <label className="f-label">Department / Role</label>
                <select className="f-select" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  {DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </select>
              </div>
              
              {/* Only show password requirement when adding a new member */}
              {modalMode === "add" && (
                <div className="f-row">
                  <label className="f-label">Temporary Password</label>
                  <input required type="text" className="f-input" placeholder="Password for login" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              )}
              
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : (modalMode === "add" ? "Add Member" : "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}