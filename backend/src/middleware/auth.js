// ============================================================
// auth.js (middleware)
// This function runs BEFORE any "protected" route handler.
// It checks that the request has a valid JWT token in the
// Authorization header. If valid, it attaches the user's info
// to req.user so later code knows who is making the request.
// If invalid or missing, it blocks the request with a 401 error.
// ============================================================

const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  // Expect header format: "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No authentication token provided." });
  }

  const token = authHeader.split(" ")[1]; // grab the part after "Bearer "

  try {
    // Verify the token was signed by us and hasn't expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach { id, email } to the request for later use
    next(); // token is valid, continue to the actual route handler
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

module.exports = { requireAuth };
