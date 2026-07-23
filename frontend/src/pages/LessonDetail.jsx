// ============================================================
// LessonDetail.jsx ("Lesson Workspace")
// The main learning screen: task list with hints/commands on
// the left, a REAL live terminal on the right. As of Phase 3,
// clicking a task's checkbox doesn't just mark it done - it
// actually runs that task's validation command inside the
// user's REAL sandbox container and only checks it off if the
// real output matches what's expected. No more self-reporting.
// ============================================================

import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Check, Copy, Play, ArrowLeft, Clock, Terminal as TerminalIcon, Loader2, AlertCircle } from "lucide-react";
import apiClient from "../api/client";
import TerminalView from "../components/Terminal";
import { usePageTitle } from "../hooks/usePageTitle";

export default function LessonDetail() {
  const { trackId, lessonSlug } = useParams();
  const lessonId = `${trackId}/${lessonSlug}`;

  const [lesson, setLesson] = useState(null);
  const [completedTaskIds, setCompletedTaskIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [containerId, setContainerId] = useState(null);
  const [sandboxStatus, setSandboxStatus] = useState("starting"); // starting | ready | error

  // Called unconditionally (before any early return below) per React's
  // rules of hooks. Shows a generic title while loading, then the real
  // lesson title once it arrives.
  usePageTitle(lesson ? lesson.title : "Lesson");
  const [copiedTaskId, setCopiedTaskId] = useState(null);

  // Phase 3 additions: which task (if any) is currently being validated,
  // and any validation failure message to show under a specific task.
  const [validatingTaskId, setValidatingTaskId] = useState(null);
  const [taskErrors, setTaskErrors] = useState({}); // { [taskId]: "message" }

  const terminalRef = useRef(null);

  // Load the lesson content + this user's task progress, and start
  // their sandbox container all in parallel on page load.
  useEffect(() => {
    async function loadEverything() {
      try {
        const [lessonRes, taskProgressRes, sandboxRes] = await Promise.all([
          apiClient.get(`/lessons/${trackId}/${lessonSlug}`),
          apiClient.get("/lessons/tasks/progress"),
          apiClient.post("/sandbox/start"),
        ]);

        setLesson(lessonRes.data.lesson);

        // Filter the full completed-task list down to just this lesson's tasks
        const completed = new Set(
          taskProgressRes.data.completed
            .filter((entry) => entry.startsWith(`${lessonId}:`))
            .map((entry) => parseInt(entry.split(":")[1], 10))
        );
        setCompletedTaskIds(completed);

        setContainerId(sandboxRes.data.containerId);
        setSandboxStatus("ready");
      } catch (err) {
        console.error("Failed to load lesson workspace:", err);
        setSandboxStatus("error");
      } finally {
        setLoading(false);
      }
    }
    loadEverything();
  }, [trackId, lessonSlug]);

  // ------------------------------------------------------------
  // Validate a single task - this is the Phase 3 core flow.
  // Runs the task's validation_command for real inside the
  // user's sandbox container (server-side) and only marks it
  // complete if the actual output matches. Shows a spinner while
  // running, and an inline error message right on the task card
  // if validation doesn't pass yet.
  // ------------------------------------------------------------
  async function handleValidateTask(taskId) {
    if (completedTaskIds.has(taskId) || validatingTaskId !== null) return; // already done, or another task mid-check

    setValidatingTaskId(taskId);
    setTaskErrors((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });

    try {
      const res = await apiClient.post(`/lessons/${trackId}/${lessonSlug}/tasks/${taskId}/validate`);

      if (res.data.success) {
        setCompletedTaskIds((prev) => new Set(prev).add(taskId));
      } else {
        // Server responded normally but the check didn't pass yet -
        // show the message (and any captured command output) inline
        setTaskErrors((prev) => ({
          ...prev,
          [taskId]: res.data.message || "That doesn't look right yet - try again.",
        }));
      }
    } catch (err) {
      console.error("Task validation request failed:", err);
      setTaskErrors((prev) => ({
        ...prev,
        [taskId]: err.response?.data?.error || "Could not validate this task. Check your sandbox is running.",
      }));
    } finally {
      setValidatingTaskId(null);
    }
  }

  function handleCopyCommand(command, taskId) {
    navigator.clipboard.writeText(command);
    setCopiedTaskId(taskId);
    setTimeout(() => setCopiedTaskId(null), 1500);
  }

  function handleRunCommand(command) {
    terminalRef.current?.runCommand(command);
  }

  if (loading) return <div className="container">Booting lesson workspace...</div>;
  if (!lesson) return <div className="container">Lesson not found.</div>;

  const allDone = lesson.tasks.every((t) => completedTaskIds.has(t.id));

  return (
    <div className="container" style={{ maxWidth: 1280 }}>
      <Link to="/lessons" className="navbar-link" style={{ display: "inline-flex", marginBottom: 14 }}>
        <ArrowLeft size={14} /> Back to Lessons
      </Link>

      <div className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h1 style={{ marginBottom: 0 }}>{lesson.title}</h1>
          <span className={`badge badge-${lesson.difficulty}`}>{lesson.difficulty}</span>
          {allDone && (
            <span className="lesson-meta done">
              <Check size={13} /> Lesson complete
            </span>
          )}
        </div>
        <p>{lesson.description}</p>
      </div>

      <div className="workspace-shell">
        {/* --- LEFT: task list with hints/commands --- */}
        <div className="workspace-tasks">
          <div className="card" style={{ fontSize: 12 }}>
            <strong>Exam relevance:</strong>
            <p style={{ marginTop: 4 }}>{lesson.exam_relevance}</p>
          </div>

          {lesson.tasks.map((task) => {
            const isDone = completedTaskIds.has(task.id);
            const isValidating = validatingTaskId === task.id;
            const errorMessage = taskErrors[task.id];

            return (
              <div key={task.id} className={`card task-card ${isDone ? "completed" : ""}`}>
                <div className="task-row">
                  <button
                    className={`task-checkbox ${isDone ? "checked" : ""}`}
                    onClick={() => handleValidateTask(task.id)}
                    disabled={isDone || isValidating}
                    aria-label={isDone ? "Task completed" : "Check this task"}
                    title={isDone ? "Completed" : "Click to check - runs the real validation command in your sandbox"}
                  >
                    {isDone && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                    {isValidating && <Loader2 size={13} className="spin-icon" />}
                  </button>

                  <div className="task-body">
                    <p className="task-instruction">Task {task.id}: {task.instruction}</p>

                    <div className="command-box">
                      <code>{task.hint}</code>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          className="command-copy-btn"
                          onClick={() => handleCopyCommand(task.hint, task.id)}
                          title="Copy hint"
                        >
                          {copiedTaskId === task.id ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                        <button
                          className="command-copy-btn"
                          onClick={() => handleRunCommand(task.hint)}
                          title="Type this into the terminal"
                        >
                          <Play size={13} />
                        </button>
                      </div>
                    </div>

                    {errorMessage && (
                      <p className="task-error-message">
                        <AlertCircle size={12} /> {errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {lesson.notes && (
            <div className="card" style={{ borderColor: "var(--color-accent)", fontSize: 12 }}>
              <strong>Note:</strong>
              <p style={{ marginTop: 4 }}>{lesson.notes}</p>
            </div>
          )}
        </div>

        {/* --- RIGHT: real live terminal --- */}
        <div className="workspace-terminal-col">
          {sandboxStatus === "starting" && (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <TerminalIcon size={20} style={{ marginBottom: 8 }} />
              <p>Booting your sandbox container...</p>
            </div>
          )}
          {sandboxStatus === "error" && (
            <p className="error-message">Could not start your sandbox. Check the backend and Docker are running.</p>
          )}
          {sandboxStatus === "ready" && containerId && (
            <>
              <p className="terminal-hint">
                Press Enter once to activate the prompt. Checking a task tests whether
                the real goal is achieved on your system right now - not your exact
                keystrokes, so fixing a typo and getting it working still passes.
              </p>
              <TerminalView ref={terminalRef} containerId={containerId} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
