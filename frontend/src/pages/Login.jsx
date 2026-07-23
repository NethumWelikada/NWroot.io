// ============================================================
// Login.jsx
// Split-panel layout: brand/value-prop on the left (desktop),
// login form on the right. Collapses to just the form on
// tablet/mobile (see .auth-shell responsive rules in index.css).
// ============================================================

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";
import AuthTerminalDemo from "../components/AuthTerminalDemo";

export default function Login() {
  usePageTitle("Login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-brand-panel">
        <span className="hero-eyebrow">Sudo won't fix ignorance.</span>
        <h1 className="tagline">
          Learn Linux the way <span className="accent">you'll actually use it.</span>
        </h1>
        <p className="subtext">
          Real Docker sandboxes, certification-style lessons, and a live terminal -
          not a simulation, not a video.
        </p>
        <div className="auth-feature-list">
          <div className="auth-feature-item"><span className="dot" />Real isolated Linux containers</div>
          <div className="auth-feature-item"><span className="dot" />Linux, Docker, and DevOps labs</div>
          <div className="auth-feature-item"><span className="dot" />Certification-style, exam-relevant tasks</div>
        </div>
        <AuthTerminalDemo />
      </div>

      <div className="auth-form-panel">
        <div className="auth-container">
          <h1>Welcome back</h1>
          <p className="subtitle">Log in to continue your Linux journey.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="btn-block" disabled={submitting} style={{ marginTop: 8 }}>
              {submitting ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
