"use client";

import { useEffect, useState, useRef } from "react";

type Message = { id: string; role: string; content: string; createdAt: string };
type Conversation = {
  id: string;
  sessionId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  unread: number;
  updatedAt: string;
  messages: Message[];
};

const isWhatsApp = (c: Conversation) => c.sessionId?.startsWith("whatsapp_");

function getInitials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function getDisplayName(c: Conversation) {
  if (c.userName) return c.userName;
  if (isWhatsApp(c)) return c.userPhone ? `+${c.userPhone}` : "WhatsApp User";
  return c.userEmail || "Anonymous Visitor";
}

function timeAgo(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatMsgTime(date: string) {
  return new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function groupByDate(messages: Message[]) {
  const groups: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long",
    });
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.messages.push(msg);
    else groups.push({ date, messages: [msg] });
  });
  return groups;
}

const AVATAR_COLORS = [
  ["#FF6B6B","#fff"], ["#4ECDC4","#fff"], ["#45B7D1","#fff"],
  ["#96CEB4","#fff"], ["#FFEAA7","#333"], ["#DDA0DD","#fff"],
  ["#98D8C8","#333"], ["#F7DC6F","#333"], ["#82E0AA","#fff"],
  ["#F1948A","#fff"], ["#AED6F1","#333"], ["#A9DFBF","#333"],
];
function getAvatarColor(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] as [string, string];
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --white:         #ffffff;
    --bg:            #f0f2f5;
    --sidebar-bg:    #ffffff;
    --header-bg:     #008069;
    --search-bg:     #f0f2f5;
    --border:        #e9edef;
    --item-hover:    #f5f6f6;
    --item-active:   #f0f2f5;
    --text-primary:  #111b21;
    --text-sec:      #667781;
    --text-light:    #8696a0;
    --bubble-out:    #d9fdd3;
    --bubble-out-b:  #c8f0be;
    --bubble-in:     #ffffff;
    --chat-bg:       #efeae2;
    --accent:        #008069;
    --accent-light:  #25d366;
    --unread:        #25d366;
    --red:           #f15c6d;
    --shadow-sm:     0 1px 3px rgba(0,0,0,.08);
    --shadow-md:     0 4px 20px rgba(0,0,0,.12);
    --shadow-lg:     0 8px 40px rgba(0,0,0,.16);
    --font:          'Nunito', sans-serif;
    --mono:          'JetBrains Mono', monospace;
  }
  html, body { height: 100%; overflow: hidden; }
  body { background: var(--bg); color: var(--text-primary); font-family: var(--font); }

  .wa-root { display: flex; height: 100vh; overflow: hidden; }

  /* ── Sidebar ── */
  .wa-sidebar {
    width: 380px; min-width: 380px; background: var(--sidebar-bg);
    border-right: 1px solid var(--border); display: flex;
    flex-direction: column; overflow: hidden;
  }

  .wa-header {
    background: var(--header-bg); padding: 12px 16px;
    display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
  }
  .wa-header-left { display: flex; align-items: center; gap: 12px; }
  .wa-header-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: rgba(255,255,255,.22); border: 2px solid rgba(255,255,255,.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 800; color: #fff;
  }
  .wa-header-title { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -.3px; }
  .wa-header-actions { display: flex; gap: 2px; }
  .wa-hbtn {
    width: 36px; height: 36px; border-radius: 50%; border: none; background: none;
    color: rgba(255,255,255,.85); cursor: pointer; display: flex;
    align-items: center; justify-content: center; transition: background .15s; text-decoration: none;
  }
  .wa-hbtn:hover { background: rgba(255,255,255,.15); color: #fff; }

  .wa-search { padding: 8px 12px; flex-shrink: 0; }
  .wa-search-box {
    display: flex; align-items: center; gap: 10px;
    background: var(--search-bg); border-radius: 8px; padding: 8px 14px;
    transition: box-shadow .2s;
  }
  .wa-search-box:focus-within { box-shadow: 0 0 0 2px rgba(0,128,105,.25); }
  .wa-search-box input {
    background: none; border: none; outline: none;
    font-family: var(--font); font-size: 14px; color: var(--text-primary); width: 100%;
  }
  .wa-search-box input::placeholder { color: var(--text-light); }

  .wa-filters { display: flex; padding: 0 12px 8px; gap: 6px; flex-shrink: 0; }
  .wa-filter {
    padding: 5px 14px; border-radius: 20px; border: 1.5px solid var(--border);
    font-family: var(--font); font-size: 12px; font-weight: 700; cursor: pointer;
    transition: all .18s; background: var(--white); color: var(--text-sec); white-space: nowrap;
  }
  .wa-filter.active { background: #e8f5e9; color: var(--accent); border-color: #c8e6c9; }
  .wa-filter:hover:not(.active) { background: var(--item-hover); }

  .wa-meta-bar {
    padding: 4px 16px 10px; display: flex; gap: 8px; flex-shrink: 0;
  }
  .wa-meta-pill {
    display: flex; align-items: center; gap: 5px; background: var(--search-bg);
    border-radius: 20px; padding: 3px 10px; font-size: 11px;
    color: var(--text-light); font-family: var(--mono);
  }
  .wa-meta-dot { width: 6px; height: 6px; border-radius: 50%; }

  .wa-list { flex: 1; overflow-y: auto; }
  .wa-list::-webkit-scrollbar { width: 3px; }
  .wa-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  /* Conv item */
  .wa-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 16px; cursor: pointer;
    border-bottom: 1px solid var(--border);
    transition: background .12s; position: relative;
  }
  .wa-item:hover { background: var(--item-hover); }
  .wa-item.active { background: var(--item-active); }

  .wa-av-wrap { position: relative; flex-shrink: 0; }
  .wa-av {
    width: 50px; height: 50px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 800; box-shadow: var(--shadow-sm);
  }
  .wa-av-dot {
    position: absolute; bottom: 1px; right: 1px;
    width: 16px; height: 16px; border-radius: 50%;
    border: 2.5px solid var(--white);
    display: flex; align-items: center; justify-content: center;
    font-size: 7px; font-weight: 800; color: #fff;
  }
  .wa-av-dot.wa { background: var(--accent-light); }
  .wa-av-dot.web { background: #0a82f3; }

  .wa-item-body { flex: 1; min-width: 0; }
  .wa-item-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px; }
  .wa-item-name { font-size: 15px; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
  .wa-item-time { font-size: 11px; color: var(--text-light); white-space: nowrap; font-family: var(--mono); }
  .wa-item-time.new { color: var(--accent-light); font-weight: 700; }
  .wa-item-bottom { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  .wa-item-preview { font-size: 13px; color: var(--text-sec); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
  .wa-unread-badge {
    min-width: 20px; height: 20px; border-radius: 10px;
    background: var(--unread); color: #fff;
    font-size: 11px; font-weight: 800; display: flex; align-items: center;
    justify-content: center; padding: 0 5px; font-family: var(--mono); flex-shrink: 0;
  }

  /* Three dot menu */
  .wa-item-menu { position: relative; flex-shrink: 0; }
  .wa-dots {
    width: 28px; height: 28px; border-radius: 50%; border: none; background: none;
    cursor: pointer; display: none; align-items: center; justify-content: center;
    color: var(--text-sec); transition: background .15s, color .15s;
  }
  .wa-item:hover .wa-dots { display: flex; }
  .wa-dots:hover { background: var(--border); color: var(--text-primary); }

  .wa-dropdown {
    position: absolute; right: 0; top: 32px; background: var(--white);
    border-radius: 10px; box-shadow: var(--shadow-md); z-index: 200;
    min-width: 170px; overflow: hidden; border: 1px solid var(--border);
    animation: dropIn .15s ease;
  }
  @keyframes dropIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
  .wa-dd-item {
    display: flex; align-items: center; gap: 10px; padding: 11px 16px;
    font-size: 13.5px; color: var(--text-primary); cursor: pointer;
    transition: background .12s; border: none; background: none;
    width: 100%; text-align: left; font-family: var(--font); font-weight: 600;
  }
  .wa-dd-item:hover { background: var(--item-hover); }
  .wa-dd-item.danger { color: var(--red); }
  .wa-dd-item.danger:hover { background: #fff5f5; }
  .wa-dd-sep { height: 1px; background: var(--border); margin: 2px 0; }

  .wa-empty {
    padding: 48px 20px; text-align: center; color: var(--text-light);
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  }
  .wa-empty-icon {
    width: 64px; height: 64px; border-radius: 50%; background: var(--search-bg);
    display: flex; align-items: center; justify-content: center; font-size: 28px;
  }
  .wa-empty p { font-size: 13px; max-width: 200px; line-height: 1.6; }

  /* ── Chat ── */
  .wa-chat { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; background: var(--chat-bg); }

  .wa-chat-pattern {
    position: absolute; inset: 0; opacity: .045; pointer-events: none; z-index: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23008069' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='40' cy='40' r='4'/%3E%3Ccircle cx='0' cy='0' r='4'/%3E%3Ccircle cx='80' cy='0' r='4'/%3E%3Ccircle cx='0' cy='80' r='4'/%3E%3Ccircle cx='80' cy='80' r='4'/%3E%3C/g%3E%3C/svg%3E");
    background-size: 40px;
  }

  .wa-chat-header {
    background: var(--header-bg); padding: 10px 16px;
    display: flex; align-items: center; gap: 12px;
    z-index: 10; position: relative; flex-shrink: 0;
    box-shadow: 0 1px 4px rgba(0,0,0,.18);
  }
  .wa-chat-back {
    background: none; border: none; cursor: pointer;
    color: rgba(255,255,255,.85); padding: 4px;
    display: flex; align-items: center; transition: color .15s;
  }
  .wa-chat-back:hover { color: #fff; }
  .wa-chat-av {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 800; flex-shrink: 0;
    border: 2px solid rgba(255,255,255,.25);
  }
  .wa-chat-info { flex: 1; }
  .wa-chat-name { font-size: 15px; font-weight: 700; color: #fff; }
  .wa-chat-sub { font-size: 11.5px; color: rgba(255,255,255,.75); margin-top: 1px; }
  .wa-chat-chip {
    padding: 4px 10px; border-radius: 20px; font-size: 11px;
    font-family: var(--mono); font-weight: 600;
    background: rgba(255,255,255,.18); color: #fff;
  }

  .wa-messages {
    flex: 1; overflow-y: auto; padding: 16px 60px;
    display: flex; flex-direction: column; gap: 2px;
    position: relative; z-index: 1;
  }
  .wa-messages::-webkit-scrollbar { width: 4px; }
  .wa-messages::-webkit-scrollbar-thumb { background: rgba(0,0,0,.15); border-radius: 2px; }

  .wa-date-sep { display: flex; align-items: center; justify-content: center; margin: 14px 0; }
  .wa-date-pill {
    background: rgba(255,255,255,.88); color: #54656f;
    font-size: 11.5px; padding: 5px 14px; border-radius: 8px;
    font-family: var(--mono); box-shadow: var(--shadow-sm); backdrop-filter: blur(4px);
  }

  .wa-brow { display: flex; margin-bottom: 2px; }
  .wa-brow.out { justify-content: flex-end; }
  .wa-brow.in { justify-content: flex-start; }

  .wa-bubble {
    max-width: 65%; min-width: 80px; padding: 8px 10px 6px;
    border-radius: 8px; font-size: 14px; line-height: 1.55;
    white-space: pre-wrap; word-break: break-word; position: relative;
    box-shadow: 0 1px 2px rgba(0,0,0,.1);
  }
  .wa-bubble.in {
    background: var(--bubble-in); border-top-left-radius: 0; color: var(--text-primary);
  }
  .wa-bubble.out {
    background: var(--bubble-out); border-top-right-radius: 0;
    color: var(--text-primary); border: 1px solid var(--bubble-out-b);
  }
  .wa-bubble.in::before {
    content: ''; position: absolute; top: 0; left: -8px;
    border-width: 0 8px 8px 0; border-style: solid;
    border-color: transparent var(--bubble-in) transparent transparent;
  }
  .wa-bubble.out::after {
    content: ''; position: absolute; top: 0; right: -8px;
    border-width: 0 0 8px 8px; border-style: solid;
    border-color: transparent transparent transparent var(--bubble-out);
  }
  .wa-bmeta { display: flex; align-items: center; justify-content: flex-end; gap: 4px; margin-top: 3px; }
  .wa-btime { font-size: 10.5px; color: #667781; }
  .wa-btick { font-size: 11px; color: #53bdeb; }

  /* No chat */
  .wa-nochat {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 18px;
    position: relative; z-index: 1;
  }
  .wa-nochat-ring {
    width: 100px; height: 100px; border-radius: 50%;
    background: rgba(255,255,255,.7); border: 3px solid rgba(0,128,105,.15);
    display: flex; align-items: center; justify-content: center; font-size: 44px;
    box-shadow: var(--shadow-md);
  }
  .wa-nochat h3 { font-size: 24px; font-weight: 800; color: #41525d; }
  .wa-nochat p { font-size: 14px; color: #667781; text-align: center; max-width: 300px; line-height: 1.6; }
  .wa-nochat hr { width: 48px; border: none; border-top: 2px solid var(--border); }
  .wa-nochat-lock {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: #8696a0; font-family: var(--mono);
  }

  /* Loading */
  .wa-loading {
    flex: 1; display: flex; align-items: center; justify-content: center;
    gap: 10px; color: var(--text-sec); font-size: 13px; z-index: 1; position: relative;
  }
  .wa-spinner {
    width: 20px; height: 20px; border: 2.5px solid var(--border);
    border-top-color: var(--accent); border-radius: 50%;
    animation: spin .6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Delete modal */
  .wa-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.45);
    display: flex; align-items: center; justify-content: center; z-index: 999;
    animation: fadeIn .18s ease;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .wa-modal {
    background: var(--white); border-radius: 16px; padding: 28px;
    max-width: 360px; width: 90%; box-shadow: var(--shadow-lg);
    animation: modalUp .2s ease;
  }
  @keyframes modalUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .wa-modal h3 { font-size: 17px; font-weight: 800; margin-bottom: 8px; }
  .wa-modal p { font-size: 13.5px; color: var(--text-sec); line-height: 1.55; margin-bottom: 22px; }
  .wa-modal-btns { display: flex; gap: 10px; justify-content: flex-end; }
  .wa-btn-cancel {
    padding: 9px 20px; border-radius: 8px; border: 1.5px solid var(--border);
    background: none; font-family: var(--font); font-size: 13px; font-weight: 700;
    color: var(--text-sec); cursor: pointer; transition: background .15s;
  }
  .wa-btn-cancel:hover { background: var(--item-hover); }
  .wa-btn-del {
    padding: 9px 20px; border-radius: 8px; border: none; background: var(--red);
    color: #fff; font-family: var(--font); font-size: 13px; font-weight: 700;
    cursor: pointer; transition: opacity .15s;
  }
  .wa-btn-del:hover:not(:disabled) { opacity: .88; }
  .wa-btn-del:disabled { opacity: .5; }

  /* Toast */
  .wa-toast {
    position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
    background: #1a1a1a; color: #fff; border-radius: 24px;
    padding: 10px 22px; font-size: 13px; font-weight: 700;
    z-index: 9999; box-shadow: var(--shadow-lg); pointer-events: none;
    animation: toastIn .25s ease;
  }
  @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }

  @media (max-width: 768px) {
    .wa-sidebar { width: 100%; min-width: unset; }
    .wa-chat { display: none; position: absolute; inset: 0; z-index: 100; }
    .wa-chat.open { display: flex; }
    .wa-messages { padding: 16px; }
  }
`;

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "website" | "whatsapp">("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const getHeaders = (): HeadersInit => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchConversations = async () => {
    const data = await fetch("/api/admin/conversations", { headers: getHeaders() }).then((r) => r.json());
    if (Array.isArray(data)) setConversations(data);
  };

  useEffect(() => {
    fetchConversations().finally(() => setLoading(false));
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages]);

  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".wa-item-menu")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", fn);
    return () => document.removeEventListener("click", fn);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const openConversation = async (conv: Conversation) => {
    setChatLoading(true);
    setOpenMenuId(null);
    try {
      const text = await fetch(`/api/admin/conversations/${conv.id}`, { headers: getHeaders() }).then((r) => r.text());
      const data = JSON.parse(text);
      if (!data.error) {
        setActive(data);
        setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, unread: 0 } : c));
      }
    } catch (e) { console.error(e); }
    finally { setChatLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/conversations/${deleteTarget.id}`, {
        method: "DELETE", headers: getHeaders(),
      });
      setConversations((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      if (active?.id === deleteTarget.id) setActive(null);
      showToast("✓ Conversation deleted");
    } catch (e) { console.error(e); }
    finally { setDeleting(false); setDeleteTarget(null); }
  };

  const filtered = conversations.filter((c) => {
    const name = getDisplayName(c).toLowerCase();
    return name.includes(search.toLowerCase()) && (
      filter === "all" ||
      (filter === "whatsapp" && isWhatsApp(c)) ||
      (filter === "website" && !isWhatsApp(c))
    );
  });

  const totalUnread = conversations.reduce((s, c) => s + (c.unread || 0), 0);
  const waCount = conversations.filter(isWhatsApp).length;
  const webCount = conversations.filter((c) => !isWhatsApp(c)).length;

  return (
    <>
      <style>{CSS}</style>

      {/* Delete modal */}
      {deleteTarget && (
        <div className="wa-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="wa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete conversation?</h3>
            <p>
              This will permanently delete the conversation with{" "}
              <strong>{getDisplayName(deleteTarget)}</strong> and all its messages.
              This cannot be undone.
            </p>
            <div className="wa-modal-btns">
              <button className="wa-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="wa-btn-del" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="wa-toast">{toast}</div>}

      <div className="wa-root">

        {/* ── Sidebar ── */}
        <div className="wa-sidebar">
          <div className="wa-header">
            <div className="wa-header-left">
              <div className="wa-header-avatar">A</div>
              <span className="wa-header-title">Conversations</span>
            </div>
            <div className="wa-header-actions">
              <a href="/admin/dashboard" className="wa-hbtn" title="Dashboard">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
              </a>
              <button className="wa-hbtn" onClick={fetchConversations} title="Refresh">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="wa-search">
            <div className="wa-search-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input placeholder="Search conversations…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="wa-filters">
            <button className={`wa-filter ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
              All {totalUnread > 0 && `· ${totalUnread}`}
            </button>
            <button className={`wa-filter ${filter === "whatsapp" ? "active" : ""}`} onClick={() => setFilter("whatsapp")}>
              📱 WhatsApp ({waCount})
            </button>
            <button className={`wa-filter ${filter === "website" ? "active" : ""}`} onClick={() => setFilter("website")}>
              🌐 Website ({webCount})
            </button>
          </div>

          <div className="wa-meta-bar">
            <div className="wa-meta-pill">
              <div className="wa-meta-dot" style={{ background: "#25d366" }} />
              {conversations.length} chats
            </div>
            {totalUnread > 0 && (
              <div className="wa-meta-pill">
                <div className="wa-meta-dot" style={{ background: "#f15c6d" }} />
                {totalUnread} unread
              </div>
            )}
          </div>

          <div className="wa-list">
            {loading ? (
              <div className="wa-empty"><div className="wa-empty-icon">⏳</div><p>Loading…</p></div>
            ) : filtered.length === 0 ? (
              <div className="wa-empty">
                <div className="wa-empty-icon">💬</div>
                <p>{search ? "No results found." : "No conversations yet."}</p>
              </div>
            ) : filtered.map((conv) => {
              const name = getDisplayName(conv);
              const wa = isWhatsApp(conv);
              const lastMsg = conv.messages?.[0];
              const preview = lastMsg?.content || "No messages";
              const [bgColor, textColor] = getAvatarColor(name);

              return (
                <div
                  key={conv.id}
                  className={`wa-item ${active?.id === conv.id ? "active" : ""}`}
                  onClick={() => openConversation(conv)}
                >
                  <div className="wa-av-wrap">
                    <div className="wa-av" style={{ background: bgColor, color: textColor }}>
                      {getInitials(name)}
                    </div>
                    <div className={`wa-av-dot ${wa ? "wa" : "web"}`}>
                      {wa ? "W" : "G"}
                    </div>
                  </div>

                  <div className="wa-item-body">
                    <div className="wa-item-top">
                      <span className="wa-item-name">{name}</span>
                      <span className={`wa-item-time ${conv.unread > 0 ? "new" : ""}`}>
                        {timeAgo(conv.updatedAt)}
                      </span>
                    </div>
                    <div className="wa-item-bottom">
                      <span className="wa-item-preview">
                        {lastMsg?.role === "bot" ? "🤖 " : ""}
                        {preview.length > 40 ? preview.slice(0, 40) + "…" : preview}
                      </span>
                      {conv.unread > 0 && (
                        <span className="wa-unread-badge">{conv.unread > 99 ? "99+" : conv.unread}</span>
                      )}
                    </div>
                  </div>

                  {/* Three dot menu */}
                  <div className="wa-item-menu">
                    <button
                      className="wa-dots"
                      onClick={(e) => {
                        e.stopPropagation(); // ✅ prevent opening the conversation
                        setOpenMenuId(openMenuId === conv.id ? null : conv.id);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="1.8"/>
                        <circle cx="12" cy="12" r="1.8"/>
                        <circle cx="12" cy="19" r="1.8"/>
                      </svg>
                    </button>

                    {openMenuId === conv.id && (
                      <div className="wa-dropdown">
                        <button
                          className="wa-dd-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            openConversation(conv);
                            setOpenMenuId(null);
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          Open chat
                        </button>
                        <div className="wa-dd-sep" />
                        <button
                          className="wa-dd-item danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(conv);
                            setOpenMenuId(null);
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                          </svg>
                          Delete chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Chat area ── */}
        <div className={`wa-chat ${active ? "open" : ""}`}>
          <div className="wa-chat-pattern" />

          {!active ? (
            <div className="wa-nochat">
              <div className="wa-nochat-ring">💬</div>
              <h3>IDFA Conversations</h3>
              <p>Select a conversation to view messages from website visitors and WhatsApp users.</p>
              <hr />
              <div className="wa-nochat-lock">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Monitored by IDFA Admin
              </div>
            </div>
          ) : chatLoading ? (
            <div className="wa-loading"><div className="wa-spinner" />Loading messages…</div>
          ) : (
            <>
              <div className="wa-chat-header">
                <button className="wa-chat-back" onClick={() => setActive(null)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                {(() => {
                  const name = getDisplayName(active);
                  const [bg, tc] = getAvatarColor(name);
                  return <div className="wa-chat-av" style={{ background: bg, color: tc }}>{getInitials(name)}</div>;
                })()}
                <div className="wa-chat-info">
                  <div className="wa-chat-name">{getDisplayName(active)}</div>
                  <div className="wa-chat-sub">
                    {[active.userEmail, active.userPhone].filter(Boolean).join(" · ") || "Anonymous visitor"}
                  </div>
                </div>
                <span className={`wa-chat-chip ${isWhatsApp(active) ? "wa" : "web"}`}>
                  {isWhatsApp(active) ? "📱 WhatsApp" : "🌐 Website"}
                </span>
              </div>

              <div className="wa-messages">
                {active.messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#8696a0", fontSize: "13px", marginTop: "40px" }}>
                    No messages yet.
                  </div>
                ) : groupByDate(active.messages).map((group) => (
                  <div key={group.date}>
                    <div className="wa-date-sep">
                      <span className="wa-date-pill">{group.date}</span>
                    </div>
                    {group.messages.map((msg) => {
                      const isOut = msg.role === "bot";
                      return (
                        <div key={msg.id} className={`wa-brow ${isOut ? "out" : "in"}`}>
                          <div className={`wa-bubble ${isOut ? "out" : "in"}`}>
                            {msg.content}
                            <div className="wa-bmeta">
                              <span className="wa-btime">{formatMsgTime(msg.createdAt)}</span>
                              {isOut && <span className="wa-btick">✓✓</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}