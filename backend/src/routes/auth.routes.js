// ============================================================
// auth.routes.js
// Defines the URL paths for authentication and connects each
// one to its matching controller function.
// ============================================================

const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/auth.controller");

// POST /api/auth/signup -> create a new account
router.post("/signup", signup);

// POST /api/auth/login -> log into an existing account
router.post("/login", login);

module.exports = router;
