// ============================================================
// lesson.service.js
// Reads lesson definitions from the /lessons folder at the
// project root. Each lesson is a YAML file describing its
// title, description, tasks, and validation commands.
// Keeping lessons as plain files (not in the database) means
// anyone can add new lessons just by adding a new YAML file -
// no code changes or database migrations needed.
// ============================================================

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

// The /lessons folder now lives inside /backend (backend/lessons),
// since lessons are backend-owned content, not shared with the frontend.
const LESSONS_ROOT = path.join(__dirname, "..", "..", "lessons");

// ------------------------------------------------------------
// Walks through every track folder inside /lessons and every
// .yaml file inside those, returning a flat list of lessons.
// ------------------------------------------------------------
function getAllLessons() {
  const lessons = [];

  // Guard clause: if the lessons folder doesn't exist yet, return empty
  if (!fs.existsSync(LESSONS_ROOT)) {
    return lessons;
  }

  const tracks = fs.readdirSync(LESSONS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory()); // only look at folders (tracks)

  for (const track of tracks) {
    const trackPath = path.join(LESSONS_ROOT, track.name);
    const files = fs.readdirSync(trackPath).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));

    for (const file of files) {
      const fullPath = path.join(trackPath, file);
      const raw = fs.readFileSync(fullPath, "utf8");

      try {
        const parsed = yaml.load(raw);
        lessons.push({
          id: `${track.name}/${file.replace(/\.ya?ml$/, "")}`, // e.g. "linux-fundamentals/01-filesystem-basics"
          track: track.name,
          ...parsed,
        });
      } catch (err) {
        console.error(`Failed to parse lesson file ${fullPath}: ${err.message}`);
      }
    }
  }

  return lessons;
}

// ------------------------------------------------------------
// Finds a single lesson by its id (e.g. "linux-fundamentals/01-filesystem-basics")
// ------------------------------------------------------------
function getLessonById(lessonId) {
  const all = getAllLessons();
  return all.find((lesson) => lesson.id === lessonId) || null;
}

module.exports = { getAllLessons, getLessonById };
