// ============================================================
// Profile.jsx
// Shows the logged-in user's stats: level, XP progress,
// lessons completed, and tasks completed.
// ============================================================

import React, { useEffect, useState } from "react";
import { Award, BookOpen, CheckSquare, Calendar, Zap } from "lucide-react";
import apiClient from "../api/client";
import { usePageTitle } from "../hooks/usePageTitle";
import Reveal from "../components/Reveal";

export default function Profile() {
  usePageTitle("Profile");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await apiClient.get("/profile/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load profile stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <div className="container">Booting profile...</div>;
  if (!stats) return <div className="container">Could not load profile.</div>;

  const progressPercent = Math.round((stats.xpIntoCurrentLevel / stats.xpPerLevel) * 100);
  const initial = stats.firstName ? stats.firstName.charAt(0).toUpperCase() : stats.email.charAt(0).toUpperCase();
  const memberSinceDate = new Date(stats.memberSince).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <div className="profile-header">
        <div className="profile-avatar">{initial}</div>
        <div>
          <h1 style={{ marginBottom: 4 }}>{stats.firstName} {stats.lastName}</h1>
          <p style={{ fontSize: 12, marginBottom: 8 }}>{stats.email}</p>
          <span className="profile-level-ring">
            <Award size={13} /> Level {stats.level}
          </span>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
            <Zap size={13} /> {stats.xpIntoCurrentLevel} / {stats.xpPerLevel} XP to Level {stats.level + 1}
          </span>
          <span style={{ fontSize: 11, color: "var(--color-text-faint)" }}>{stats.totalXp} XP total</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="profile-stats-grid">
        <Reveal delay={0}>
          <div className="card stat-box">
            <span className="stat-label"><BookOpen size={12} /> Lessons Completed</span>
            <div className="stat-value accent">{stats.lessonsCompleted}</div>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div className="card stat-box">
            <span className="stat-label"><CheckSquare size={12} /> Tasks Completed</span>
            <div className="stat-value accent">{stats.tasksCompleted}</div>
          </div>
        </Reveal>
        <Reveal delay={160}>
          <div className="card stat-box">
            <span className="stat-label"><Calendar size={12} /> Member Since</span>
            <div className="stat-value" style={{ fontSize: 14 }}>{memberSinceDate}</div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
