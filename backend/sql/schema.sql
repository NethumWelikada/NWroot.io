-- ============================================================
-- NWroot.io Database Schema (FULL PRE-SETUP)
-- This single file creates the database, creates the MySQL
-- user, grants privileges, AND creates every table with all
-- columns already included (XP/level tracking, per-task
-- progress, and user names are all built in from the start).
-- Anyone who clones this repo can run ONE command to get a
-- fully working database - no manual MySQL setup steps and no
-- separate migrations required for a fresh install.
--
-- Run this as the MySQL root user (Ubuntu's default root account uses
-- socket authentication, so 'sudo' is required instead of a password):
--   sudo mysql < schema.sql
--
-- NOTE FOR EXISTING DEPLOYMENTS: if you already ran an older
-- version of this file, do NOT re-run this one - it will not
-- retroactively alter existing tables. Use the numbered files
-- in /backend/sql/migrations/ instead, in order, to bring an
-- existing database up to date without losing data.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Create the database (only if it doesn't already exist)
-- ------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS nwroot_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. Create the application's MySQL user + set password
--    These credentials MUST match the DB_USER / DB_PASSWORD
--    values in the project's .env file.
--    'localhost' means this user can only connect from the
--    same server the database runs on (safer default).
-- ------------------------------------------------------------
CREATE USER IF NOT EXISTS 'nwrootu'@'localhost' IDENTIFIED BY 'nwrootu12';

-- ------------------------------------------------------------
-- 3. Grant the app user full access to ONLY the nwroot_db
--    database (not to any other database on the server)
-- ------------------------------------------------------------
GRANT ALL PRIVILEGES ON nwroot_db.* TO 'nwrootu'@'localhost';
FLUSH PRIVILEGES;

-- ------------------------------------------------------------
-- 4. Switch into the new database before creating tables
-- ------------------------------------------------------------
USE nwroot_db;

-- ------------------------------------------------------------
-- users table
-- Stores registered accounts. Email doubles as the LOGIN
-- username (there is no separate username field), while
-- first_name/last_name are what the UI actually displays.
-- Passwords are always stored as bcrypt hashes, never plain text.
-- total_xp drives the level system - level is always CALCULATED
-- from this value at read time (level = floor(total_xp / 100) + 1),
-- never stored separately, so it can never drift out of sync.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,        
    password_hash VARCHAR(255) NOT NULL,       
    first_name VARCHAR(100) NOT NULL DEFAULT '',
    last_name VARCHAR(100) NOT NULL DEFAULT '',
    display_name VARCHAR(100) DEFAULT NULL,    
    total_xp INT NOT NULL DEFAULT 0,           
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- lesson_progress table
-- Tracks whole-lesson completion per user. lesson_id refers to
-- the folder/file path inside /backend/lessons
-- (e.g. "linux-fundamentals/01-filesystem-basics"). A lesson is
-- marked completed automatically once every task inside it has
-- been completed (see task_progress below) - it can also be
-- marked manually via the "Mark as Complete" endpoint.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lesson_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    lesson_id VARCHAR(255) NOT NULL,
    status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    started_at TIMESTAMP NULL DEFAULT NULL,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_lesson (user_id, lesson_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- task_progress table
-- Tracks completion of INDIVIDUAL tasks within a lesson (the
-- checkboxes in the Lesson Workspace UI), not just the lesson
-- as a whole. task_id matches the numeric "id" field of a task
-- inside its lesson's YAML file. Each completed task awards XP
-- (see backend/src/controllers/tasks.controller.js).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    lesson_id VARCHAR(255) NOT NULL,
    task_id INT NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_lesson_task (user_id, lesson_id, task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- sandbox_sessions table
-- Tracks active/past Docker sandbox sessions per user.
-- container_id is the real Docker container ID so the backend
-- can reconnect, monitor, or destroy it.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sandbox_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    container_id VARCHAR(255) NOT NULL,
    status ENUM('running', 'stopped', 'expired') DEFAULT 'running',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    stopped_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- badges table
-- Simple gamification: badges a user has earned (e.g. "Linux Fundamentals Complete")
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_name VARCHAR(100) NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
