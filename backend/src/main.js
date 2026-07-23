// ============================================================
// main.js
// This is the entry point of the backend. It:
//   1. Loads environment variables from the root .env file
//   2. Sets up the Express app and all API routes
//   3. Starts the HTTP server
//   4. Attaches the WebSocket terminal gateway to the same server
//   5. Starts a recurring job to clean up idle sandbox sessions
// ============================================================

// Load .env from the project ROOT (one level up from /backend)
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const http = require("http");

const authRoutes = require("./routes/auth.routes");
const lessonsRoutes = require("./routes/lessons.routes");
const sandboxRoutes = require("./routes/sandbox.routes");
const profileRoutes = require("./routes/profile.routes");
const { setupTerminalGateway } = require("./ws/terminal.gateway");
const { cleanupIdleSessions } = require("./services/docker.service");
const logger = require("./utils/logger");

const app = express();

// --- Global middleware ---
app.use(cors());           // allows the frontend (different port/origin) to call this API
app.use(express.json());   // parses incoming JSON request bodies automatically

// --- Health check endpoint - useful for confirming the server is alive ---
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    app: process.env.APP_NAME,
    env: process.env.APP_ENV,
  });
});

// --- Mount feature routes under /api ---
app.use("/api/auth", authRoutes);
app.use("/api/lessons", lessonsRoutes);
app.use("/api/sandbox", sandboxRoutes);
app.use("/api/profile", profileRoutes);

// --- Catch-all 404 for unknown API routes ---
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found." });
});

// Create a raw HTTP server from the Express app so we can attach
// the WebSocket server to the exact same port (simpler deployment -
// only one port for Apache to proxy to).
const httpServer = http.createServer(app);

// Wire up the live terminal WebSocket gateway
setupTerminalGateway(httpServer);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  logger.info(`${process.env.APP_NAME} backend running in [${process.env.APP_ENV}] mode on port ${PORT}`);
  logger.info(`App URL: ${process.env.APP_URL}`);
});

// --- Recurring job: clean up idle sandbox sessions every 5 minutes ---
setInterval(() => {
  cleanupIdleSessions().catch((err) => logger.error(`Idle cleanup failed: ${err.message}`));
}, 5 * 60 * 1000);
