// ============================================================
// Signup.jsx
// Same split-panel layout as Login. Email is still used as the
// LOGIN username (no separate username field), but first/last
// name are also collected so the rest of the app can greet the
// user by name instead of displaying their raw email address.
// ============================================================

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";
import AuthTerminalDemo from "../components/AuthTerminalDemo";

export default function Signup() {
  usePageTitle("Sign Up");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await signup(firstName, lastName, email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-brand-panel">
        <span className="hero-eyebrow">Free · No Credit Card</span>
        <h1 className="tagline">
          Get real hands-on <span className="accent">Linux practice</span> today.
        </h1>
        <p className="subtext">
          Every command runs in a real, isolated container. Break things, reset,
          and try again - that's how the skill actually sticks.
        </p>
        <div className="auth-feature-list">
          <div className="auth-feature-item"><span className="dot" />Most Important Lessons</div>
          <div className="auth-feature-item"><span className="dot" />Instant sandbox reset anytime</div>
          <div className="auth-feature-item"><span className="dot" />Built for complete beginners</div>
        </div>
        <AuthTerminalDemo />
      </div>

      <div className="auth-form-panel">
        <div className="auth-container">
          <h1>Create your account</h1>
          <p className="subtitle">Start learning real Linux, hands-on, for free.</p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", gap: 10 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="firstName">First Name</label>
                <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="lastName">Last Name</label>
                <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email (used as your username)</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password (min. 8 characters)</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="btn-block" disabled={submitting} style={{ marginTop: 8 }}>
              {submitting ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
