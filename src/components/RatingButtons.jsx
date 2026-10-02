import React from "react";

const RATINGS = [
  { id: "again", label: "Again", className: "rate-again" },
  { id: "hard", label: "Hard", className: "rate-hard" },
  { id: "good", label: "Good", className: "rate-good" },
  { id: "easy", label: "Easy", className: "rate-easy" }
];

export default function RatingButtons({ onRate, disabled }) {
  return (
    <div className="rating-buttons">
      {RATINGS.map(r => (
        <button
          key={r.id}
          className={`rate-btn ${r.className}`}
          onClick={() => onRate(r.id)}
          disabled={disabled}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
