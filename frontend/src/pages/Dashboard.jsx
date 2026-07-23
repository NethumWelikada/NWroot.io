// ============================================================
// Dashboard.jsx
// Landing page for logged-in users - quick stats strip plus
// entry points into Lessons and the Sandbox.
// ============================================================

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, TerminalSquare, Award, CheckSquare, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";
import { usePageTitle } from "../hooks/usePageTitle";
import Reveal from "../components/Reveal";

export default function Dashboard() {
  usePageTitle(null); // home page -> just "NWroot.io"
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    apiClient
      .get("/profile/stats")
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Failed to load stats:", err));
  }, []);

  return (
    <div className="container">
      <div className="page-header">
        <span className="hero-eyebrow">Sudo won't fix ignorance.</span>
        <h1>Welcome, {user?.firstName}</h1>
        <p>Real Linux, Docker, and DevOps skills - learned by actually doing it.</p>
      </div>

      {stats && (
        <div className="stat-strip">
          <Reveal delay={0}>
            <div className="card stat-box">
              <span className="stat-label"><Award size={11} /> Level</span>
              <div className="stat-value accent-orange">{stats.level}</div>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="card stat-box">
              <span className="stat-label"><Zap size={11} /> Total XP</span>
              <div className="stat-value accent-orange">{stats.totalXp}</div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="card stat-box">
              <span className="stat-label"><BookOpen size={11} /> Lessons Done</span>
              <div className="stat-value accent">{stats.lessonsCompleted}</div>
            </div>
          </Reveal>
          <Reveal delay={180}>
            <div className="card stat-box">
              <span className="stat-label"><CheckSquare size={11} /> Tasks Done</span>
              <div className="stat-value accent">{stats.tasksCompleted}</div>
            </div>
          </Reveal>
        </div>
      )}

      <div className="dashboard-cards">
        <Reveal delay={0}>
          <div className="card">
            <div className="feature-icon-box"><BookOpen size={18} /></div>
            <h3>Lessons</h3>
            <p>
              Guided, certification-style lessons across Linux, Docker, DevOps, and
              Solution Architecture fundamentals.
            </p>
            <Link to="/lessons">
              <button>Browse Lessons</button>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="card">
            <div className="feature-icon-box"><TerminalSquare size={18} /></div>
            <h3>Sandbox</h3>
            <p>
              Jump straight into a real, isolated Linux terminal - free play, no
              instructions, just a real environment to experiment in.
            </p>
            <Link to="/sandbox">
              <button>Open Sandbox</button>
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
