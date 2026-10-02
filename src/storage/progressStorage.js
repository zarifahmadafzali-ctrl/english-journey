/**
 * Local storage for user progress, daily goals, streak, etc.
 * All offline.
 */

import { getLocalDateKey } from "../utils/helpers";

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
    return raw
      ? JSON.parse(raw)
      : {
          currentStreak: 0,
          totalStudyDays: 0,
          lastStudyDate: null,
          wordsStudiedToday: 0,
          studyDate: null
        };
  } catch {
    return {
      currentStreak: 0,
      totalStudyDays: 0,
      lastStudyDate: null,
      wordsStudiedToday: 0,
      studyDate: null
    };
  }
}

export function saveStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn("Failed to save stats", e);
  }
}

/**
 * Ensure stats reflect the current local calendar day.
 * Resets wordsStudiedToday when the local date changes.
 */
export function ensureTodayStats() {
  const stats = loadStats();
  const today = getLocalDateKey();

  if (stats.studyDate !== today) {
    // New local day — reset daily counter; streak handled on activity
    stats.wordsStudiedToday = 0;
    stats.studyDate = today;
    // do not touch lastStudyDate / streak until actual activity
    saveStats(stats);
  }
  return stats;
}

/**
 * Call this when user learns a NEW word today (not for pure reviews).
 * Handles streak + daily new-word count using local device date.
 */
export function recordNewWordActivity(count = 1) {
  const stats = loadStats();
  const today = getLocalDateKey();

  if (stats.studyDate !== today) {
    // New local day
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = getLocalDateKey(yesterday);

    if (stats.lastStudyDate === yStr || stats.studyDate === yStr) {
      stats.currentStreak = (stats.currentStreak || 0) + 1;
    } else {
      stats.currentStreak = 1;
    }
    stats.totalStudyDays = (stats.totalStudyDays || 0) + 1;
    stats.wordsStudiedToday = count;
    stats.studyDate = today;
    stats.lastStudyDate = today;
  } else {
    stats.wordsStudiedToday = (stats.wordsStudiedToday || 0) + count;
  }

  saveStats(stats);
  return stats;
}

/** @deprecated use recordNewWordActivity for daily goal; kept for compatibility */
export function recordStudyActivity(count = 1) {
  return recordNewWordActivity(count);
}
