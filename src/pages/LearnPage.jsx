import React, { useState, useMemo } from "react";
import WordCard from "../components/WordCard";

export default function LearnPage({
  newWords,
  progress,
  rateWord,
  goalCompleted = false,
  completedToday = 0,
  dailyGoal = 10
}) {
  const [index, setIndex] = useState(0);

  const queue = useMemo(() => newWords, [newWords]);
  const current = queue.length > 0 ? queue[Math.min(index, queue.length - 1)] : null;

  const handleRate = (wordId, rating) => {
    rateWord(wordId, rating);
    setIndex(i => i + 1);
  };

  if (goalCompleted || queue.length === 0) {
    return (
      <section className="page">
        <h1>Learn</h1>
        <div className="empty-state">
          {goalCompleted ? (
            <>
              <p>Daily goal completed 🎉</p>
              <p className="muted">
                You learned {completedToday} / {dailyGoal} new words today.
              </p>
              <p className="muted" style={{ marginTop: 12 }}>
                Come back tomorrow for more new words, or go to Review to practice due cards.
              </p>
            </>
          ) : (
            <>
              <p>🎉 You've seen all available new words for now.</p>
              <p className="muted">Go to Review to practice words that are due, or check Progress.</p>
            </>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="page learn-page">
      <div className="page-header">
        <h1>Learn</h1>
        <span className="muted">
          {completedToday} / {dailyGoal} today · {queue.length} left
        </span>
      </div>
      <WordCard word={current} onRate={handleRate} showRating />
    </section>
  );
}
