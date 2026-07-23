// ============================================================
// profile.controller.js
// Returns stats for the logged-in user's profile page: XP,
// computed level, lessons completed, and tasks completed.
// ============================================================

const db = require("../config/db");
const logger = require("../utils/logger");

const XP_PER_LEVEL = 100; // every 100 XP = one level up

// ------------------------------------------------------------
// GET /api/profile/stats
// ------------------------------------------------------------
async function getStats(req, res) {
  try {
    const userId = req.user.id;

    const [[userRow]] = await db.query(
      "SELECT email, first_name, last_name, total_xp, created_at FROM users WHERE id = ?",
      [userId]
    );

    const [[lessonCountRow]] = await db.query(
      "SELECT COUNT(*) as count FROM lesson_progress WHERE user_id = ? AND status = 'completed'",
      [userId]
    );

    const [[taskCountRow]] = await db.query(
      "SELECT COUNT(*) as count FROM task_progress WHERE user_id = ?",
      [userId]
    );

    const totalXp = userRow.total_xp || 0;
    // Level is CALCULATED from XP here, never stored separately,
    // so it's impossible for level and XP to fall out of sync.
    const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
    const xpIntoCurrentLevel = totalXp % XP_PER_LEVEL;
    const xpToNextLevel = XP_PER_LEVEL - xpIntoCurrentLevel;

    return res.status(200).json({
      email: userRow.email,
      firstName: userRow.first_name,
      lastName: userRow.last_name,
      memberSince: userRow.created_at,
      totalXp,
      level,
      xpIntoCurrentLevel,
      xpToNextLevel,
      xpPerLevel: XP_PER_LEVEL,
      lessonsCompleted: lessonCountRow.count,
      tasksCompleted: taskCountRow.count,
    });
  } catch (err) {
    logger.error(`Failed to fetch profile stats: ${err.message}`);
    return res.status(500).json({ error: "Could not load profile stats." });
  }
}

module.exports = { getStats };
