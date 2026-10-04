import React from "react";
import WordCard from "../components/WordCard";

export default function LearnPage({ newWords, rateWord, goalInfo, dueCount = 0, onNavigate }) {
  const current = newWords[0]; // list shrinks as words are rated, so always take the first

  if (goalInfo.completed) {
    return (
      <section className="page">
        <h1>Learn</h1>
        <div className="empty-state">
          <p>Daily goal completed 🎉</p>
          <p className="muted">
            You learned {goalInfo.doneToday} new word{goalInfo.doneToday === 1 ? "" : "s"} today. New words unlock tomorrow.
          </p>
          <button className="secondary-btn" onClick={() => onNavigate?.("review")}>
            Review due ({dueCount})
          </button>
        </div>
      </section>
    );
  }

  if (!current) {
    return (
      <section className="page">
        <h1>Learn</h1>
        <div className="empty-state">
          <p>You have started every available word.</p>
          <p className="muted">Use Review to practice words that are due.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page learn-page">
      <div className="page-header">
        <h1>Learn</h1>
        <span className="muted">New word {goalInfo.doneToday + 1} / {goalInfo.goal}</span>
      </div>
      <WordCard
        key={current.id}
        word={current}
        onRate={(id, rating) => rateWord(id, rating, { source: "learn" })}
        showRating
      />
    </section>
  );
}
