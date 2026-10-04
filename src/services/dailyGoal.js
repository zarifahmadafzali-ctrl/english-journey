/**
 * Daily Goal + streak logic (pure functions, no storage, no React).
 * Daily Goal counts NEW words only. SRS reviews never count toward it.
 * All dates are LOCAL calendar dates (YYYY-MM-DD), not UTC.
 */
import { localDateStr, previousLocalDateStr } from "../utils/helpers.js";

export const DEFAULT_STATS = {
  currentStreak: 0,
  totalStudyDays: 0,
  lastStudyDate: null,
  studyDate: null,
  newWordsToday: 0
};

export function normalizeStats(raw) {
  return { ...DEFAULT_STATS, ...(raw || {}) };
}

export function getNewWordsToday(stats, today = localDateStr()) {
  return stats && stats.studyDate === today ? stats.newWordsToday || 0 : 0;
}

export function getRemainingNewSlots(goal, stats, today = localDateStr()) {
  return Math.max(0, (goal || 0) - getNewWordsToday(stats, today));
}

/** Streak shown to the user: 0 if the last study day is older than yesterday. */
export function getEffectiveStreak(stats, today = localDateStr()) {
  const s = normalizeStats(stats);
  if (s.lastStudyDate === today || s.lastStudyDate === previousLocalDateStr(today)) {
    return s.currentStreak || 0;
  }
  return 0;
}

/** Returns NEW stats after one rated card. Any rating counts for the streak. */
export function applyStudyActivity(stats, { isNewWord = false, today = localDateStr() } = {}) {
  const s = normalizeStats(stats);
  if (s.studyDate !== today) {
    s.studyDate = today;
    s.newWordsToday = 0;
  }
  if (s.lastStudyDate !== today) {
    s.currentStreak =
      s.lastStudyDate === previousLocalDateStr(today) ? (s.currentStreak || 0) + 1 : 1;
    s.totalStudyDays = (s.totalStudyDays || 0) + 1;
    s.lastStudyDate = today;
  }
  if (isNewWord) s.newWordsToday = (s.newWordsToday || 0) + 1;
  return s;
}

/**
 * Decides whether a rating may be applied. This is the real enforcement:
 * rateWord() calls it, so no page/button can start a new word past the limit.
 * source: "learn" | "review" | "quiz"
 */
export function evaluateRating({ source, existing, goal, stats, today = localDateStr(), now = Date.now() }) {
  const isNewWord = !existing || existing.status === "new";
  if (source === "quiz" && isNewWord) return { allowed: false, isNewWord, reason: "quiz-cannot-start-new-word" };
  if (source === "learn" && !isNewWord) return { allowed: false, isNewWord, reason: "already-started" };
  if (source === "review" && (isNewWord || existing.nextReview > now)) return { allowed: false, isNewWord, reason: "not-due" };
  if (isNewWord && getRemainingNewSlots(goal, stats, today) <= 0) return { allowed: false, isNewWord, reason: "daily-goal-complete" };
  return { allowed: true, isNewWord };
}
