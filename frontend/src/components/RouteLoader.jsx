// ============================================================
// RouteLoader.jsx
// A slim progress bar at the very top of the page (like
// YouTube/GitHub's navigation indicator) that plays briefly on
// every route change, so switching pages feels like a smooth
// transition instead of a sudden jump-cut.
// ============================================================

import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function RouteLoader() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    // Clear any in-flight timers from a previous, still-animating navigation
    timers.current.forEach(clearTimeout);
    timers.current = [];

    setActive(true);
    setProgress(25);

    // Quickly ramp up, then "complete" and fade out - this is a purely
    // visual cue (page navigation itself is near-instant client-side
    // routing), not tied to real network/data loading time.
    timers.current.push(setTimeout(() => setProgress(70), 90));
    timers.current.push(
      setTimeout(() => {
        setProgress(100);
        timers.current.push(
          setTimeout(() => {
            setActive(false);
            setProgress(0);
          }, 220)
        );
      }, 260)
    );

    return () => timers.current.forEach(clearTimeout);
  }, [location.pathname]);

  return (
    <div
      className={`route-loader-bar ${active ? "route-loader-active" : ""}`}
      style={{ width: `${progress}%` }}
    />
  );
}
