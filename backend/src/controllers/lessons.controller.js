// ============================================================
// lessons.controller.js
// Handles requests for lesson content and for tracking a
// user's progress through lessons.
// ============================================================

const db = require("../config/db");
const logger = require("../utils/logger");
const { getAllLessons, getLessonById } = require("../services/lesson.service");

// ------------------------------------------------------------
// GET /api/lessons
// Returns every lesson across every track, grouped so the
// frontend can render a full curriculum list.
// ------------------------------------------------------------
async function listLessons(req, res) {
  const lessons = getAllLessons();
  return res.status(200).json({ lessons });
}

// ------------------------------------------------------------
// GET /api/lessons/:trackId/:lessonSlug
// Returns the full content (tasks, validation steps) for one lesson.
// ------------------------------------------------------------
async function getLesson(req, res) {
  const lessonId = `${req.params.trackId}/${req.params.lessonSlug}`;
  const lesson = getLessonById(lessonId);

  if (!lesson) {
    return res.status(404).json({ error: "Lesson not found." });
  }

  return res.status(200).json({ lesson });
}

// ------------------------------------------------------------
// GET /api/lessons/progress
// Returns the logged-in user's progress across all lessons.
// ------------------------------------------------------------
async function getProgress(req, res) {
  try {
    const [rows] = await db.query(
      "SELECT lesson_id, status, completed_at FROM lesson_progress WHERE user_id = ?",
      [req.user.id]
    );
    return res.status(200).json({ progress: rows });
  } catch (err) {
    logger.error(`Failed to fetch progress: ${err.message}`);
    return res.status(500).json({ error: "Could not load progress." });
  }
}

// ------------------------------------------------------------
// POST /api/lessons/:trackId/:lessonSlug/complete
// Marks a lesson as completed for the logged-in user.
// In a full build, this would be triggered automatically once
// the live sandbox validation confirms the task was done - for
// this MVP, it can also be called directly when a lesson's
// steps are all checked off in the UI.
// ------------------------------------------------------------
async function markLessonComplete(req, res) {
  try {
    const lessonId = `${req.params.trackId}/${req.params.lessonSlug}`;

    // "ON DUPLICATE KEY UPDATE" means: insert a new row, but if this
    // user+lesson combination already exists, just update it instead.
    await db.query(
      `INSERT INTO lesson_progress (user_id, lesson_id, status, started_at, completed_at)
       VALUES (?, ?, 'completed', NOW(), NOW())
       ON DUPLICATE KEY UPDATE status = 'completed', completed_at = NOW()`,
      [req.user.id, lessonId]
    );

    return res.status(200).json({ message: "Lesson marked as complete." });
  } catch (err) {
    logger.error(`Failed to mark lesson complete: ${err.message}`);
    return res.status(500).json({ error: "Could not update lesson progress." });
  }
}

module.exports = { listLessons, getLesson, getProgress, markLessonComplete };
