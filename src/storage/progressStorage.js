/**
 * Local storage for user progress, daily goals, streak, etc.
 * All offline.
 */

import { normalizeStats, applyStudyActivity } from "../services/dailyGoal.js";

const PROGRESS_KEY = "ej-progress-v2";
const SETTINGS_KEY = "ej-settings-v1";
const STATS_KEY = "ej-stats-v1";

export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progressMap) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressMap));
  } catch (e) {
    console.warn("Failed to save progress", e);
  }
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw
      ? JSON.parse(raw)
      : { dailyGoal: 10, theme: "dark" };
  } catch {
    return { dailyGoal: 10, theme: "dark" };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn("Failed to save settings", e);
  }
}

export function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return normalizeStats(raw ? JSON.parse(raw) : null);
  } catch {
    return normalizeStats(null);
  }
}

export function saveStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn("Failed to save stats", e);
  }
}

/** Call once per rated card. isNewWord => counts toward the Daily Goal. */
export function recordStudyActivity(opts = {}) {
  const next = applyStudyActivity(loadStats(), opts);
  saveStats(next);
  return next;
}
