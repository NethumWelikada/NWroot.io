// ============================================================
// Reveal.jsx
// Wraps any content in a subtle "fade + rise" animation that
// plays once, the first time the element scrolls into view.
// Uses IntersectionObserver (native browser API, no library
// needed) so it's cheap and doesn't run animation logic for
// content the user never scrolls to.
// ============================================================

import React, { useEffect, useRef, useState } from "react";

export default function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // If the browser doesn't support IntersectionObserver for some
    // reason, just show the content immediately rather than hiding it forever.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect(); // only animate in once, not every scroll pass
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "reveal-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
