// ============================================================
// Terminal.jsx
// Renders a real, interactive terminal in the browser using
// xterm.js, connected to the user's Docker sandbox container
// over a WebSocket. Everything typed here runs in a REAL
// container - this is not a simulation.
//
// Exposes a runCommand(cmd) method via ref so parent components
// (like the Lesson Workspace) can inject a suggested command
// directly into the terminal when the user clicks "Run".
// ============================================================

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

const TerminalView = forwardRef(function TerminalView({ containerId }, ref) {
  const terminalRef = useRef(null);
  const socketRef = useRef(null);

  // Expose runCommand() so a parent component can type a command
  // into this terminal programmatically (e.g. from a task's "Run" button)
  useImperativeHandle(ref, () => ({
    runCommand(command) {
      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(command + "\r"); // \r submits it, same as pressing Enter
      }
    },
  }));

  useEffect(() => {
    if (!containerId) return;

    const term = new XTerm({
      theme: { background: "#1A1A1A", foreground: "#F7F8F9" },
      fontFamily: "Geist Mono, monospace",
      fontSize: 13,
      cursorBlink: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    // Critical fix: xterm.js measures character width using whatever
    // font is ACTUALLY rendered at the moment fit() runs. If Geist Mono
    // hasn't finished downloading yet, the browser temporarily renders
    // with a narrower fallback font, so fit() calculates too many
    // columns. Once Geist Mono loads a moment later and swaps in
    // (wider characters), the terminal ends up rendering WIDER than
    // its container - which is exactly what caused the terminal to
    // visually overflow/get clipped on the right side. Waiting for
    // document.fonts.ready guarantees we measure with the real font.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => fitAddon.fit());
    } else {
      // Very old browsers without the Font Loading API - fall back to
      // a short delay instead, better than nothing.
      setTimeout(() => fitAddon.fit(), 300);
    }

    const token = localStorage.getItem("nwroot_token");
    const wsUrl = `${import.meta.env.VITE_WS_URL}/terminal?token=${token}&containerId=${containerId}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onmessage = (event) => term.write(event.data);
    socket.onclose = () => term.write("\r\n\r\n[Connection closed]\r\n");
    socket.onerror = () => term.write("\r\n\r\n[Connection error - check that the backend is running]\r\n");

    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) socket.send(data);
    });

    // xterm.js sizes itself in real pixels based on its container's
    // width/height at the moment fit() runs. A plain window "resize"
    // listener only fires when the BROWSER WINDOW itself changes size -
    // it does NOT fire when a CSS grid/flex layout change (like our
    // mobile breakpoint) resizes the container without the window
    // actually resizing (e.g. loading the page directly on a phone).
    // A ResizeObserver watches the actual container element instead,
    // so the terminal always matches its real available space.
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      socket.close();
      term.dispose();
    };
  }, [containerId]);

  return (
    <div className="terminal-wrapper">
      <div className="terminal-header">
        <span className="terminal-dot red"></span>
        <span className="terminal-dot yellow"></span>
        <span className="terminal-dot green"></span>
        <span className="terminal-header-label">student@nwroot-sandbox</span>
      </div>
      <div className="terminal-body">
        <div ref={terminalRef} style={{ height: "100%", padding: "8px" }} />
      </div>
    </div>
  );
});

export default TerminalView;
