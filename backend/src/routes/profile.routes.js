// ============================================================
// profile.routes.js
// ============================================================

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { getStats } = require("../controllers/profile.controller");

router.get("/stats", requireAuth, getStats);

module.exports = router;
