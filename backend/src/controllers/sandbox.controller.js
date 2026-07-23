// ============================================================
// sandbox.controller.js
// Handles HTTP requests related to starting/stopping a user's
// sandbox session. The actual live terminal connection happens
// separately over WebSocket (see ws/terminal.gateway.js) - this
// controller just manages the container lifecycle.
// ============================================================

const db = require("../config/db");
const logger = require("../utils/logger");
const {
  createSandboxContainer,
  destroySandboxContainer,
} = require("../services/docker.service");

// ------------------------------------------------------------
// POST /api/sandbox/start
// Creates a fresh sandbox container for the logged-in user.
// If the user already has a running session, it's reused
// instead of creating a duplicate.
// ------------------------------------------------------------
async function startSandbox(req, res) {
  try {
    const userId = req.user.id;

    // Check if this user already has a running sandbox
    const [existing] = await db.query(
      "SELECT container_id FROM sandbox_sessions WHERE user_id = ? AND status = 'running' LIMIT 1",
      [userId]
    );

    if (existing.length > 0) {
      return res.status(200).json({
        message: "Reusing existing sandbox session.",
        containerId: existing[0].container_id,
      });
    }

    // No existing session - create a brand new container
    const container = await createSandboxContainer(userId);

    return res.status(201).json({
      message: "Sandbox session started.",
      containerId: container.id,
    });
  } catch (err) {
    logger.error(`Failed to start sandbox: ${err.message}`);
    return res.status(500).json({ error: "Could not start sandbox session." });
  }
}

// ------------------------------------------------------------
// POST /api/sandbox/reset
// Destroys the user's current sandbox and immediately starts
// a brand new, clean one - this is the "Reset" button feature.
// ------------------------------------------------------------
async function resetSandbox(req, res) {
  try {
    const userId = req.user.id;

    const [existing] = await db.query(
      "SELECT container_id FROM sandbox_sessions WHERE user_id = ? AND status = 'running' LIMIT 1",
      [userId]
    );

    if (existing.length > 0) {
      await destroySandboxContainer(existing[0].container_id);
    }

    const newContainer = await createSandboxContainer(userId);

    return res.status(200).json({
      message: "Sandbox reset successfully.",
      containerId: newContainer.id,
    });
  } catch (err) {
    logger.error(`Failed to reset sandbox: ${err.message}`);
    return res.status(500).json({ error: "Could not reset sandbox session." });
  }
}

// ------------------------------------------------------------
// POST /api/sandbox/stop
// Stops the user's sandbox session (e.g. called on logout).
// ------------------------------------------------------------
async function stopSandbox(req, res) {
  try {
    const userId = req.user.id;

    const [existing] = await db.query(
      "SELECT container_id FROM sandbox_sessions WHERE user_id = ? AND status = 'running' LIMIT 1",
      [userId]
    );

    if (existing.length > 0) {
      await destroySandboxContainer(existing[0].container_id);
    }

    return res.status(200).json({ message: "Sandbox stopped." });
  } catch (err) {
    logger.error(`Failed to stop sandbox: ${err.message}`);
    return res.status(500).json({ error: "Could not stop sandbox session." });
  }
}

module.exports = { startSandbox, resetSandbox, stopSandbox };
