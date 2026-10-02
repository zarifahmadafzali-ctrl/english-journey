import React, { useState } from "react";
import { Volume2, Eye, EyeOff } from "lucide-react";
import { speak } from "../services/tts";
import RatingButtons from "./RatingButtons";

export default function WordCard({ word, onRate, showRating = true }) {
  const [revealed, setRevealed] = useState(false);
  const [showExample, setShowExample] = useState(false);

  if (!word) return null;

  const handleListen = (text) => {
    speak(text);
  };

  const handleRate = (rating) => {
    onRate?.(word.id, rating);
    setRevealed(false);
    setShowExample(false);
  };

  return (
    <div className="word-card">
      <div className="word-level">{word.level} · {word.partOfSpeech}</div>
      <h2 className="word-main">{word.word}</h2>
      {word.pronunciation && (
        <div className="pronunciation">{word.pronunciation}</div>
      )}

      <div className="card-actions-row">
        <button className="icon-btn" onClick={() => handleListen(word.word)} aria-label="Listen to word">
          <Volume2 size={20} /> Listen
        </button>
        <button
          className="icon-btn"
          onClick={() => setRevealed(r => !r)}
          aria-label="Reveal meaning"
        >
          {revealed ? <EyeOff size={20} /> : <Eye size={20} />}
          {revealed ? "Hide" : "Reveal"}
        </button>
      </div>

      {revealed && (
        <div className="meaning-block animate-in">
          <div className="meaning-fa">{word.meaning_fa}</div>
          {word.meaning_en && <div className="meaning-en">{word.meaning_en}</div>}
        </div>
      )}

      {revealed && (
        <button
          className="example-toggle"
          onClick={() => setShowExample(s => !s)}
        >
          {showExample ? "Hide example" : "Show example"}
        </button>
      )}

      {showExample && (
        <div className="example-block animate-in">
          <div className="example-en">{word.example}</div>
          <div className="example-fa">{word.example_fa}</div>
          <button className="icon-btn small" onClick={() => handleListen(word.example)}>
            <Volume2 size={16} /> Listen example
          </button>
        </div>
      )}

      {showRating && revealed && (
        <div className="rating-section animate-in">
          <p className="rating-hint">How well did you know it?</p>
          <RatingButtons onRate={handleRate} />
        </div>
      )}
    </div>
  );
}
