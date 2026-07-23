// ============================================================
// tasks.controller.js
// Handles per-task completion. As of Phase 3, completion is no
// longer self-reported - completeTaskViaValidation actually runs
// the task's validation_command inside the user's REAL sandbox
// container and only awards completion/XP if the real output
// matches what's expected. The old direct-complete path is kept
// only as an internal helper shared by both flows, not exposed
// as its own "just trust me" endpoint anymore.
// ============================================================

const db = require("../config/db");
const logger = require("../utils/logger");
const { getLessonById } = require("../services/lesson.service");
const { execInContainer } = require("../services/docker.service");

const XP_PER_TASK = 10; // flat XP award per completed task - simple, predictable

// ------------------------------------------------------------
// GET /api/tasks/progress
// Returns every task the logged-in user has completed, as a
// flat list of "lessonId:taskId" strings for easy lookup on
// the frontend.
// ------------------------------------------------------------
async function getTaskProgress(req, res) {
  try {
    const [rows] = await db.query(
      "SELECT lesson_id, task_id FROM task_progress WHERE user_id = ?",
      [req.user.id]
    );
    const completed = rows.map((r) => `${r.lesson_id}:${r.task_id}`);
    return res.status(200).json({ completed });
  } catch (err) {
    logger.error(`Failed to fetch task progress: ${err.message}`);
    return res.status(500).json({ error: "Could not load task progress." });
  }
}

// ------------------------------------------------------------
// recordTaskCompletion(userId, lessonId, taskId, lesson)
// Shared internal helper: records a task as complete, awards
// XP (only once - re-completing an already-done task is a
// no-op, not double XP), and auto-completes the parent lesson
// once every task inside it is done. Used only AFTER validation
// has confirmed the task was actually done correctly.
// ------------------------------------------------------------
async function recordTaskCompletion(userId, lessonId, taskId, lesson) {
  const [existing] = await db.query(
    "SELECT id FROM task_progress WHERE user_id = ? AND lesson_id = ? AND task_id = ?",
    [userId, lessonId, taskId]
  );

  let xpAwarded = 0;

  if (existing.length === 0) {
    await db.query(
      "INSERT INTO task_progress (user_id, lesson_id, task_id) VALUES (?, ?, ?)",
      [userId, lessonId, taskId]
    );
    await db.query("UPDATE users SET total_xp = total_xp + ? WHERE id = ?", [XP_PER_TASK, userId]);
    xpAwarded = XP_PER_TASK;
  }

  const [completedTasks] = await db.query(
    "SELECT task_id FROM task_progress WHERE user_id = ? AND lesson_id = ?",
    [userId, lessonId]
  );
  const completedIds = new Set(completedTasks.map((t) => t.task_id));
  const allTasksDone = lesson.tasks.every((t) => completedIds.has(t.id));

  if (allTasksDone) {
    await db.query(
      `INSERT INTO lesson_progress (user_id, lesson_id, status, started_at, completed_at)
       VALUES (?, ?, 'completed', NOW(), NOW())
       ON DUPLICATE KEY UPDATE status = 'completed', completed_at = NOW()`,
      [userId, lessonId]
    );
  }

  return { xpAwarded, lessonCompleted: allTasksDone };
}

// ------------------------------------------------------------
// POST /api/lessons/:trackId/:lessonSlug/tasks/:taskId/validate
// THE core of Phase 3: runs the task's real validation_command
// inside the user's actual running sandbox container, checks
// the real output, and only records completion/XP if it
// genuinely passes. No more "click a checkbox and trust it."
// ------------------------------------------------------------
async function validateTask(req, res) {
  try {
    const lessonId = `${req.params.trackId}/${req.params.lessonSlug}`;
    const taskId = parseInt(req.params.taskId, 10);
    const userId = req.user.id;

    const lesson = getLessonById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found." });
    }

    const task = lesson.tasks.find((t) => t.id === taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    if (!task.validation_command) {
      return res.status(400).json({ error: "This task has no validation command configured." });
    }

    // Find the user's currently running sandbox container - validation
    // needs a real container to exec into, not just any container ID
    // the frontend might send (never trust the client for this).
    const [sessions] = await db.query(
      "SELECT container_id FROM sandbox_sessions WHERE user_id = ? AND status = 'running' LIMIT 1",
      [userId]
    );

    if (sessions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No active sandbox session found. Open the Sandbox or a lesson first to start one.",
      });
    }

    const containerId = sessions[0].container_id;

    let result;
    try {
      result = await execInContainer(containerId, task.validation_command);
    } catch (execErr) {
      logger.error(`Validation exec failed for user ${userId}, task ${lessonId}:${taskId}: ${execErr.message}`);
      return res.status(500).json({
        success: false,
        error: "Could not run the validation command in your sandbox. Make sure your sandbox is still running.",
      });
    }

    // Decide pass/fail: if the lesson specifies expected output text,
    // check the real output actually contains it. If expected_output_contains
    // is intentionally blank (some read-only inspection tasks), fall back
    // to just checking the command exited successfully (exit code 0).
    const expected = task.expected_output_contains;
    const passed = expected && expected.length > 0
      ? result.output.includes(expected)
      : result.exitCode === 0;

    if (!passed) {
      return res.status(200).json({
        success: false,
        message: "That doesn't look right yet - check the command and try again.",
        // Capped length - this is shown back to the user for debugging,
        // not meant to be an unbounded dump of arbitrary command output.
        output: result.output.slice(0, 500),
      });
    }

    const { xpAwarded, lessonCompleted } = await recordTaskCompletion(userId, lessonId, taskId, lesson);

    return res.status(200).json({
      success: true,
      message: "Validated - nice work.",
      xpAwarded,
      lessonCompleted,
    });
  } catch (err) {
    logger.error(`Task validation failed: ${err.message}`);
    return res.status(500).json({ success: false, error: "Something went wrong validating this task." });
  }
}

module.exports = { getTaskProgress, validateTask };
