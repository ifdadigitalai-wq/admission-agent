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

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    /* WhatsApp-inspired but premium dark */
    --bg:           #0a1014;
    --sidebar-bg:   #111b21;
    --sidebar-top:  #202c33;
    --chat-bg:      #0d1418;
    --chat-pattern: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2325d366' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    --header-bg:    #202c33;
    --border:       #2a3942;
    --item-hover:   #2a3942;
    --item-active:  #2a3942;
    --wa:           #25d366;
    --wa-light:     #dcf8c6;
    --wa-dark:      #128c7e;
    --accent:       #00a884;
    --text:         #e9edef;
    --text-sec:     #8696a0;
    --bubble-out:   #005c4b;
    --bubble-in:    #202c33;
    --unread:       #25d366;
    --search-bg:    #2a3942;
    --font:         'Nunito', sans-serif;
    --mono:         'JetBrains Mono', monospace;
  }

  html, body { height: 100%; overflow: hidden; }
  body { background: var(--bg); color: var(--text); font-family: var(--font); }

  /* ── Root layout ── */
  .wa-root { display: flex; height: 100vh; overflow: hidden; }

  /* ── Sidebar ── */
  .wa-sidebar {
    width: 380px; min-width: 380px;
    background: var(--sidebar-bg);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    overflow: hidden;
  }

  /* Sidebar header */
  .wa-sidebar-header {
    background: var(--sidebar-top);
    padding: 10px 16px;
    display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0;
  }
  .wa-sidebar-header-left { display: flex; align-items: center; gap: 12px; }
  .wa-admin-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: linear-gradient(135deg, var(--wa), var(--wa-dark));
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .wa-admin-info { display: flex; flex-direction: column; }
  .wa-admin-name { font-size: 15px; font-weight: 700; color: var(--text); }
  .wa-admin-role { font-size: 11px; color: var(--text-sec); font-family: var(--mono); }
  .wa-header-actions { display: flex; gap: 4px; }
  .wa-icon-btn {
    width: 36px; height: 36px; border-radius: 50%; border: none;
    background: none; color: var(--text-sec); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .2s, color .2s;
  }
  .wa-icon-btn:hover { background: rgba(255,255,255,.08); color: var(--text); }

  /* Search */
  .wa-search {
    padding: 8px 12px;
    background: var(--sidebar-bg);
    flex-shrink: 0;
  }
  .wa-search-inner {
    display: flex; align-items: center; gap: 10px;
    background: var(--search-bg); border-radius: 8px;
    padding: 8px 12px;
  }
  .wa-search-inner input {
    background: none; border: none; outline: none;
    font-family: var(--font); font-size: 14px; color: var(--text);
    width: 100%;
  }
  .wa-search-inner input::placeholder { color: var(--text-sec); }

  /* Filter tabs */
  .wa-filters {
    display: flex; padding: 0 12px 8px;
    gap: 6px; flex-shrink: 0;
  }
  .wa-filter {
    padding: 5px 14px; border-radius: 20px; border: none;
    font-family: var(--font); font-size: 12px; font-weight: 600;
    cursor: pointer; transition: background .2s, color .2s;
    background: var(--search-bg); color: var(--text-sec);
  }
  .wa-filter.active { background: var(--wa); color: #000; }

  /* Conv list */
  .wa-conv-list { flex: 1; overflow-y: auto; }
  .wa-conv-list::-webkit-scrollbar { width: 4px; }
  .wa-conv-list::-webkit-scrollbar-track { background: transparent; }
  .wa-conv-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .wa-conv-item {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px; cursor: pointer;
    border-bottom: 1px solid rgba(42,57,66,.5);
    transition: background .15s; position: relative;
  }
  .wa-conv-item:hover { background: var(--item-hover); }
  .wa-conv-item.active { background: var(--item-active); }

  .wa-conv-avatar-wrap { position: relative; flex-shrink: 0; }
  .wa-conv-avatar {
    width: 48px; height: 48px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 700; color: #fff;
    flex-shrink: 0;
  }
  .wa-conv-avatar.website { background: linear-gradient(135deg, #3d8bff, #6c63ff); }
  .wa-conv-avatar.whatsapp { background: linear-gradient(135deg, #25d366, #128c7e); }
  .wa-source-dot {
    position: absolute; bottom: 0; right: 0;
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid var(--sidebar-bg);
    display: flex; align-items: center; justify-content: center;
    font-size: 8px;
  }
  .wa-source-dot.wa { background: #25d366; }
  .wa-source-dot.web { background: #3d8bff; }

  .wa-conv-body { flex: 1; min-width: 0; }
  .wa-conv-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px; }
  .wa-conv-name { font-size: 15px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
  .wa-conv-time { font-size: 11px; color: var(--text-sec); white-space: nowrap; }
  .wa-conv-time.unread { color: var(--wa); }
  .wa-conv-bottom { display: flex; align-items: center; justify-content: space-between; }
  .wa-conv-preview { font-size: 13px; color: var(--text-sec); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
  .wa-conv-preview.bot-preview::before { content: "🤖 "; }
  .wa-unread {
    min-width: 20px; height: 20px; border-radius: 10px;
    background: var(--wa); color: #000; font-size: 11px;
    font-weight: 700; display: flex; align-items: center;
    justify-content: center; padding: 0 5px; font-family: var(--mono);
    flex-shrink: 0;
  }
  .wa-conv-empty { padding: 40px 20px; text-align: center; color: var(--text-sec); font-size: 13px; }

  /* ── Chat area ── */
  .wa-chat { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }

  /* Chat background pattern */
  .wa-chat-bg {
    position: absolute; inset: 0;
    background: var(--chat-bg);
    background-image: var(--chat-pattern);
    z-index: 0;
  }

  /* Chat header */
  .wa-chat-header {
    background: var(--header-bg);
    padding: 10px 16px;
    display: flex; align-items: center; gap: 12px;
    z-index: 10; position: relative; flex-shrink: 0;
    border-bottom: 1px solid var(--border);
  }
  .wa-chat-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .wa-chat-avatar.website { background: linear-gradient(135deg, #3d8bff, #6c63ff); }
  .wa-chat-avatar.whatsapp { background: linear-gradient(135deg, #25d366, #128c7e); }
  .wa-chat-info { flex: 1; }
  .wa-chat-name { font-size: 15px; font-weight: 700; color: var(--text); }
  .wa-chat-status { font-size: 12px; color: var(--text-sec); margin-top: 1px; }
  .wa-source-badge {
    padding: 4px 10px; border-radius: 20px; font-size: 11px;
    font-family: var(--mono); font-weight: 600;
  }
  .wa-source-badge.wa { background: rgba(37,211,102,.15); color: var(--wa); border: 1px solid rgba(37,211,102,.25); }
  .wa-source-badge.web { background: rgba(61,139,255,.15); color: #3d8bff; border: 1px solid rgba(61,139,255,.25); }

  /* Messages */
  .wa-messages {
    flex: 1; overflow-y: auto; padding: 20px 60px;
    display: flex; flex-direction: column; gap: 4px;
    position: relative; z-index: 1;
  }
  .wa-messages::-webkit-scrollbar { width: 4px; }
  .wa-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 2px; }

  /* Date separator */
  .wa-date-sep {
    display: flex; align-items: center; justify-content: center;
    margin: 12px 0;
  }
  .wa-date-label {
    background: var(--header-bg); color: var(--text-sec);
    font-size: 11.5px; padding: 5px 12px; border-radius: 8px;
    font-family: var(--mono); border: 1px solid var(--border);
  }

  /* Bubble */
  .wa-bubble-row { display: flex; margin-bottom: 2px; }
  .wa-bubble-row.out { justify-content: flex-end; }
  .wa-bubble-row.in { justify-content: flex-start; }

  .wa-bubble {
    max-width: 65%; min-width: 80px;
    padding: 7px 10px 6px;
    border-radius: 8px;
    font-size: 14px; line-height: 1.55;
    white-space: pre-wrap; word-break: break-word;
    position: relative;
    box-shadow: 0 1px 2px rgba(0,0,0,.3);
  }
  .wa-bubble.in {
    background: var(--bubble-in);
    border-top-left-radius: 0;
    color: var(--text);
  }
  .wa-bubble.out {
    background: var(--bubble-out);
    border-top-right-radius: 0;
    color: #e9edef;
  }

  /* Bubble tail */
  .wa-bubble.in::before {
    content: '';
    position: absolute; top: 0; left: -8px;
    border-width: 0 8px 8px 0;
    border-style: solid;
    border-color: transparent var(--bubble-in) transparent transparent;
  }
  .wa-bubble.out::after {
    content: '';
    position: absolute; top: 0; right: -8px;
    border-width: 0 0 8px 8px;
    border-style: solid;
    border-color: transparent transparent transparent var(--bubble-out);
  }

  .wa-bubble-meta {
    display: flex; align-items: center; justify-content: flex-end;
    gap: 4px; margin-top: 3px;
  }
  .wa-bubble-time { font-size: 10.5px; color: rgba(233,237,239,.55); }
  .wa-tick { font-size: 11px; color: #53bdeb; }

  /* No chat selected */
  .wa-no-chat {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 16px; position: relative; z-index: 1;
  }
  .wa-no-chat-icon {
    width: 80px; height: 80px; border-radius: 50%;
    background: rgba(37,211,102,.1); border: 2px solid rgba(37,211,102,.2);
    display: flex; align-items: center; justify-content: center; font-size: 36px;
  }
  .wa-no-chat h3 { font-size: 22px; font-weight: 600; color: var(--text); }
  .wa-no-chat p { font-size: 14px; color: var(--text-sec); text-align: center; max-width: 320px; line-height: 1.6; }
  .wa-no-chat-badge {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 20px;
    border: 1px solid var(--border); background: var(--sidebar-bg);
    font-size: 12px; color: var(--text-sec);
  }
  .wa-no-chat-lock { font-size: 14px; }

  /* Loading */
  .wa-loading {
    flex: 1; display: flex; align-items: center; justify-content: center;
    gap: 10px; color: var(--text-sec); font-size: 13px; z-index: 1; position: relative;
  }
  .wa-spinner {
    width: 18px; height: 18px; border: 2px solid var(--border);
    border-top-color: var(--wa); border-radius: 50%;
    animation: spin .6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Back button (mobile) */
  .wa-back { display: none; }

  @media (max-width: 768px) {
    .wa-sidebar { width: 100%; min-width: unset; }
    .wa-chat { display: none; }
    .wa-chat.open { display: flex; position: absolute; inset: 0; z-index: 100; }
    .wa-back { display: flex; }
  }
`;

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "website" | "whatsapp">("all");
  const bottomRef = useRef<HTMLDivElement>(null);

  const getHeaders = (): HeadersInit => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchConversations = () =>
    fetch("/api/admin/conversations", { headers: getHeaders() })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setConversations(data); });

  useEffect(() => {
    fetchConversations().finally(() => setLoading(false));
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages]);

  const openConversation = async (conv: Conversation) => {
    setChatLoading(true);
    try {
      const text = await fetch(`/api/admin/conversations/${conv.id}`, {
        headers: getHeaders(),
      }).then((r) => r.text());

      const data = JSON.parse(text);
      if (!data.error) {
        setActive(data);
        setConversations((prev) =>
          prev.map((c) => (c.id === conv.id ? { ...c, unread: 0 } : c))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  };

  // Filter conversations
  const filtered = conversations.filter((c) => {
    const name = getDisplayName(c).toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "whatsapp" && isWhatsApp(c)) ||
      (filter === "website" && !isWhatsApp(c));
    return matchSearch && matchFilter;
  });

  const totalUnread = conversations.reduce((s, c) => s + (c.unread || 0), 0);
  const waUnread = conversations.filter(isWhatsApp).reduce((s, c) => s + (c.unread || 0), 0);
  const webUnread = conversations.filter((c) => !isWhatsApp(c)).reduce((s, c) => s + (c.unread || 0), 0);

  // Group messages by date
  function groupByDate(messages: Message[]) {
    const groups: { date: string; messages: Message[] }[] = [];
    messages.forEach((msg) => {
      const date = new Date(msg.createdAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      });
      const last = groups[groups.length - 1];
      if (last && last.date === date) {
        last.messages.push(msg);
      } else {
        groups.push({ date, messages: [msg] });
      }
    });
    return groups;
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="wa-root">

        {/* ── Sidebar ── */}
        <div className="wa-sidebar">

          {/* Sidebar header */}
          <div className="wa-sidebar-header">
            <div className="wa-sidebar-header-left">
              <div className="wa-admin-avatar">A</div>
              <div className="wa-admin-info">
                <div className="wa-admin-name">IDFA Admin</div>
                <div className="wa-admin-role">Conversations</div>
              </div>
            </div>
            <div className="wa-header-actions">
              <a href="/admin/dashboard" style={{ textDecoration: "none" }}>
                <button className="wa-icon-btn" title="Dashboard">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                  </svg>
                </button>
              </a>
              <button className="wa-icon-btn" title="Refresh" onClick={fetchConversations}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="wa-search">
            <div className="wa-search-inner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                placeholder="Search or start new chat"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="wa-filters">
            <button className={`wa-filter ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
              All {totalUnread > 0 && `(${totalUnread})`}
            </button>
            <button className={`wa-filter ${filter === "whatsapp" ? "active" : ""}`} onClick={() => setFilter("whatsapp")}>
              📱 WhatsApp {waUnread > 0 && `(${waUnread})`}
            </button>
            <button className={`wa-filter ${filter === "website" ? "active" : ""}`} onClick={() => setFilter("website")}>
              🌐 Website {webUnread > 0 && `(${webUnread})`}
            </button>
          </div>

          {/* Conversation list */}
          <div className="wa-conv-list">
            {loading ? (
              <div className="wa-conv-empty">Loading conversations…</div>
            ) : filtered.length === 0 ? (
              <div className="wa-conv-empty">No conversations found.</div>
            ) : (
              filtered.map((conv) => {
                const name = getDisplayName(conv);
                const wa = isWhatsApp(conv);
                const lastMsg = conv.messages?.[0];
                const preview = lastMsg?.content || "No messages yet";
                const isBot = lastMsg?.role === "bot";

                return (
                  <div
                    key={conv.id}
                    className={`wa-conv-item ${active?.id === conv.id ? "active" : ""}`}
                    onClick={() => openConversation(conv)}
                  >
                    <div className="wa-conv-avatar-wrap">
                      <div className={`wa-conv-avatar ${wa ? "whatsapp" : "website"}`}>
                        {getInitials(name)}
                      </div>
                      <div className={`wa-source-dot ${wa ? "wa" : "web"}`}>
                        {wa ? "📱" : "🌐"}
                      </div>
                    </div>

                    <div className="wa-conv-body">
                      <div className="wa-conv-top">
                        <span className="wa-conv-name">{name}</span>
                        <span className={`wa-conv-time ${conv.unread > 0 ? "unread" : ""}`}>
                          {timeAgo(conv.updatedAt)}
                        </span>
                      </div>
                      <div className="wa-conv-bottom">
                        <span className={`wa-conv-preview ${isBot ? "bot-preview" : ""}`}>
                          {preview.length > 40 ? preview.slice(0, 40) + "…" : preview}
                        </span>
                        {conv.unread > 0 && (
                          <span className="wa-unread">{conv.unread > 99 ? "99+" : conv.unread}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat area ── */}
        <div className={`wa-chat ${active ? "open" : ""}`}>
          <div className="wa-chat-bg" />

          {!active ? (
            <div className="wa-no-chat">
              <div className="wa-no-chat-icon">💬</div>
              <h3>IDFA Conversations</h3>
              <p>Select a conversation from the left to view messages from website visitors and WhatsApp users.</p>
              <div className="wa-no-chat-badge">
                <span className="wa-no-chat-lock">🔒</span>
                End-to-end monitored by IDFA Admin
              </div>
            </div>
          ) : chatLoading ? (
            <div className="wa-loading">
              <div className="wa-spinner" />
              Loading messages…
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="wa-chat-header">
                <button className="wa-icon-btn wa-back" onClick={() => setActive(null)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                <div className={`wa-chat-avatar ${isWhatsApp(active) ? "whatsapp" : "website"}`}>
                  {getInitials(getDisplayName(active))}
                </div>
                <div className="wa-chat-info">
                  <div className="wa-chat-name">{getDisplayName(active)}</div>
                  <div className="wa-chat-status">
                    {[active.userEmail, active.userPhone].filter(Boolean).join(" · ") || "Anonymous visitor"}
                  </div>
                </div>
                <span className={`wa-source-badge ${isWhatsApp(active) ? "wa" : "web"}`}>
                  {isWhatsApp(active) ? "📱 WhatsApp" : "🌐 Website"}
                </span>
              </div>

              {/* Messages */}
              <div className="wa-messages">
                {active.messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--text-sec)", fontSize: "13px", marginTop: "40px" }}>
                    No messages yet.
                  </div>
                ) : (
                  groupByDate(active.messages).map((group) => (
                    <div key={group.date}>
                      {/* Date separator */}
                      <div className="wa-date-sep">
                        <span className="wa-date-label">{group.date}</span>
                      </div>

                      {group.messages.map((msg, i) => {
                        const isOut = msg.role === "bot";
                        return (
                          <div key={msg.id} className={`wa-bubble-row ${isOut ? "out" : "in"}`}>
                            <div className={`wa-bubble ${isOut ? "out" : "in"}`}>
                              {msg.content}
                              <div className="wa-bubble-meta">
                                <span className="wa-bubble-time">{formatMsgTime(msg.createdAt)}</span>
                                {isOut && <span className="wa-tick">✓✓</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}