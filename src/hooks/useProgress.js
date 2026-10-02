import { useState, useEffect, useCallback, useMemo } from "react";
import {
  loadProgress,
  saveProgress,
  loadSettings,
  saveSettings,
  loadStats,
  ensureTodayStats,
  recordNewWordActivity
} from "../storage/progressStorage";
import {
  applyRating,
  createDefaultProgress,
  getDueCards,
  getNewWords,
  computeStats
} from "../services/srs";
import { VOCABULARY } from "../data/vocabulary";

export function useProgress() {
  const [progress, setProgress] = useState(loadProgress);
  const [settings, setSettings] = useState(loadSettings);
  const [stats, setStats] = useState(() => ensureTodayStats());

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Re-check local date on mount / when tab becomes visible
  useEffect(() => {
    const refresh = () => setStats(ensureTodayStats());
    refresh();
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const rateWord = useCallback((wordId, rating) => {
    let wasNew = false;
    setProgress(prev => {
      const current = prev[wordId];
      wasNew = !current || current.status === "new";
      const base = current || createDefaultProgress(wordId);
      const updated = applyRating(base, rating);
      return { ...prev, [wordId]: updated };
    });
    // Only count toward Daily Goal when introducing a NEW word
    if (wasNew) {
      const newStats = recordNewWordActivity(1);
      setStats(newStats);
    } else {
      // Review / re-rate: refresh stats in case day rolled over
      setStats(ensureTodayStats());
    }
  }, []);

  const setDailyGoal = useCallback((goal) => {
    setSettings(s => ({ ...s, dailyGoal: Math.max(1, Math.min(50, goal)) }));
  }, []);

  const dueWords = useMemo(
    () => getDueCards(progress, VOCABULARY),
    [progress]
  );

  const dailyGoal = settings.dailyGoal || 10;
  const completedToday = stats.wordsStudiedToday || 0;
  const remainingToday = Math.max(0, dailyGoal - completedToday);
  const goalCompleted = remainingToday <= 0;

  // Enforce Daily Goal limit on NEW words only
  const allNewWords = useMemo(
    () => getNewWords(progress, VOCABULARY, 100),
    [progress]
  );
  const newWords = useMemo(
    () => (goalCompleted ? [] : allNewWords.slice(0, remainingToday)),
    [allNewWords, goalCompleted, remainingToday]
  );

  const computed = useMemo(
    () => computeStats(progress, VOCABULARY),
    [progress]
  );

  return {
    progress,
    settings,
    stats,
    rateWord,
    setDailyGoal,
    dueWords,
    newWords,
    computedStats: computed,
    vocabulary: VOCABULARY,
    dailyGoal,
    completedToday,
    remainingToday,
    goalCompleted
  };
}
