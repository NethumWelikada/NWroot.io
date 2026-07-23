// ============================================================
// logger.js
// A very small logging helper. Using this instead of raw
// console.log everywhere keeps log output consistent and makes
// it easy to later swap in a real logging library (like Winston)
// without changing code all over the project.
// ============================================================

function info(message) {
  console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
}

function error(message) {
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
}

module.exports = { info, error };
