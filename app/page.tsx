"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import useChat from "@/app/chatbot/hooks/useChat";
import CourseCarousel from "@/app/chatbot/components/CourseCaraousel";

type Message = { role: "user" | "bot"; content: string; image?: string };

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const BotIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/>
  </svg>
);

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  :root {
    --bg: #fcfdfe;
    --surface: rgba(255, 255, 255, 0.7);
    --panel: #ffffff;
    --border: #e8ecf2;
    --accent: #3d8bff;
    --accent2: #6c63ff;
    --text: #1e293b;
    --muted: #64748b;
    --bubble-bot: #ffffff;
    --bubble-usr: linear-gradient(135deg, #3d8bff, #6c63ff);
    --font: 'Sora', sans-serif;
    --mono: 'JetBrains Mono', monospace;
    --radius: 20px;
    --shadow-sm: 0 2px 4px rgba(0,0,0,0.02);
    --shadow-md: 0 10px 30px -10px rgba(61, 139, 255, 0.1);
  }

  html, body { height: 100%; overflow: hidden; background: var(--bg); }
  body { color: var(--text); font-family: var(--font); -webkit-font-smoothing: antialiased; }

  /* ── Decorative Background ── */
  .bg-glow {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: 
      radial-gradient(circle at 10% 10%, rgba(61, 139, 255, 0.04) 0%, transparent 40%),
      radial-gradient(circle at 90% 90%, rgba(108, 99, 255, 0.04) 0%, transparent 40%);
    z-index: -1;
  }

  .chat-root { display: flex; flex-direction: column; height: 100vh; position: relative; }

  /* ── Topbar ── */
  .topbar {
    display: flex; align-items: center; justify-content: center;
    padding: 0 24px; height: 72px;
    background: var(--surface); backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
    z-index: 50; flex-shrink: 0;
  }
  .topbar-content { width: 100%; max-width: 900px; display: flex; align-items: center; justify-content: space-between; }
  .brand-group { display: flex; align-items: center; gap: 12px; }
  .brand-logo { 
    background: var(--bubble-usr); color: white; width: 42px; height: 42px; 
    border-radius: 12px; display: flex; align-items: center; justify-content: center;
    font-family: var(--mono); font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(61, 139, 255, 0.3);
  }
  .topbar-title { font-size: 16px; font-weight: 700; color: var(--text); letter-spacing: -0.02em; }
  .topbar-badge {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; color: #10b981; font-family: var(--mono); font-weight: 600;
    background: #f0fdf4; border: 1px solid #dcfce7;
    border-radius: 30px; padding: 6px 14px;
  }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px #10b981; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1; transform:scale(1)} 50%{opacity:.5; transform:scale(1.2)} }

  /* ── Messages Area ── */
  .messages-area { flex: 1; overflow-y: auto; padding: 40px 0; }
  .messages-inner { max-width: 900px; margin: 0 auto; padding: 0 24px; display: flex; flex-direction: column; gap: 28px; }

  /* ── Welcome Screen ── */
  .welcome {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; min-height: 50vh; text-align: center;
    gap: 24px; animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes slideUp { from{opacity:0; transform:translateY(30px)} to{opacity:1; transform:translateY(0)} }
  
  .welcome-orb {
    width: 84px; height: 84px; border-radius: 24px;
    background: var(--bubble-usr); color: #fff;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 20px 40px -10px rgba(61, 139, 255, 0.4);
    transform: rotate(-5deg);
  }
  .welcome h1 { font-size: 38px; font-weight: 700; letter-spacing: -0.04em; color: var(--text); line-height: 1.1; }
  .welcome p { color: var(--muted); font-size: 16px; max-width: 480px; line-height: 1.7; font-weight: 400; }

  /* ── Message Rows ── */
  .msg-row { display: flex; gap: 16px; width: 100%; animation: slideUp 0.5s ease both; }
  .msg-row.user { flex-direction: row-reverse; }
  
  .avatar {
    width: 40px; height: 40px; border-radius: 14px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700;
  }
  .avatar.bot { background: #fff; color: var(--accent); border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
  .avatar.user { background: #f1f5f9; color: var(--muted); border: 1px solid var(--border); }

  .bubble-wrap { display: flex; flex-direction: column; gap: 10px; max-width: 75%; }
  .msg-row.user .bubble-wrap { align-items: flex-end; }

  .bubble {
    padding: 16px 20px; border-radius: var(--radius);
    font-size: 15px; line-height: 1.7;
    word-break: break-word; position: relative;
    box-shadow: var(--shadow-md);
  }
  .bubble.bot {
    background: var(--panel); border: 1px solid var(--border);
    color: var(--text); border-top-left-radius: 4px;
  }
  .bubble.user {
    background: var(--bubble-usr); color: #fff;
    border-top-right-radius: 4px; border: none;
    box-shadow: 0 8px 20px -6px rgba(61, 139, 255, 0.4);
  }

  /* ── Suggestions ── */
  .suggestions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; width: 100%; max-width: 600px; margin-top: 10px; }
  .suggestion-card {
    padding: 14px 18px; border-radius: 14px;
    border: 1px solid var(--border); background: var(--panel);
    color: var(--text); font-size: 13.5px; font-weight: 500;
    cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: left; display: flex; align-items: center; justify-content: space-between;
  }
  .suggestion-card:hover {
    border-color: var(--accent); transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(61, 139, 255, 0.08);
    color: var(--accent);
  }

  .quick-reply-btn {
    padding: 8px 16px; border-radius: 20px;
    border: 1px solid var(--border); background: var(--panel);
    color: var(--muted); font-size: 12.5px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }
  .quick-reply-btn:hover { border-color: var(--accent); color: var(--accent); background: #f8fbff; }

  /* ── Input Area ── */
  .input-container {
    padding: 24px; background: transparent;
    flex-shrink: 0; z-index: 10;
  }
  .input-inner { max-width: 900px; margin: 0 auto; }
  .input-box {
    display: flex; align-items: flex-end; gap: 14px;
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 24px; padding: 14px 18px;
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.05);
    transition: all 0.3s;
  }
  .input-box:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 4px rgba(61, 139, 255, 0.1), 0 20px 40px -10px rgba(0, 0, 0, 0.05);
  }
  .input-box textarea {
    flex: 1; background: none; border: none; outline: none; resize: none;
    font-family: var(--font); font-size: 15px; color: var(--text);
    line-height: 1.6; min-height: 24px; max-height: 180px;
  }
  .send-btn {
    width: 46px; height: 46px; border-radius: 16px; border: none;
    background: var(--bubble-usr); color: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.3s; flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(61, 139, 255, 0.3);
  }
  .send-btn:hover:not(:disabled) { transform: scale(1.05) translateY(-2px); box-shadow: 0 8px 16px rgba(61, 139, 255, 0.4); }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

  .input-hint {
    text-align: center; font-size: 11px; color: var(--muted);
    margin-top: 14px; font-family: var(--mono); letter-spacing: 0.02em;
  }

  /* ── Admin Login ── */
  .admin-login {
    position: fixed; top: 16px; right: 24px;
    padding: 10px 20px; border-radius: 12px;
    background: rgba(255,255,255,0.8); border: 1px solid var(--border);
    font-size: 13px; font-weight: 600; color: var(--text);
    text-decoration: none; transition: all 0.3s; z-index: 100;
    backdrop-filter: blur(10px); display: flex; align-items: center; gap: 8px;
  }
  .admin-login:hover { border-color: var(--accent); color: var(--accent); transform: translateY(-2px); }

  @media (max-width: 640px) {
    .welcome h1 { font-size: 28px; }
    .topbar-badge { display: none; }
    .suggestions-grid { grid-template-columns: 1fr; }
  }
`;

function ChatInner() {
  const { messages, sendMessage, loading, suggestions, showCourses, courses } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    await sendMessage(msg);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
  };

  const handleSuggestion = (suggestion: string) => {
    const map: Record<string, string> = {
      "📚 View Courses": "Show me all available courses",
      "💰 Check Fees": "What are the course fees?",
      "📋 Enroll Now": "I want to enroll in a course",
      "📞 Schedule a Call": "I want to schedule a call",
    };
    handleSend(map[suggestion] || suggestion);
  };

  const INITIAL_OPTIONS = [
    { label: "📚 View Courses", hint: "Explore programs" },
    { label: "💰 Check Fees", hint: "Pricing details" },
    { label: "📋 Enroll Now", hint: "Start application" },
    { label: "📞 Schedule a Call", hint: "Expert advice" },
  ];

  return (
    <>
      <div className="messages-area">
        <div className="messages-inner">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-orb"><BotIcon /></div>
              <h1>Unlock Your Potential at IFDA</h1>
              <p>I'm your AI counselor. Ready to guide you through our professional courses and admissions process.</p>
              <div className="suggestions-grid">
                {INITIAL_OPTIONS.map((opt) => (
                  <button key={opt.label} className="suggestion-card" onClick={() => handleSuggestion(opt.label)}>
                    <span>{opt.label}</span>
                    <span style={{fontSize: '10px', color: 'var(--muted)'}}>→</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isLastBot = i === messages.length - 1 && msg.role === "bot";
              return (
                <div key={i} className={`msg-row ${msg.role}`}>
                  <div className={`avatar ${msg.role}`}>{msg.role === "bot" ? <BotIcon /> : "U"}</div>
                  <div className="bubble-wrap">
                    {msg.image && <img src={msg.image} alt="Banner" style={{ width: "100%", maxWidth: "450px", borderRadius: "16px", marginBottom: "8px", border: "1px solid var(--border)", boxShadow: 'var(--shadow-md)' }} />}
                    <div className={`bubble ${msg.role}`}>{msg.content}</div>
                    
                    {isLastBot && showCourses && courses.length > 0 && (
                      <CourseCarousel courses={courses} onInterested={(name) => handleSend(`I'm interested in the ${name} course`)} />
                    )}

                    {isLastBot && !loading && suggestions?.length > 0 && (
                      <div className="quick-replies" style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px'}}>
                        {suggestions.map((s: string) => (
                          <button key={s} className="quick-reply-btn" onClick={() => handleSuggestion(s)}>{s}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {loading && (
            <div className="msg-row">
              <div className="avatar bot"><BotIcon /></div>
              <div className="bubble-wrap">
                <div className="bubble bot">
                  <div style={{display: 'flex', gap: '5px', padding: '5px 0'}}>
                    <div className="dot" style={{width: '6px', height: '6px', background: 'var(--muted)'}} />
                    <div className="dot" style={{width: '6px', height: '6px', background: 'var(--muted)', animationDelay: '0.2s'}} />
                    <div className="dot" style={{width: '6px', height: '6px', background: 'var(--muted)', animationDelay: '0.4s'}} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="input-container">
        <div className="input-inner">
          <div className="input-box">
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Ask me anything about IFDA..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            <button className="send-btn" onClick={() => handleSend()} disabled={!input.trim() || loading}>
              <SendIcon />
            </button>
          </div>
          <div className="input-hint">
            <strong>IFDA Cognitive Engine</strong> &nbsp;·&nbsp; Admission Support System
          </div>
        </div>
      </div>
    </>
  );
}

export default function ChatPage() {
  return (
    <>
      <style>{CSS}</style>
      <div className="bg-glow" />
      <div className="chat-root">
        <header className="topbar">
          <div className="topbar-content">
            <div className="brand-group">
              <div className="brand-logo">AI</div>
              <span className="topbar-title">IFDA Admissions</span>
            </div>
            <div className="topbar-badge">
              <span className="dot" />
              <span>ASSISTANT ACTIVE</span>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <ChatInner />
        </main>

        <a href="/admin/login" className="admin-login">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          Staff Portal
        </a>
      </div>
    </>
  );
}