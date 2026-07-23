// ============================================================
// Navbar.jsx
// Top navigation bar with professional icons (lucide-react).
// Collapses into a hamburger menu on mobile/tablet widths.
// ============================================================

import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { BookOpen, TerminalSquare, User, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/login");
  }

  function handleLinkClick() {
    setMenuOpen(false);
  }

  function isActive(path) {
    return location.pathname.startsWith(path) ? "active" : "";
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={handleLinkClick}>
          <img src="/logo.png" alt="NWroot.io logo" />
          NWroot.io
        </Link>

        <button className="navbar-toggle" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle navigation menu">
          {menuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          {user ? (
            <>
              <Link to="/lessons" className={`navbar-link ${isActive("/lessons")}`} onClick={handleLinkClick}>
                <BookOpen size={14} /> Lessons
              </Link>
              <Link to="/sandbox" className={`navbar-link ${isActive("/sandbox")}`} onClick={handleLinkClick}>
                <TerminalSquare size={14} /> Sandbox
              </Link>
              <Link to="/profile" className={`navbar-link ${isActive("/profile")}`} onClick={handleLinkClick}>
                <User size={14} /> Profile
              </Link>
              <span className="navbar-user-chip">{user.firstName} {user.lastName}</span>
              <button className="btn-secondary btn-sm" onClick={handleLogout}>
                <LogOut size={13} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link" onClick={handleLinkClick}>Login</Link>
              <Link to="/signup" onClick={handleLinkClick}>
                <button className="btn-sm">Sign Up</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
