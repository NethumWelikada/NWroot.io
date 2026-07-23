// ============================================================
// main.jsx
// The actual entry point Vite loads first. Mounts the React
// app into the <div id="root"> element from index.html.
// ============================================================

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
