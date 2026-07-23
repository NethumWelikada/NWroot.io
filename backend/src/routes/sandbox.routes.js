// ============================================================
// sandbox.routes.js
// All sandbox routes require the user to be logged in - you
// must have an account to get a real Linux container.
// ============================================================

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { startSandbox, resetSandbox, stopSandbox } = require("../controllers/sandbox.controller");

router.post("/start", requireAuth, startSandbox);
router.post("/reset", requireAuth, resetSandbox);
router.post("/stop", requireAuth, stopSandbox);

module.exports = router;
