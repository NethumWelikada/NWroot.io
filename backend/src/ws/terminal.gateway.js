// ============================================================
// terminal.gateway.js
// This is what makes the "real terminal" feature work. It
// creates a WebSocket server that:
//   1. Accepts a connection from the browser's xterm.js terminal
//   2. Authenticates the user via their JWT token
//   3. Attaches to that user's real Docker container shell
//   4. Pipes keystrokes IN and command output OUT, both ways,
//      live - so it feels exactly like a real terminal, because
//      it is one.
// ============================================================

const { WebSocketServer } = require("ws");
const jwt = require("jsonwebtoken");
const url = require("url");
const db = require("../config/db");
const logger = require("../utils/logger");
const { attachToContainer } = require("../services/docker.service");

function setupTerminalGateway(httpServer) {
  // Create a WebSocket server that shares the same underlying HTTP server
  // as our Express app (so it can run on the same port, e.g. 3000)
  const wss = new WebSocketServer({ noServer: true });

  // ------------------------------------------------------------
  // Handle the initial HTTP "upgrade" request that turns a normal
  // HTTP connection into a WebSocket connection. We only allow
  // this for requests to our specific /ws/terminal path.
  // ------------------------------------------------------------
  httpServer.on("upgrade", (request, socket, head) => {
    const { pathname } = url.parse(request.url);

    if (pathname === "/ws/terminal") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy(); // reject any other upgrade path
    }
  });

  // ------------------------------------------------------------
  // Handle each new terminal WebSocket connection
  // ------------------------------------------------------------
  wss.on("connection", async (ws, request) => {
    try {
      // The frontend connects like: ws://host/ws/terminal?token=xxx&containerId=yyy
      const { query } = url.parse(request.url, true);
      const { token, containerId } = query;

      if (!token || !containerId) {
        ws.send("Connection rejected: missing token or containerId.\r\n");
        return ws.close();
      }

      // Verify the JWT token - same check as our HTTP auth middleware
      let user;
      try {
        user = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        ws.send("Connection rejected: invalid or expired session.\r\n");
        return ws.close();
      }

      // Confirm this container actually belongs to this user (security check -
      // stops a user from connecting to someone else's sandbox by guessing an ID)
      const [rows] = await db.query(
        "SELECT id FROM sandbox_sessions WHERE user_id = ? AND container_id = ? AND status = 'running'",
        [user.id, containerId]
      );

      if (rows.length === 0) {
        ws.send("Connection rejected: this sandbox does not belong to you.\r\n");
        return ws.close();
      }

      logger.info(`Terminal WebSocket connected for user ${user.email} -> container ${containerId}`);

      // Attach to the real Docker container's shell stream
      const dockerStream = await attachToContainer(containerId);

      // --- Docker container output -> browser terminal ---
      dockerStream.on("data", (chunk) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(chunk.toString("utf8"));
        }
      });

      // --- Browser terminal keystrokes -> Docker container input ---
      ws.on("message", (message) => {
        dockerStream.write(message.toString());
      });

      // --- Update "last active" timestamp periodically so idle cleanup works ---
      const activityInterval = setInterval(async () => {
        await db.query(
          "UPDATE sandbox_sessions SET last_active_at = NOW() WHERE container_id = ?",
          [containerId]
        );
      }, 60 * 1000); // every 60 seconds while the terminal is open

      // --- Cleanup when the browser closes the terminal tab/connection ---
      ws.on("close", () => {
        clearInterval(activityInterval);
        dockerStream.end();
        logger.info(`Terminal WebSocket closed for user ${user.email}`);
      });
    } catch (err) {
      logger.error(`Terminal WebSocket error: ${err.message}`);
      ws.close();
    }
  });

  logger.info("Terminal WebSocket gateway ready at /ws/terminal");
}

module.exports = { setupTerminalGateway };
