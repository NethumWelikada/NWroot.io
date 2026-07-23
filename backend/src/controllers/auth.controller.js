// ============================================================
// auth.controller.js
// Contains the actual logic for signup and login. Routes call
// these functions when a matching request comes in.
// ============================================================

const bcrypt = require("bcryptjs");   // used to safely hash passwords
const jwt = require("jsonwebtoken");  // used to create login session tokens
const db = require("../config/db");
const logger = require("../utils/logger");

// ------------------------------------------------------------
// POST /api/auth/signup
// Creates a new user account. Email doubles as the LOGIN
// username, but first/last name are collected separately so
// the UI can greet the user by name instead of showing their
// raw email address everywhere.
// ------------------------------------------------------------
async function signup(req, res) {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Basic validation - make sure every required field was actually sent
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: "First name, last name, email, and password are all required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    // Check if this email is already registered
    const [existingUsers] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    // Hash the password before storing it - we NEVER store plain text passwords.
    // "10" is the salt rounds (higher = more secure but slower). 10 is a good default.
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert the new user into the database, including their name
    const [result] = await db.query(
      "INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)",
      [email, passwordHash, firstName.trim(), lastName.trim()]
    );

    // Create a JWT token so the user is immediately logged in after signup
    const token = jwt.sign(
      { id: result.insertId, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    logger.info(`New user registered: ${email}`);

    return res.status(201).json({
      message: "Account created successfully.",
      token,
      user: {
        id: result.insertId,
        email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
    });
  } catch (err) {
    logger.error(`Signup failed: ${err.message}`);
    return res.status(500).json({ error: "Something went wrong creating your account." });
  }
}

// ------------------------------------------------------------
// POST /api/auth/login
// Logs an existing user in using email + password. Email is
// only the LOGIN identifier - the name fields are what the UI
// actually displays to the user.
// ------------------------------------------------------------
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // Look up the user by email
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      // Deliberately vague error message - don't reveal whether the email exists
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = users[0];

    // Compare the submitted password against the stored bcrypt hash
    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Password is correct - issue a new JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    logger.info(`User logged in: ${email}`);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    });
  } catch (err) {
    logger.error(`Login failed: ${err.message}`);
    return res.status(500).json({ error: "Something went wrong logging you in." });
  }
}

module.exports = { signup, login };
