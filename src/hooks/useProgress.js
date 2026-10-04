import { useState, useEffect, useCallback, useRef } from "react";
import { loadProgress, saveProgress, loadSettings, saveSettings, loadStats, recordStudyActivity } from "../storage/progressStorage";
import { applyRating, createDefaultProgress, getDueCards, getNewWords, computeStats } from "../services/srs";
import { getNewWordsToday, getRemainingNewSlots, getEffectiveStreak, evaluateRating } from "../services/dailyGoal";
import { localDateStr } from "../utils/helpers";
import { VOCABULARY } from "../data/vocabulary";

export function useProgress() {
  const [progress, setProgress] = useState(loadProgress);
  const [settings, setSettings] = useState(loadSettings);
  const [stats, setStats] = useState(loadStats);
  const [today, setToday] = useState(localDateStr);

  const progressRef = useRef(progress);
  const statsRef = useRef(stats);
  const goalRef = useRef(10);
  progressRef.current = progress;
  statsRef.current = stats;

  const goal = Math.max(1, Math.min(50, settings.dailyGoal || 10));
  goalRef.current = goal;

  useEffect(() => { saveProgress(progress); }, [progress]);
  useEffect(() => { saveSettings(settings); }, [settings]);

  // Re-evaluate the local date when the app is resumed / left open past midnight
  useEffect(() => {
    const check = () => setToday(prev => (localDateStr() === prev ? prev : localDateStr()));
    const id = setInterval(check, 60000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, []);

  /**
   * rateWord(wordId, rating, { source }) -> true if applied, false if refused.
   * source: "learn" | "review" | "quiz". Enforcement lives here (logic), not in the UI.
   */
  const rateWord = useCallback((wordId, rating, opts = {}) => {
    const existing = progressRef.current[wordId];
    const verdict = evaluateRating({
      source: opts.source,
      existing,
      goal: goalRef.current,
      stats: statsRef.current,
      today: localDateStr()
    });
    if (!verdict.allowed) return false;

    const updated = applyRating(existing || createDefaultProgress(wordId), rating);
    const nextProgress = { ...progressRef.current, [wordId]: updated };
    progressRef.current = nextProgress;
    setProgress(nextProgress);

    const nextStats = recordStudyActivity({ isNewWord: verdict.isNewWord });
    statsRef.current = nextStats;
    setStats(nextStats);
    return true;
  }, []);

  const setDailyGoal = useCallback((g) => {
    setSettings(s => ({ ...s, dailyGoal: Math.max(1, Math.min(50, g)) }));
  }, []);

  const doneToday = getNewWordsToday(stats, today);
  const remaining = getRemainingNewSlots(goal, stats, today);
  const goalInfo = { goal, doneToday, remaining, completed: remaining <= 0 };

  const dueWords = getDueCards(progress, VOCABULARY);
  const newWords = getNewWords(progress, VOCABULARY, remaining);
  const computed = computeStats(progress, VOCABULARY);

  return {
    progress,
    settings,
    stats,
    streak: getEffectiveStreak(stats, today),
    goalInfo,
    rateWord,
    setDailyGoal,
    dueWords,
    newWords,
    computedStats: computed,
    vocabulary: VOCABULARY
  };
}
