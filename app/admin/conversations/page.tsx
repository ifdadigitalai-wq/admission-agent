"use client";

import { useEffect, useRef, useState } from "react";

type Message = { id: string; role: string; content: string; createdAt: string };
type Conversation = {
  id: string; sessionId: string; userName?: string;
  userEmail?: string; userPhone?: string; unread: number;
  updatedAt: string; messages: Message[];
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0b0e14; --surface: #111520; --panel: #161c2a; --border: #1f2a3d;
    --accent: #3d8bff; --accent2: #6c63ff; --text: #e2e8f4; --muted: #5a6a85;
    --green: #34d399; --font: 'Sora', sans-serif; --mono: 'JetBrains Mono', monospace;
    --bubble-bot: #1a2236; --bubble-usr: #1e3260;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font); }
  .root { display: flex; height: 100vh; flex-direction: column; }

  /* Topbar */
  .topbar { display: flex; align-items: center; gap: 14px; padding: 14px 20px; background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 50; }
  .logo { font-family: var(--mono); font-size: 13px; font-weight: 600; color: var(--accent); letter-spacing: .08em; text-transform: uppercase; }
  .divider { width: 1px; height: 20px; background: var(--border); }
  .page-title { font-size: 15px; font-weight: 600; flex: 1; }
  .back-btn { padding: 7px 14px; background: transparent; border: 1px solid var(--border); border-radius: 8px; color: var(--muted); font-family: var(--font); font-size: 12px; cursor: pointer; text-decoration: none; transition: all .2s; }
  .back-btn:hover { border-color: var(--accent); color: var(--accent); }

  /* Layout */
  .layout { display: flex; flex: 1; overflow: hidden; }

  /* Sidebar */
  .conv-sidebar { width: 320px; min-width: 320px; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
  .sidebar-search { padding: 12px; border-bottom: 1px solid var(--border); }
  .search-box { display: flex; align-items: center; gap: 8px; background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 8px 12px; }
  .search-box input { background: none; border: none; outline: none; font-family: var(--font); font-size: 13px; color: var(--text); width: 100%; }
  .search-box input::placeholder { color: var(--muted); }
  .conv-list { flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .conv-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; cursor: pointer; border-bottom: 1px solid rgba(31,42,61,.5); transition: background .15s; position: relative; }
  .conv-item:hover { background: var(--panel); }
  .conv-item.active { background: var(--panel); border-left: 2px solid var(--accent); }
  .conv-avatar { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent2)); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 600; color: #fff; flex-shrink: 0; }
  .conv-info { flex: 1; min-width: 0; }
  .conv-name { font-size: 13.5px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .conv-preview { font-size: 11.5px; color: var(--muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .conv-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
  .conv-time { font-size: 10px; color: var(--muted); font-family: var(--mono); white-space: nowrap; }
  .unread-badge { background: var(--green); color: #000; font-size: 10px; font-weight: 700; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-family: var(--mono); }
  .conv-empty { text-align: center; padding: 40px 16px; color: var(--muted); font-size: 12px; }

  /* Chat area */
  .chat-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .chat-header { padding: 14px 20px; border-bottom: 1px solid var(--border); background: var(--surface); display: flex; align-items: center; gap: 12px; }
  .chat-header-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent2)); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; color: #fff; flex-shrink: 0; }
  .chat-header-info { flex: 1; }
  .chat-header-name { font-size: 14px; font-weight: 600; }
  .chat-header-sub { font-size: 11px; color: var(--muted); font-family: var(--mono); margin-top: 2px; }
  .messages-area { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .msg-row { display: flex; gap: 8px; }
  .msg-row.user { flex-direction: row-reverse; }
  .msg-avatar { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; }
  .msg-avatar.bot { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; }
  .msg-avatar.user { background: var(--bubble-usr); color: var(--accent); border: 1px solid var(--border); }
  .bubble { max-width: 75%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
  .bubble.bot { background: var(--bubble-bot); border: 1px solid var(--border); border-top-left-radius: 3px; }
  .bubble.user { background: var(--bubble-usr); border: 1px solid rgba(61,139,255,.2); border-top-right-radius: 3px; color: #d4e4ff; }
  .msg-time { font-size: 10px; color: var(--muted); margin-top: 3px; font-family: var(--mono); text-align: right; }

  /* Empty chat */
  .no-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--muted); gap: 12px; }
  .no-chat-icon { font-size: 48px; }
  .no-chat p { font-size: 14px; }

  /* Loading */
  .loading { display: flex; align-items: center; justify-content: center; flex: 1; gap: 10px; color: var(--muted); font-family: var(--mono); font-size: 13px; }
  .spinner { width: 16px; height: 16px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .6s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 768px) {
    .conv-sidebar { width: 100%; display: none; }
    .conv-sidebar.show { display: flex; }
  }
`;

function getInitials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function timeAgo(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  useEffect(() => {
    fetch("/api/admin/conversations", { headers })
      .then((r) => r.json())
      .then((data) => {
        setConversations(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/admin/conversations", { headers })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setConversations(data);
        });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active]);

  const openConversation = async (conv: Conversation) => {
    setChatLoading(true);
    const res = await fetch(`/api/admin/conversations/${conv.id}`, { headers });
    const data = await res.json();
    setActive(data);
    // Mark as read in local state
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread: 0 } : c))
    );
    setChatLoading(false);
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  const filtered = conversations.filter((c) => {
    const name = c.userName || c.userEmail || c.sessionId;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <>
      <style>{CSS}</style>
      <div className="root">
        {/* Topbar */}
        <div className="topbar">
          <span className="logo">IDFA.AI</span>
          <div className="divider" />
          <span className="page-title">
            Conversations {totalUnread > 0 && (
              <span style={{ background: "var(--green)", color: "#000", borderRadius: "20px", padding: "2px 8px", fontSize: "11px", fontFamily: "var(--mono)", marginLeft: "8px" }}>
                {totalUnread} new
              </span>
            )}
          </span>
          <a href="/admin/dashboard" className="back-btn">← Dashboard</a>
        </div>

        <div className="layout">
          {/* Sidebar */}
          <div className="conv-sidebar">
            <div className="sidebar-search">
              <div className="search-box">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5a6a85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input placeholder="Search conversations…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="conv-list">
              {loading ? (
                <div className="conv-empty">Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="conv-empty">No conversations yet.</div>
              ) : (
                filtered.map((conv) => {
                  const name = conv.userName || conv.userEmail || `Visitor`;
                  const preview = conv.messages?.[0]?.content || "No messages yet";
                  return (
                    <div
                      key={conv.id}
                      className={`conv-item ${active?.id === conv.id ? "active" : ""}`}
                      onClick={() => openConversation(conv)}
                    >
                      <div className="conv-avatar">{getInitials(name)}</div>
                      <div className="conv-info">
                        <div className="conv-name">{name}</div>
                        <div className="conv-preview">{preview}</div>
                      </div>
                      <div className="conv-meta">
                        <span className="conv-time">{timeAgo(conv.updatedAt)}</span>
                        {conv.unread > 0 && (
                          <span className="unread-badge">{conv.unread > 9 ? "9+" : conv.unread}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="chat-area">
            {!active ? (
              <div className="no-chat">
                <div className="no-chat-icon">💬</div>
                <p>Select a conversation to view</p>
              </div>
            ) : chatLoading ? (
              <div className="loading"><div className="spinner" /> Loading messages…</div>
            ) : (
              <>
                {/* Chat header */}
                <div className="chat-header">
                  <div className="chat-header-avatar">
                    {getInitials(active.userName)}
                  </div>
                  <div className="chat-header-info">
                    <div className="chat-header-name">
                      {active.userName || "Anonymous Visitor"}
                    </div>
                    <div className="chat-header-sub">
                      {[active.userEmail, active.userPhone].filter(Boolean).join(" · ") || active.sessionId}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="messages-area">
                  {active?.messages?.map((msg) => (
                    <div key={msg.id} className={`msg-row ${msg.role}`}>
                      <div className={`msg-avatar ${msg.role}`}>
                        {msg.role === "bot" ? "🤖" : getInitials(active.userName)}
                      </div>
                      <div>
                        <div className={`bubble ${msg.role}`}>{msg.content}</div>
                        <div className="msg-time">
                          {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}