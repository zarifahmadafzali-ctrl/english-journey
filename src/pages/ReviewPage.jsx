import React, { useState } from "react";
import WordCard from "../components/WordCard";
import { Brain } from "lucide-react";

export default function ReviewPage({ dueWords, rateWord }) {
  const [index, setIndex] = useState(0);

  const current = dueWords[index];

  const handleRate = (wordId, rating) => {
    rateWord(wordId, rating);
    // After rating, the card is no longer due (or delayed), so move to next
    setIndex(i => {
      // Keep index valid for remaining list; since dueWords updates from parent,
      // we just increment carefully
      return i; // parent will re-render with fewer due words
    });
  };

  if (dueWords.length === 0) {
    return (
      <section className="page">
        <h1>Review</h1>
        <div className="empty-state">
          <Brain size={48} className="empty-icon" />
          <p>No words due for review right now.</p>
          <p className="muted">Great job! Come back later or learn new words.</p>
        </div>
      </section>
    );
  }

  // When list shrinks, clamp index
  const safeIndex = Math.min(index, dueWords.length - 1);
  const word = dueWords[safeIndex];

  return (
    <section className="page review-page">
      <div className="page-header">
        <h1>Review</h1>
        <span className="muted">{dueWords.length} due</span>
      </div>
      <WordCard
        word={word}
        onRate={(id, rating) => {
          rateWord(id, rating);
          // stay at same index; list will shift
        }}
        showRating
      />
    </section>
  );
}
