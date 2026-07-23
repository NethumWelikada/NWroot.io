// ============================================================
// Sandbox.jsx
// Free-play sandbox: a real Docker container with no guided
// tasks - just an open terminal to experiment in. Includes a
// Reset button to destroy and recreate a clean environment.
// ============================================================

import React, { useEffect, useState } from "react";
import { RotateCcw, AlertCircle, CornerDownLeft } from "lucide-react";
import apiClient from "../api/client";
import TerminalView from "../components/Terminal";
import { usePageTitle } from "../hooks/usePageTitle";

export default function Sandbox() {
  usePageTitle("Sandbox");
  const [containerId, setContainerId] = useState(null);
  const [status, setStatus] = useState("starting"); // starting | ready | error
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    startSandbox();
  }, []);

  async function startSandbox() {
    setStatus("starting");
    try {
      const res = await apiClient.post("/sandbox/start");
      setContainerId(res.data.containerId);
      setStatus("ready");
    } catch (err) {
      console.error("Failed to start sandbox:", err);
      setStatus("error");
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      const res = await apiClient.post("/sandbox/reset");
      setContainerId(null); // force the Terminal component to fully remount
      setTimeout(() => setContainerId(res.data.containerId), 100);
    } catch (err) {
      console.error("Failed to reset sandbox:", err);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="container">
      <div className="sandbox-header">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Your Sandbox</h1>
          <p>A real, isolated Ubuntu Linux container - not a simulation.</p>
        </div>
        <button className="btn-secondary" onClick={handleReset} disabled={resetting || status !== "ready"}>
          <RotateCcw size={13} /> {resetting ? "Resetting..." : "Reset Sandbox"}
        </button>
      </div>

      {status === "starting" && <p>Booting your sandbox container...</p>}
      {status === "error" && (
        <p className="error-message">
          <AlertCircle size={13} /> Could not start your sandbox. Make sure the backend and Docker are running.
        </p>
      )}
      {status === "ready" && containerId && (
        <>
          <p className="terminal-hint">
            <CornerDownLeft size={12} /> Press Enter once to activate the prompt.
          </p>
          <TerminalView containerId={containerId} />
        </>
      )}
    </div>
  );
}
