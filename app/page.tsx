"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import useChat from "@/app/chatbot/hooks/useChat";
import CourseCarousel from "@/app/chatbot/components/CourseCaraousel";
import StructuredMessage from "@/app/chatbot/components/StructureMessage";

type Message = { role: "user" | "bot"; content: string; image?: string };

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  
  .ifda-widget * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }

  :root {
    --blue-900: #0f2557;
    --blue-800: #1a3a7c;
    --blue-700: #1e4da0;
    --blue-600: #1d5cbf;
    --blue-500: #2563eb;
    --blue-400: #3b82f6;
    --blue-100: #dbeafe;
    --blue-50:  #eff6ff;
    --white:    #ffffff;
    --gray-50:  #f8fafc;
    --gray-100: #f1f5f9;
    --gray-200: #e2e8f0;
    --gray-400: #94a3b8;
    --gray-600: #475569;
    --gray-800: #1e293b;
    --shadow-bubble: 0 8px 32px rgba(37,99,235,.4), 0 2px 8px rgba(0,0,0,.15);
    --shadow-popup:  0 24px 80px rgba(15,37,87,.25), 0 8px 32px rgba(0,0,0,.12);
  }

  /* ── Floating bubble ── */
  .ifda-bubble {
    position: fixed; bottom: 28px; right: 28px; z-index: 9999;
    width: 62px; height: 62px; border-radius: 50%;
    background: linear-gradient(135deg, var(--blue-600), var(--blue-800));
    box-shadow: var(--shadow-bubble);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s;
    animation: bubblePop .5s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes bubblePop { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
  .ifda-bubble:hover { transform: scale(1.08); box-shadow: 0 12px 40px rgba(37,99,235,.5); }
  .ifda-bubble.open { transform: scale(0); opacity: 0; pointer-events: none; display:none; }

  /* Pulse ring */
  .ifda-bubble::before {
    content: ''; position: absolute; inset: -6px; border-radius: 50%;
    border: 2px solid rgba(37,99,235,.4);
    animation: pulseRing 2.5s ease-out infinite;
  }
  @keyframes pulseRing { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.4);opacity:0} }

  /* Unread dot */
  .ifda-unread-dot {
    position: absolute; top: 4px; right: 4px;
    width: 14px; height: 14px; border-radius: 50%;
    background: #ef4444; border: 2px solid white;
    font-size: 8px; font-weight: 800; color: white;
    display: flex; align-items: center; justify-content: center;
  }

  /* ── Popup window ── */
  .ifda-popup {
    position: fixed; bottom: 28px; right: 28px; z-index: 9998;
    width: 390px; height: 595px;
    border-radius: 20px; overflow: hidden;
    box-shadow: var(--shadow-popup);
    display: flex; flex-direction: column;
    transform-origin: bottom right;
    animation: popupOpen .3s cubic-bezier(.34,1.2,.64,1) both;
    border: 1px solid rgba(255,255,255,.15);
  }
  @keyframes popupOpen { from{transform:scale(.85) translateY(20px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
  .ifda-popup.closing { animation: popupClose .2s ease both; }
  @keyframes popupClose { to{transform:scale(.85) translateY(20px);opacity:0} }

  /* Header */
  .ifda-header {
    background: linear-gradient(135deg, var(--blue-800) 0%, var(--blue-600) 100%);
    padding: 16px 18px 14px; flex-shrink: 0;
    position: relative; overflow: hidden;
  }
  .ifda-header::after {
    content: ''; position: absolute; top: -30px; right: -30px;
    width: 120px; height: 120px; border-radius: 50%;
    background: rgba(255,255,255,.06); pointer-events: none;
  }
  .ifda-header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .ifda-header-left { display: flex; align-items: center; gap: 10px; }
  .ifda-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: rgba(255,255,255,.2); border: 2px solid rgba(255,255,255,.35);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }
  .ifda-agent-info { }
  .ifda-agent-name { font-size: 15px; font-weight: 700; color: white; letter-spacing: -.2px; }
  .ifda-agent-status { display: flex; align-items: center; gap: 5px; margin-top: 2px; }
  .ifda-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; flex-shrink: 0; animation: blink 2s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.5} }
  .ifda-status-text { font-size: 11px; color: rgba(255,255,255,.8); font-weight: 500; }
  .ifda-header-actions { display: flex; gap: 4px; }
  .ifda-hbtn {
    width: 30px; height: 30px; border-radius: 8px; border: none;
    background: rgba(255,255,255,.15); color: rgba(255,255,255,.9);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background .15s;
  }
  .ifda-hbtn:hover { background: rgba(255,255,255,.25); }

  /* Header tagline */
  .ifda-tagline {
    background: rgba(255,255,255,.12); border-radius: 8px;
    padding: 7px 10px; font-size: 11.5px; color: rgba(255,255,255,.9);
    line-height: 1.4; border: 1px solid rgba(255,255,255,.1);
  }
  .ifda-tagline strong { color: white; }

  /* Messages */
  .ifda-messages {
    flex: 1; overflow-y: auto; padding: 14px 14px 8px;
    background: var(--gray-50);
    display: flex; flex-direction: column; gap: 10px;
    scrollbar-width: thin; scrollbar-color: var(--gray-200) transparent;
  }
  .ifda-messages::-webkit-scrollbar { width: 3px; }
  .ifda-messages::-webkit-scrollbar-thumb { background: var(--gray-200); border-radius: 2px; }

  /* Welcome */
  .ifda-welcome {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 12px; padding: 20px 10px;
    text-align: center; min-height: 200px;
    animation: fadeUp .4s ease both;
  }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .ifda-welcome-icon {
    width: 56px; height: 56px; border-radius: 16px;
    background: linear-gradient(135deg, var(--blue-500), var(--blue-800));
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; box-shadow: 0 8px 24px rgba(37,99,235,.3);
  }
  .ifda-welcome h3 { font-size: 16px; font-weight: 800; color: var(--gray-800); }
  .ifda-welcome p { font-size: 12.5px; color: var(--gray-600); line-height: 1.6; max-width: 260px; }

  /* Quick reply chips on welcome */
  .ifda-welcome-chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 4px; }
  .ifda-chip {
    padding: 6px 13px; border-radius: 20px;
    border: 1.5px solid var(--blue-400); background: var(--blue-50);
    color: var(--blue-700); font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all .18s; white-space: nowrap;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .ifda-chip:hover { background: var(--blue-500); color: white; border-color: var(--blue-500); transform: translateY(-1px); }

  /* Message row */
  .ifda-row { display: flex; gap: 7px; align-items: flex-end; animation: fadeUp .25s ease both; }
  .ifda-row.user { flex-direction: row-reverse; }
  .ifda-row-av {
    width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 12px;
  }
  .ifda-row-av.bot { background: linear-gradient(135deg, var(--blue-500), var(--blue-800)); }
  .ifda-row-av.user { background: var(--gray-200); font-size: 10px; font-weight: 700; color: var(--gray-600); }

  .ifda-bwrap { display: flex; flex-direction: column; gap: 5px; max-width: 78%; }
  .ifda-row.user .ifda-bwrap { align-items: flex-end; }

  .ifda-bubble-msg {
    padding: 9px 13px; border-radius: 14px;
    font-size: 13px; line-height: 1.6;
    white-space: pre-wrap; word-break: break-word; width: fit-content;
  }
  .ifda-bubble-msg.bot {
    background: white; color: var(--gray-800);
    border: 1px solid var(--gray-200); border-bottom-left-radius: 4px;
    box-shadow: 0 1px 4px rgba(0,0,0,.06);
  }
  .ifda-bubble-msg.user {
    background: linear-gradient(135deg, var(--blue-600), var(--blue-800));
    color: white; border-bottom-right-radius: 4px;
    box-shadow: 0 2px 8px rgba(37,99,235,.3);
  }

  /* Quick replies below message */
  .ifda-qr { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
  .ifda-qr-btn {
    padding: 5px 11px; border-radius: 16px;
    border: 1.5px solid var(--blue-300); background: white;
    color: var(--blue-700); font-size: 11.5px; font-weight: 600;
    cursor: pointer; transition: all .15s; white-space: nowrap;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .ifda-qr-btn:hover { background: var(--blue-500); color: white; border-color: var(--blue-500); }
  .ifda-qr-btn:disabled { opacity: .4; cursor: not-allowed; }

  /* Typing */
  .ifda-typing { display: flex; gap: 4px; align-items: center; padding: 3px 0; }
  .ifda-typing span {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--gray-400); animation: tdot 1.2s infinite;
  }
  .ifda-typing span:nth-child(2) { animation-delay: .2s; }
  .ifda-typing span:nth-child(3) { animation-delay: .4s; }
  @keyframes tdot { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

  /* Input */
  .ifda-input-area {
    padding: 10px 12px 12px; background: white;
    border-top: 1px solid var(--gray-200); flex-shrink: 0;
  }
  .ifda-input-box {
    display: flex; align-items: flex-end; gap: 8px;
    background: var(--gray-100); border: 1.5px solid var(--gray-200);
    border-radius: 14px; padding: 8px 10px;
    transition: border-color .2s, box-shadow .2s;
  }
  .ifda-input-box:focus-within {
    border-color: var(--blue-400);
    box-shadow: 0 0 0 3px rgba(59,130,246,.15);
    background: white;
  }
  .ifda-input-box textarea {
    flex: 1; background: none; border: none; outline: none; resize: none;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px;
    color: var(--gray-800); line-height: 1.5; min-height: 20px; max-height: 100px;
    scrollbar-width: thin;
  }
  .ifda-input-box textarea::placeholder { color: var(--gray-400); }
  .ifda-send {
    width: 32px; height: 32px; border-radius: 10px; border: none;
    background: linear-gradient(135deg, var(--blue-500), var(--blue-700));
    color: white; display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0; transition: opacity .15s, transform .15s;
    box-shadow: 0 2px 8px rgba(37,99,235,.35);
  }
  .ifda-send:disabled { opacity: .35; cursor: not-allowed; box-shadow: none; }
  .ifda-send:not(:disabled):hover { opacity: .88; transform: scale(1.05); }

  /* Footer */
  .ifda-footer {
    padding: 5px 12px 8px; background: white;
    text-align: center; font-size: 10px; color: var(--gray-400);
    font-family: 'JetBrains Mono', monospace;
  }
  .ifda-footer a { color: var(--blue-400); text-decoration: none; }

  /* Maximize button */
  .ifda-maximize-btn {
    position: fixed; bottom: 108px; right: 28px; z-index: 9997;
    width: 36px; height: 36px; border-radius: 10px;
    background: var(--blue-800); color: white; border: none;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(15,37,87,.3);
    transition: transform .2s, opacity .2s;
    animation: fadeUp .3s ease both;
  }
  .ifda-maximize-btn:hover { transform: scale(1.08); }

  /* Maximized (full screen popup) */
  .ifda-popup.maximized {
    bottom: 0; right: 0; width: 100vw; height: 100vh;
    border-radius: 0; animation: none;
  }

  @media (max-width: 480px) {
    .ifda-popup { width: 100vw; height: 100vh; bottom: 0; right: 0; border-radius: 0; }
    .ifda-bubble { bottom: 20px; right: 20px; }
  }
`;

const INITIAL_SUGGESTIONS = [
  "📚 View Courses", "💰 Check Fees",
  "📋 Enroll Now", "📞 Schedule a Call", "❓ Other Query",
];

const SUGGESTION_MAP: Record<string, string> = {
  "📚 View Courses": "Show me all available courses",
  "💰 Check Fees": "What are the course fees?",
  "📋 Enroll Now": "I want to enroll in a course",
  "📞 Schedule a Call": "I want to schedule a call",
  "🏫 Visit Campus": "I want to visit the campus",
  "📞 Book a Call": "Book a call for me",
  "📞 Call me instead": "Call me instead of enrolling online",
  "🔙 Main Menu": "Show me the main menu",
  "❓ Other Query": "I have another question",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [closing, setClosing] = useState(false);
  const [input, setInput] = useState("");
  const [hasUnread, setHasUnread] = useState(true);

  const { messages, sendMessage, loading, leadInfo, suggestions, showCourses, setShowCourses, courses } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hasUserMsgs = messages.filter((m) => m.role === "user").length > 0;
  const isNewChat = !hasUserMsgs && messages.length <= 1;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const openChat = () => {
    setOpen(true);
    setHasUnread(false);
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const closeChat = () => {
    setClosing(true);
    setTimeout(() => { setOpen(false); setClosing(false); }, 200);
  };

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    await sendMessage(msg);
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
  };

  const handleSuggestion = (s: string) => handleSend(SUGGESTION_MAP[s] || s);

  return (
    <>
      <style>{CSS}</style>

      {/* Floating bubble */}
      <button className={`ifda-bubble ${open ? "open" : ""}`} onClick={openChat} aria-label="Open chat">
         <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
</svg>
        {hasUnread && !open && <span className="ifda-unread-dot">1</span>}
      </button>

      {/* Popup */}
      {open && (
        <>
          {/* Maximize button — shown when not maximized */}
          {!maximized && (
            <button className="ifda-maximize-btn" onClick={() => setMaximized(true)} title="Maximize">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
            </button>
          )}

          <div className={`ifda-popup ${closing ? "closing" : ""} ${maximized ? "maximized" : ""}`}>

            {/* Header */}
            <div className="ifda-header">
              <div className="ifda-header-top">
                <div className="ifda-header-left">
                  <div className="ifda-avatar">🎓</div>
                  <div className="ifda-agent-info">
                    <div className="ifda-agent-name"> IFDA Advisor</div>
                    <div className="ifda-agent-status">
                      <div className="ifda-status-dot" />
                      <span className="ifda-status-text">Online · Typically replies instantly</span>
                    </div>
                  </div>
                </div>
                <div className="ifda-header-actions">
                  {maximized && (
                    <button className="ifda-hbtn" onClick={() => setMaximized(false)} title="Restore">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
                        <line x1="10" y1="14" x2="21" y2="3"/><line x1="3" y1="21" x2="14" y2="10"/>
                      </svg>
                    </button>
                  )}
                  <button className="ifda-hbtn" onClick={closeChat} title="Close">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="ifda-tagline">
                🏆 <strong>125+ AI-Integrated Programs</strong> · ISO 9001:2015 Certified · NSDC Aligned
              </div>
            </div>

            {/* Messages */}
            <div className="ifda-messages">
              {isNewChat ? (
                <div className="ifda-welcome">
                  <div className="ifda-welcome-icon">🎓</div>
                  <h3>Welcome to IFDA Institute!</h3>
                  <p>I'm Priya, your AI admission counselor. How can I help you today?</p>
                  <div className="ifda-welcome-chips">
                    {INITIAL_SUGGESTIONS.map((s) => (
                      <button key={s} className="ifda-chip" onClick={() => handleSuggestion(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isLast = i === messages.length - 1;
                  const isLastBot = isLast && msg.role === "bot";
                  return (
                    <div key={i} className={`ifda-row ${msg.role}`}>
                      <div className={`ifda-row-av ${msg.role}`}>
                        {msg.role === "bot" ? "🎓" : "U"}
                      </div>
                      <div className="ifda-bwrap">
                        {msg.image && (
                          <img src={msg.image} alt="" style={{ width: "100%", borderRadius: "10px", border: "1px solid #e2e8f0" }} />
                        )}
{msg.role === "bot" && msg.structured ? (
  <StructuredMessage
    structured={msg.structured}
    onQuickReply={handleSend}
    loading={loading}
    isLast={isLastBot}
  />
) : (
  <>
    <div className={`ifda-bubble-msg ${msg.role}`}>{msg.content}</div>

    {isLastBot && showCourses && courses.length > 0 && (
      <CourseCarousel
        courses={courses}
        onInterested={(name: string) => {
          setShowCourses(false);
          handleSend(`I'm interested in the ${name} course`);
        }}
      />
    )}

    {isLastBot && !loading && suggestions && suggestions.length > 0 && (
      <div className="ifda-qr">
        {suggestions.map((s: string) => (
          <button key={s} className="ifda-qr-btn" onClick={() => handleSuggestion(s)} disabled={loading}>{s}</button>
        ))}
      </div>
    )}
  </>
)}
                      </div>
                    </div>
                  );
                })
              )}

              {loading && (
                <div className="ifda-row">
                  <div className="ifda-row-av bot">🎓</div>
                  <div className="ifda-bwrap">
                    <div className="ifda-bubble-msg bot">
                      <div className="ifda-typing"><span/><span/><span/></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="ifda-input-area">
              <div className="ifda-input-box">
                <textarea
                  ref={inputRef}
                  rows={1}
                  placeholder="Type a message…"
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKey}
                />
                <button className="ifda-send" onClick={() => handleSend()} disabled={!input.trim() || loading}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="ifda-footer">
              Powered by <a href="#">IFDA AI Gurukul</a> ✦ AI-Integrated Learning
            </div>
          </div>
        </>
      )}

      {/* Admin button */}
      <a href="/admin/login" title="Admin" style={{
        position: "fixed", bottom: "28px", left: "28px", zIndex: 9996,
        width: "36px", height: "36px", borderRadius: "10px",
        background: "#1e293b", border: "1px solid #334155",
        display: "flex", alignItems: "center", justifyContent: "center",
        textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,.2)",
        transition: "transform .15s",
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </a>
    </>
  );
}