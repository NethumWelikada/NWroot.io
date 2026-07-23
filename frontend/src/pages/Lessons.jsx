// ============================================================
// Lessons.jsx
// Shows every lesson as a single tile board (not stacked
// per-track sections, which looked sparse/empty when a track
// only has 1-2 lessons). Category chips at the top let the
// user filter by track, and a search box filters by text.
// Each lesson tile shows its category icon/color so tracks
// stay visually distinct even in one shared grid.
// ============================================================

import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search, Terminal, Users, HardDrive, Power, Network, Globe, Database, Box, GitBranch, Blocks, Ship,
  CheckCircle2, Clock, LayoutGrid,
} from "lucide-react";
import apiClient from "../api/client";
import { usePageTitle } from "../hooks/usePageTitle";
import Reveal from "../components/Reveal";

// Maps each lesson track folder name to a label, icon, and
// accent color - so tracks are visually distinct and memorable.
const TRACK_META = {
  "linux-fundamentals": { label: "Linux Fundamentals", icon: Terminal, color: "var(--cat-linux)" },
  "linux-users-permissions": { label: "Users & Permissions", icon: Users, color: "var(--cat-users)" },
  "linux-storage-lvm": { label: "Storage & LVM", icon: HardDrive, color: "var(--cat-storage)" },
  "linux-systemd-services": { label: "Systemd & Services", icon: Power, color: "var(--cat-systemd)" },
  "linux-networking-firewall": { label: "Networking & Firewall", icon: Network, color: "var(--cat-network)" },
  "apache-labs": { label: "Apache Labs", icon: Globe, color: "var(--cat-apache)" },
  "mysql-labs": { label: "MySQL Labs", icon: Database, color: "var(--cat-mysql)" },
  "docker-labs": { label: "Docker Labs", icon: Box, color: "var(--cat-docker)" },
  "github-actions-labs": { label: "GitHub Actions", icon: GitBranch, color: "var(--cat-cicd)" },
  "iac-labs": { label: "Infrastructure as Code", icon: Blocks, color: "var(--cat-iac)" },
  "kubernetes-labs": { label: "Kubernetes", icon: Ship, color: "var(--cat-k8s)" },
};

export default function Lessons() {
  usePageTitle("Lessons");
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    async function loadData() {
      try {
        const [lessonsRes, progressRes] = await Promise.all([
          apiClient.get("/lessons"),
          apiClient.get("/lessons/progress"),
        ]);

        setLessons(lessonsRes.data.lessons);

        const progressMap = {};
        progressRes.data.progress.forEach((p) => {
          progressMap[p.lesson_id] = p.status;
        });
        setProgress(progressMap);
      } catch (err) {
        console.error("Failed to load lessons:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Only show category chips for tracks that actually have lessons
  const availableCategories = useMemo(() => {
    const tracks = new Set(lessons.map((l) => l.track));
    return Array.from(tracks);
  }, [lessons]);

  // Apply both the search query AND the selected category filter
  const filteredLessons = useMemo(() => {
    let result = lessons;

    if (activeCategory !== "all") {
      result = result.filter((l) => l.track === activeCategory);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (l) => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
      );
    }

    return result;
  }, [lessons, query, activeCategory]);

  if (loading) {
    return <div className="container">Booting lessons...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Lessons</h1>
        <p>Real, hands-on lessons across Linux fundamentals and certification-style topics.</p>
      </div>

      <div className="lessons-toolbar">
        <div className="search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search lessons..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* --- Category filter chips --- */}
      <div className="category-chips">
        <button
          className={`chip ${activeCategory === "all" ? "active" : ""}`}
          onClick={() => setActiveCategory("all")}
        >
          <LayoutGrid size={13} /> All
        </button>
        {availableCategories.map((track) => {
          const meta = TRACK_META[track] || { label: track, icon: Terminal, color: "var(--color-accent-text)" };
          const Icon = meta.icon;
          return (
            <button
              key={track}
              className={`chip ${activeCategory === track ? "active" : ""}`}
              style={{ "--chip-color": meta.color }}
              onClick={() => setActiveCategory(track)}
            >
              <Icon size={13} /> {meta.label}
            </button>
          );
        })}
      </div>

      {/* --- Tile board: every matching lesson in one shared grid --- */}
      {filteredLessons.length === 0 ? (
        <div className="empty-state">
          <p>No lessons match your filters.</p>
        </div>
      ) : (
        <div className="lesson-grid">
          {filteredLessons.map((lesson, index) => {
            const status = progress[lesson.id] || "not_started";
            const isDone = status === "completed";
            const meta = TRACK_META[lesson.track] || { label: lesson.track, icon: Terminal, color: "var(--color-accent-text)" };
            const TrackIcon = meta.icon;

            return (
              <Reveal key={lesson.id} delay={Math.min(index * 40, 320)}>
                <Link to={`/lessons/${lesson.id}`} style={{ textDecoration: "none" }}>
                  <div className="card lesson-card">
                    <div className="lesson-category-tag" style={{ "--track-color": meta.color }}>
                      <TrackIcon size={12} /> {meta.label}
                    </div>

                    <div className="lesson-top-row">
                      <h3>{lesson.title}</h3>
                      <span className={`badge badge-${lesson.difficulty}`}>{lesson.difficulty}</span>
                    </div>
                    <p className="lesson-desc">{lesson.description}</p>
                    <span className={`lesson-meta ${isDone ? "done" : ""}`}>
                      {isDone ? (
                        <><CheckCircle2 size={12} /> Completed</>
                      ) : (
                        <><Clock size={12} /> {lesson.estimated_minutes} min</>
                      )}
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
