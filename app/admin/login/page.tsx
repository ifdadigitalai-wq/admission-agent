"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async () => {
  if (!email || !password) return setError("Please fill in all fields");
  setLoading(true);
  setError("");

  try {
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // ✅ ensures cookie is saved from response
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Login failed");
    } else {
      // Save token to localStorage as backup
      localStorage.setItem("admin_token", data.token);

      // Verify the server-set cookie is available by calling /api/admin/auth/me
      try {
        const me = await fetch("/api/admin/auth/me", {
          credentials: "include",
          headers: { Authorization: `Bearer ${data.token}` },
        });
        if (me.ok) {
          router.push("/admin/dashboard");
        } else {
          setError("Login succeeded but could not verify session.");
        }
      } catch (err) {
        setError("Login succeeded but network check failed.");
      }
    }
  } catch (e) {
    console.error("Login error:", e);
    setError("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
};

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleLogin();
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0b0e14; --surface: #111520; --panel: #161c2a; --border: #1f2a3d;
          --accent: #3d8bff; --accent2: #6c63ff; --text: #e2e8f4; --muted: #5a6a85;
          --red: #f87171; --font: 'Sora', sans-serif; --mono: 'JetBrains Mono', monospace;
        }
        body { background: var(--bg); font-family: var(--font); color: var(--text); }
        .login-root {
          min-height: 100vh; display: flex; align-items: center;
          justify-content: center; background: var(--bg);
          position: relative; overflow: hidden;
        }
        .glow {
          position: absolute; width: 500px; height: 500px; border-radius: 50%;
          pointer-events: none;
        }
        .glow-1 {
          top: -150px; left: -150px;
          background: radial-gradient(circle, rgba(61,139,255,.1) 0%, transparent 70%);
        }
        .glow-2 {
          bottom: -150px; right: -150px;
          background: radial-gradient(circle, rgba(108,99,255,.08) 0%, transparent 70%);
        }
        .card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 20px; padding: 40px; width: 100%; max-width: 420px;
          position: relative; z-index: 1; box-shadow: 0 24px 80px rgba(0,0,0,.4);
        }
        .logo {
          font-family: var(--mono); font-size: 12px; font-weight: 600;
          letter-spacing: .1em; text-transform: uppercase; color: var(--accent);
          margin-bottom: 28px; text-align: center;
        }
        .card h1 { font-size: 22px; font-weight: 600; text-align: center; margin-bottom: 6px; }
        .card p { font-size: 13px; color: var(--muted); text-align: center; margin-bottom: 28px; }
        .field { margin-bottom: 16px; }
        .field label {
          display: block; font-size: 11px; font-weight: 500; color: var(--muted);
          margin-bottom: 6px; font-family: var(--mono); text-transform: uppercase;
          letter-spacing: .06em;
        }
        .field input {
          width: 100%; background: var(--panel); border: 1px solid var(--border);
          border-radius: 10px; padding: 11px 14px; font-family: var(--font);
          font-size: 14px; color: var(--text); outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .field input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(61,139,255,.12);
        }
        .field input::placeholder { color: var(--muted); }
        .error {
          background: rgba(248,113,113,.08); border: 1px solid rgba(248,113,113,.2);
          border-radius: 8px; padding: 10px 14px; font-size: 13px;
          color: var(--red); margin-bottom: 16px; text-align: center;
        }
        .login-btn {
          width: 100%; padding: 12px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border: none; border-radius: 10px; color: #fff;
          font-family: var(--font); font-size: 14px; font-weight: 500;
          cursor: pointer; transition: opacity .2s, transform .15s; margin-top: 4px;
        }
        .login-btn:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
        .login-btn:disabled { opacity: .5; cursor: not-allowed; }
        .spinner {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
          border-radius: 50%; animation: spin .6s linear infinite;
          margin-right: 8px; vertical-align: middle;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="login-root">
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <div className="card">
          <div className="logo">IDFA.AI — Admin Portal</div>
          <h1>Welcome back</h1>
          <p>Sign in to access the admin dashboard</p>

          {error && <div className="error">{error}</div>}

          <div className="field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="admin@ifdadigitalai.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <button className="login-btn" onClick={handleLogin} disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>
      </div>
    </>
  );
}