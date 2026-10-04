import React from "react";
import WordCard from "../components/WordCard";
import { Brain } from "lucide-react";

// Review is never limited by the Daily Goal. A rated card leaves the due list
// (nextReview moves into the future), so the next due card is always dueWords[0].
export default function ReviewPage({ dueWords, rateWord }) {
  const word = dueWords[0];

  if (!word) {
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

  return (
    <section className="page review-page">
      <div className="page-header">
        <h1>Review</h1>
        <span className="muted">{dueWords.length} due</span>
      </div>
      <WordCard
        key={word.id}
        word={word}
        onRate={(id, rating) => rateWord(id, rating, { source: "review" })}
        showRating
      />
    </section>
  );
}
