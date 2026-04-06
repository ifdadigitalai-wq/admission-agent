"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import useChat from "@/app/chatbot/hooks/useChat";

// ─── Types ────────────────────────────────────────────────────────────────────
type Message = {
  image?: any; role: "user" | "bot"; content: string
};
type Session = { id: string; title: string; messages: Message[]; time: string };

// ─── Icons ────────────────────────────────────────────────────────────────────
const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const BotIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const ChatIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const SUGGESTIONS = [
  "🌟 Welcome to IFDA Institute – AI-Integrated Learning Starts Here 🚀\nAt IFDA Institute, every one of our 125+ programs is 100% AI-integrated.\nStudents don't just learn skills — they learn how to work with AI in real-world industry environments.\n\n🔹 100% Practical & Hands-On Training\n🔹 AI-Integrated Skill Development\n🔹 Industry-Aligned Curriculum\n🔹 ISO 9001:2015 Certified | NSDC Aligned\n\n🎓 Whether it's Accounts, IT, Data, Design, Marketing, or Business —\nAI is integrated into every course you learn at IFDA.\n\nTeam IFDA Institute ✨\nPowered by IFDA AI Gurukul"
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0b0e14; --surface: #111520; --panel: #161c2a; --border: #1f2a3d;
    --accent: #3d8bff; --accent2: #6c63ff; --text: #e2e8f4; --muted: #5a6a85;
    --bubble-bot: #1a2236; --bubble-usr: #1e3260;
    --font: 'Sora', sans-serif; --mono: 'JetBrains Mono', monospace;
    --radius: 14px; --sidebar-w: 280px;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font); }
  .chat-root { display: flex; height: 100vh; overflow: hidden; }
  .sidebar { width: var(--sidebar-w); min-width: var(--sidebar-w); background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; transition: transform .3s cubic-bezier(.4,0,.2,1), min-width .3s, width .3s; overflow: hidden; }
  .sidebar.closed { width: 0; min-width: 0; transform: translateX(-100%); }
  .sidebar-header { padding: 20px 16px 14px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .sidebar-logo { font-size: 13px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); font-family: var(--mono); }
  .new-chat-btn { display: flex; align-items: center; gap: 8px; width: calc(100% - 24px); margin: 14px 12px 8px; padding: 10px 14px; background: linear-gradient(135deg, var(--accent), var(--accent2)); border: none; border-radius: 10px; color: #fff; font-family: var(--font); font-size: 13px; font-weight: 500; cursor: pointer; transition: opacity .2s, transform .15s; }
  .new-chat-btn:hover { opacity: .88; transform: translateY(-1px); }
  .sidebar-section { padding: 10px 12px 4px; font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); font-family: var(--mono); }
  .session-list { flex: 1; overflow-y: auto; padding: 4px 8px 16px; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .session-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px; border-radius: 10px; cursor: pointer; transition: background .15s; margin-bottom: 2px; border: 1px solid transparent; }
  .session-item:hover { background: var(--panel); }
  .session-item.active { background: var(--panel); border-color: var(--border); }
  .session-icon { margin-top: 1px; color: var(--muted); flex-shrink: 0; }
  .session-info { flex: 1; min-width: 0; }
  .session-title { font-size: 12.5px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .session-time { font-size: 10.5px; color: var(--muted); margin-top: 2px; font-family: var(--mono); }
  .sidebar-empty { text-align: center; padding: 32px 16px; color: var(--muted); font-size: 12px; line-height: 1.7; }
  .chat-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .topbar { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid var(--border); background: var(--surface); z-index: 10; }
  .menu-btn { background: none; border: none; color: var(--muted); cursor: pointer; padding: 4px; border-radius: 8px; transition: color .2s, background .2s; display: flex; align-items: center; }
  .menu-btn:hover { color: var(--text); background: var(--panel); }
  .topbar-title { font-size: 15px; font-weight: 600; color: var(--text); flex: 1; }
  .topbar-badge { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #34d399; font-family: var(--mono); background: rgba(52,211,153,.1); border: 1px solid rgba(52,211,153,.2); border-radius: 20px; padding: 4px 10px; }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: #34d399; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  .messages-area { flex: 1; overflow-y: auto; padding: 28px 0; scroll-behavior: smooth; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .messages-inner { max-width: 720px; margin: 0 auto; padding: 0 20px; display: flex; flex-direction: column; gap: 18px; }
  .welcome { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 55vh; text-align: center; gap: 16px; animation: fadeUp .5s ease both; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .welcome-orb { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent2)); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 40px rgba(61,139,255,.35); animation: float 3s ease-in-out infinite; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  .welcome h1 { font-size: 26px; font-weight: 600; background: linear-gradient(135deg, #fff 40%, var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .welcome p { color: var(--muted); font-size: 14px; max-width: 360px; line-height: 1.7; }
  .suggestions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 8px; }
  .suggestion-chip { padding: 8px 16px; border-radius: 20px; border: 1px solid var(--border); background: var(--panel); color: var(--text); font-size: 12.5px; font-family: var(--font); cursor: pointer; transition: border-color .2s, background .2s, transform .15s; }
  .suggestion-chip:hover { border-color: var(--accent); background: rgba(61,139,255,.08); transform: translateY(-2px); }
  .msg-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;     /* ✅ avatar aligns to bottom of bubble */
  width: 100%;
}
.msg-row.user {
  flex-direction: row-reverse;
  justify-content: flex-start; /* ✅ keeps user bubble on right */
}
  .avatar { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; }
  .avatar.bot { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; }
  .avatar.user { background: var(--bubble-usr); color: var(--accent); border: 1px solid var(--border); }
  .bubble {
  max-width: 65%;
  min-width: 60px;
  padding: 12px 16px;
  border-radius: var(--radius);
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
  .bubble.bot {
  background: var(--bubble-bot);
  border: 1px solid var(--border);
  border-top-left-radius: 4px;
  color: var(--text);
  width: fit-content;        /* ✅ shrinks to content width */
  max-width: 65%;
}
.bubble.user {
  background: var(--bubble-usr);
  border: 1px solid rgba(61,139,255,.25);
  border-top-right-radius: 4px;
  color: #d4e4ff;
  width: fit-content;        /* ✅ shrinks to content width */
  max-width: 65%;
  margin-left: auto;         /* ✅ pushes to right side */
}
  .typing-dots { display: flex; gap: 4px; align-items: center; padding: 4px 2px; }
  .typing-dots span { width: 7px; height: 7px; border-radius: 50%; background: var(--muted); animation: bounce 1.2s infinite; }
  .typing-dots span:nth-child(2) { animation-delay: .2s; }
  .typing-dots span:nth-child(3) { animation-delay: .4s; }
  @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
  .input-area { padding: 16px 20px 20px; background: var(--surface); border-top: 1px solid var(--border); }
  .input-inner { max-width: 720px; margin: 0 auto; }
  .input-box { display: flex; align-items: flex-end; gap: 10px; background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 12px; transition: border-color .2s, box-shadow .2s; }
  .input-box:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(61,139,255,.12); }
  .input-box textarea { flex: 1; background: none; border: none; outline: none; resize: none; font-family: var(--font); font-size: 14px; color: var(--text); line-height: 1.6; min-height: 24px; max-height: 140px; scrollbar-width: thin; }
  .input-box textarea::placeholder { color: var(--muted); }
  .send-btn { width: 36px; height: 36px; border-radius: 10px; border: none; background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: opacity .2s, transform .15s; }
  .send-btn:disabled { opacity: .4; cursor: not-allowed; transform: none; }
  .send-btn:not(:disabled):hover { opacity: .88; transform: scale(1.05); }
  .input-hint { text-align: center; font-size: 11px; color: var(--muted); margin-top: 10px; font-family: var(--mono); }
  .input-hint kbd { background: var(--panel); border: 1px solid var(--border); border-radius: 4px; padding: 1px 5px; font-size: 10px; }
  .noise { pointer-events: none; position: fixed; inset: 0; opacity: .025; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 180px; z-index: 999; }
  @media (max-width: 640px) { .sidebar { position: absolute; height: 100%; z-index: 100; } .sidebar.closed { transform: translateX(-100%); } }
`;

// ─── Inner chat component — remounted on new session via key ─────────────────
function ChatInner({
  sessionId,
  initialMessages,
  onMessagesUpdate,
  onSuggestionClick,
}: {
  sessionId: string | null;
  initialMessages: Message[];
  onMessagesUpdate: (msgs: Message[], sessionId: string) => void;
  onSuggestionClick: (text: string) => void;
}) {
  const { messages, sendMessage, loading } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Show initial (archived) messages OR live messages
  const displayed = messages.length > 0 ? messages : initialMessages;
  const isNewChat = displayed.length === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayed, loading]);

  // Notify parent whenever messages update so sidebar title stays fresh
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      onMessagesUpdate(messages, sessionId);
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    await sendMessage(msg);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  return (
    <>
      <div className="messages-area">
        <div className="messages-inner">
          {isNewChat ? (
            <div className="welcome">
              <div className="welcome-orb"><BotIcon /></div>
              <h1>How can I help you?</h1>
              <p>Ask me anything about our courses, fees, eligibility, or schedule a call.</p>
              <div className="suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="suggestion-chip"
                    onClick={() => { onSuggestionClick(s); handleSend(s); }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {displayed.map((msg, i) => (
                <div key={i} className={`msg-row ${msg.role}`}>
                  <div className={`avatar ${msg.role}`}>
                    {msg.role === "bot" ? <BotIcon /> : "U"}
                  </div>
                  <div>
                    {/* ✅ Show image above text if present */}
                    {(msg as Message).image && (
                      <img
                        src={(msg as Message).image}
                        alt="Welcome"
                        style={{
                          width: "100%",
                          maxWidth: "360px",
                          borderRadius: "12px",
                          marginBottom: "8px",
                          display: "block",
                          border: "1px solid var(--border)",
                        }}
                      />
                    )}
                    <div className={`bubble ${msg.role}`}>{msg.content}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="msg-row">
                  <div className="avatar bot"><BotIcon /></div>
                  <div className="bubble bot">
                    <div className="typing-dots"><span /><span /><span /></div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}</div>
      </div>

      <div className="input-area">
        <div className="input-inner">
          <div className="input-box">
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Ask about courses, fees, enrollment…"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            <button className="send-btn" onClick={() => handleSend()}
              disabled={!input.trim() || loading}
            >
              <SendIcon />
            </button>
          </div>
          <div className="input-hint">
            Press <kbd>Enter</kbd> to send &nbsp;·&nbsp; <kbd>Shift+Enter</kbd> for new line
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Shell (sidebar + topbar) ─────────────────────────────────────────────────
export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0); // ✅ forces ChatInner remount = fresh useChat state

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  // Called by ChatInner when messages update — keeps sidebar title fresh
  // In ChatPage.tsx shell component
const handleMessagesUpdate = (msgs: Message[], sessionId: string, leadInfo?: any) => {
  setSessions((prev) =>
    prev.map((s) => {
      if (s.id !== sessionId) return s;

      // ✅ Use lead name if available, else use first user message
      const name = leadInfo?.name;
      const lastUser = [...msgs].reverse().find((m) => m.role === "user");
      const title = name
        ? `💬 ${name}`
        : lastUser
        ? lastUser.content.length > 35
          ? lastUser.content.slice(0, 35) + "…"
          : lastUser.content
        : s.title;

      return { ...s, messages: msgs, title };
    })
  );
};

  const startNewChat = () => {
    // Create a new session entry
    const id = Date.now().toString();
    const newSession: Session = {
      id,
      title: "New Chat",
      messages: [],
      time: formatTime(new Date()),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(id);
    setChatKey((k) => k + 1); // ✅ remount ChatInner = completely fresh state
  };

  const loadSession = (session: Session) => {
    setActiveSessionId(session.id);
    setChatKey((k) => k + 1); // ✅ remount ChatInner for this session too
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="noise" />
      <div className="chat-root">

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "" : "closed"}`}>
          <div className="sidebar-header">
            <span className="sidebar-logo">IDFA.AI</span>
            <button className="menu-btn" onClick={() => setSidebarOpen(false)}><CloseIcon /></button>
          </div>
          <button className="new-chat-btn" onClick={startNewChat}>
            <PlusIcon /> New Chat
          </button>
          {sessions.length > 0 && <div className="sidebar-section">Recent</div>}
          <div className="session-list">
            {sessions.length === 0 ? (
              <div className="sidebar-empty">No chats yet.<br />Start a conversation!</div>
            ) : (
              sessions.map((s) => (
                <div key={s.id}
                  className={`session-item ${activeSessionId === s.id ? "active" : ""}`}
                  onClick={() => loadSession(s)}>
                  <span className="session-icon"><ChatIcon /></span>
                  <div className="session-info">
                    {/* ✅ Title always reflects latest message */}
                    <div className="session-title">{s.title}</div>
                    <div className="session-time">{s.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="chat-main">
          <div className="topbar">
            <button className="menu-btn" onClick={() => setSidebarOpen((v) => !v)}><MenuIcon /></button>
            <span className="topbar-title">
              {/* ✅ Topbar title also updates */}
              {activeSession?.title && activeSession.title !== "New Chat"
                ? activeSession.title
                : "Admission Assistant"}
            </span>
            <div className="topbar-badge">
              <span className="dot" /><span>Online</span>
            </div>
          </div>

          {/* ✅ key prop forces full remount = completely isolated useChat state per session */}
          <ChatInner
            key={chatKey}
            sessionId={activeSessionId}
            initialMessages={activeSession?.messages ?? []}
            onMessagesUpdate={handleMessagesUpdate}
            onSuggestionClick={() => {}}
          />
        </main>
      </div>
{/* Admin floating button */}
<a
  href="/admin/login"
  title="Admin Login"
  style={{
    position: "fixed",
    bottom: "24px",
    right: "24px",
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "var(--panel)",
    border: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    textDecoration: "none",
    transition: "border-color .2s, box-shadow .2s, transform .15s",
    boxShadow: "0 4px 20px rgba(0,0,0,.3)",
  }}
  onMouseEnter={(e: { currentTarget: HTMLAnchorElement; }) => {
    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--accent)";
    (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.08)";
  }}
  onMouseLeave={(e: { currentTarget: HTMLAnchorElement; }) => {
    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
    (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
  }}
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5a6a85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
</a>
    </>
  );
}