/**
 * Spaced Repetition System (simplified SM-2 inspired)
 * Fully offline.
 *
 * Ratings:
 *  - again  → fail, reset interval short
 *  - hard   → difficult but recalled
 *  - good   → correct with some effort
 *  - easy   → effortless
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Default card state for a new word
 */
export function createDefaultProgress(wordId) {
  return {
    wordId,
    status: "new", // new | learning | review | mastered
    ease: 2.5,
    interval: 0, // in days
    repetitions: 0,
    nextReview: Date.now(),
    lastReview: null,
    correctCount: 0,
    wrongCount: 0
  };
}

/**
 * Apply a rating and return the updated progress object
 * @param {object} prev previous progress
 * @param {'again'|'hard'|'good'|'easy'} rating
 */
export function applyRating(prev, rating) {
  const now = Date.now();
  let { ease, interval, repetitions, correctCount, wrongCount, status } = prev;

  // Ensure defaults
  ease = ease ?? 2.5;
  interval = interval ?? 0;
  repetitions = repetitions ?? 0;
  correctCount = correctCount ?? 0;
  wrongCount = wrongCount ?? 0;

  let newEase = ease;
  let newInterval = interval;
  let newReps = repetitions;
  let newStatus = status;

  if (rating === "again") {
    newReps = 0;
    newInterval = 0; // review very soon (minutes)
    newEase = Math.max(1.3, ease - 0.2);
    wrongCount += 1;
    newStatus = "learning";
  } else if (rating === "hard") {
    newReps = repetitions + 1;
    if (repetitions === 0) {
      newInterval = 0.1; // ~2.4 hours later conceptually, but we use minutes
    } else {
      newInterval = Math.max(1, interval * 1.2);
    }
    newEase = Math.max(1.3, ease - 0.15);
    correctCount += 1;
    newStatus = newReps >= 3 ? "review" : "learning";
  } else if (rating === "good") {
    newReps = repetitions + 1;
    if (repetitions === 0) {
      newInterval = 1; // 1 day
    } else if (repetitions === 1) {
      newInterval = 3;
    } else {
      newInterval = Math.round(interval * ease);
    }
    newEase = ease;
    correctCount += 1;
    newStatus = newReps >= 4 ? "review" : "learning";
    if (newInterval >= 21 && newReps >= 5) newStatus = "mastered";
  } else if (rating === "easy") {
    newReps = repetitions + 1;
    if (repetitions === 0) {
      newInterval = 3;
    } else if (repetitions === 1) {
      newInterval = 7;
    } else {
      newInterval = Math.round(interval * ease * 1.3);
    }
    newEase = Math.min(3.0, ease + 0.15);
    correctCount += 1;
    newStatus = newReps >= 3 ? "review" : "learning";
    if (newInterval >= 30) newStatus = "mastered";
  }

  // Calculate nextReview timestamp
  let nextReview;
  if (rating === "again") {
    nextReview = now + 5 * MINUTE; // 5 minutes
  } else if (rating === "hard" && newReps <= 1) {
    nextReview = now + 30 * MINUTE;
  } else {
    nextReview = now + newInterval * DAY;
  }

  return {
    ...prev,
    status: newStatus,
    ease: Math.round(newEase * 100) / 100,
    interval: newInterval,
    repetitions: newReps,
    nextReview,
    lastReview: now,
    correctCount,
    wrongCount
  };
}

/**
 * Get cards that are due for review (nextReview <= now)
 */
export function getDueCards(progressMap, vocabulary) {
  const now = Date.now();
  return vocabulary.filter(w => {
    const p = progressMap[w.id];
    if (!p) return false; // new words are for Learn, not Review
    return p.nextReview <= now && p.status !== "new";
  });
}

/**
 * Get new / not-yet-started words for Learn
 */
export function getNewWords(progressMap, vocabulary, limit = 20) {
  return vocabulary
    .filter(w => !progressMap[w.id] || progressMap[w.id].status === "new")
    .slice(0, limit);
}

/**
 * Stats helpers
 */
export function computeStats(progressMap, vocabulary) {
  const values = Object.values(progressMap);
  const learned = values.filter(p => p.status === "learning" || p.status === "review" || p.status === "mastered").length;
  const mastered = values.filter(p => p.status === "mastered").length;
  const due = getDueCards(progressMap, vocabulary).length;
  const totalCorrect = values.reduce((s, p) => s + (p.correctCount || 0), 0);
  const totalWrong = values.reduce((s, p) => s + (p.wrongCount || 0), 0);
  const totalAnswers = totalCorrect + totalWrong;
  const accuracy = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;

  return {
    wordsLearned: learned,
    wordsMastered: mastered,
    wordsDueToday: due,
    totalWords: vocabulary.length,
    accuracy,
    totalReviews: totalAnswers
  };
}
