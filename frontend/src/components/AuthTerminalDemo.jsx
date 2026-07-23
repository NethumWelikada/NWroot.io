// ============================================================
// AuthTerminalDemo.jsx
// A small, purely decorative animated terminal for the Login
// and Signup pages - types out a short sequence of real Linux
// commands and their output, looping continuously. Matches the
// project's actual terminal styling so it looks like a genuine
// preview of the product, not a generic stock animation.
// ============================================================

import React, { useEffect, useState, useRef } from "react";

// Each entry types out as a "typed" line; isOutput lines appear
// instantly right after (simulating command output, not user typing)
const SCRIPT = [
  { text: "whoami", isOutput: false },
  { text: "student", isOutput: true },
  { text: "sudo systemctl start apache2", isOutput: false },
  { text: "sudo systemctl status apache2", isOutput: false },
  { text: "● apache2.service - active (running)", isOutput: true },
  { text: "curl localhost", isOutput: false },
  { text: "It works!", isOutput: true },
];

const TYPE_SPEED_MS = 45;
const LINE_PAUSE_MS = 500;
const OUTPUT_PAUSE_MS = 700;
const RESTART_PAUSE_MS = 1800;

export default function AuthTerminalDemo() {
  const [lines, setLines] = useState([]); // completed lines shown above the active one
  const [currentText, setCurrentText] = useState("");
  const [scriptIndex, setScriptIndex] = useState(0);
  const bodyRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const step = SCRIPT[scriptIndex];

    if (!step) {
      // Reached the end of the script - pause, then reset and loop
      const t = setTimeout(() => {
        if (cancelled) return;
        setLines([]);
        setCurrentText("");
        setScriptIndex(0);
      }, RESTART_PAUSE_MS);
      return () => clearTimeout(t);
    }

    if (step.isOutput) {
      // Output lines appear instantly (not "typed" character by character),
      // since real command output doesn't get typed by a user
      const t = setTimeout(() => {
        if (cancelled) return;
        setLines((prev) => [...prev, { text: step.text, isOutput: true }]);
        setCurrentText("");
        setScriptIndex((i) => i + 1);
      }, OUTPUT_PAUSE_MS);
      return () => clearTimeout(t);
    }

    // Typed command line - reveal one character at a time
    if (currentText.length < step.text.length) {
      const t = setTimeout(() => {
        if (cancelled) return;
        setCurrentText(step.text.slice(0, currentText.length + 1));
      }, TYPE_SPEED_MS);
      return () => clearTimeout(t);
    }

    // Finished typing this command - pause, then move it into the
    // completed lines list and advance to the next script step
    const t = setTimeout(() => {
      if (cancelled) return;
      setLines((prev) => [...prev, { text: step.text, isOutput: false }]);
      setCurrentText("");
      setScriptIndex((i) => i + 1);
    }, LINE_PAUSE_MS);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [currentText, scriptIndex]);

  // Keep the fixed-height box scrolled to the bottom as new lines
  // appear - exactly how a real terminal behaves, instead of the
  // box itself growing taller with every new line.
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [lines, currentText]);

  const activeStep = SCRIPT[scriptIndex];
  const isTypingCommand = activeStep && !activeStep.isOutput;

  return (
    <div className="auth-terminal-demo">
      <div className="terminal-header">
        <span className="terminal-dot red"></span>
        <span className="terminal-dot yellow"></span>
        <span className="terminal-dot green"></span>
        <span className="terminal-header-label">student@nwroot-sandbox</span>
      </div>
      <div className="auth-terminal-body" ref={bodyRef}>
        {lines.map((line, i) => (
          <div key={i} className={line.isOutput ? "auth-terminal-output" : "auth-terminal-line"}>
            {!line.isOutput && <span className="auth-terminal-prompt">$</span>} {line.text}
          </div>
        ))}
        {isTypingCommand && (
          <div className="auth-terminal-line">
            <span className="auth-terminal-prompt">$</span> {currentText}
            <span className="auth-terminal-cursor">▍</span>
          </div>
        )}
      </div>
    </div>
  );
}
