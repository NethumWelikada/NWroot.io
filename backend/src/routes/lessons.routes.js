// ============================================================
// lessons.routes.js
// URL paths for browsing lessons, tracking lesson-level and
// task-level progress. Progress-related routes require login.
// ============================================================

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  listLessons,
  getLesson,
  getProgress,
  markLessonComplete,
} = require("../controllers/lessons.controller");
const { getTaskProgress, validateTask } = require("../controllers/tasks.controller");

// GET /api/lessons -> list every lesson (public, no login required to browse)
router.get("/", listLessons);

// GET /api/lessons/progress -> the logged-in user's lesson-level progress
// (must be registered BEFORE the /:trackId/:lessonSlug route below, or
// Express would try to match "progress" as a trackId)
router.get("/progress", requireAuth, getProgress);

// GET /api/lessons/tasks/progress -> the logged-in user's TASK-level progress
// (also must come before the generic /:trackId/:lessonSlug route)
router.get("/tasks/progress", requireAuth, getTaskProgress);

// GET /api/lessons/:trackId/:lessonSlug -> full detail for one lesson
router.get("/:trackId/:lessonSlug", getLesson);

// POST /api/lessons/:trackId/:lessonSlug/complete -> mark a whole lesson done manually
// (kept as a manual override/escape hatch - e.g. for lessons that are
// genuinely hard to auto-validate - but task-level completion below is
// now the real, verified path used by the UI)
router.post("/:trackId/:lessonSlug/complete", requireAuth, markLessonComplete);

// POST /api/lessons/:trackId/:lessonSlug/tasks/:taskId/validate
// Phase 3: actually runs the task's validation command inside the
// user's real sandbox container - this REPLACES the old "/complete"
// task endpoint, which just trusted whatever the frontend claimed.
router.post("/:trackId/:lessonSlug/tasks/:taskId/validate", requireAuth, validateTask);

module.exports = router;
