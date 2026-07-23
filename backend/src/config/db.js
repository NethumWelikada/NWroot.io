// ============================================================
// db.js
// Sets up a MySQL connection pool that the rest of the backend
// reuses. A "pool" means we don't open/close a new database
// connection for every single request - much faster and safer
// under load.
// ============================================================

const mysql = require("mysql2/promise"); // "promise" version lets us use async/await

// Create the pool using credentials from the .env file (loaded in main.js)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: process.env.DB_CHARSET || "utf8mb4",
  waitForConnections: true, // if all connections are busy, wait instead of crashing
  connectionLimit: 10,      // max simultaneous DB connections
  queueLimit: 0,
});

// Export the pool so any file can run: const db = require("../config/db");
module.exports = pool;
