import React, { useState } from "react";
import { Volume2, Eye, EyeOff } from "lucide-react";
import { speak, persianVoiceStatus } from "../services/tts";
import RatingButtons from "./RatingButtons";

export default function WordCard({ word, onRate, showRating = true }) {
  const [revealed, setRevealed] = useState(false);
  const [showExample, setShowExample] = useState(false);

  if (!word) return null;

  const [faHint, setFaHint] = useState(false);

  const handleListen = (text, lang = "en") => {
    if (lang === "fa") setFaHint(persianVoiceStatus() === "missing");
    speak(text, { lang }).catch(() => {});
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
          <div className="meaning-fa">
            {word.meaning_fa}
            <button className="icon-btn micro" onClick={() => handleListen(word.meaning_fa, "fa")} aria-label="Listen to Persian meaning" title="Listen to meaning">
              <Volume2 size={14} />
            </button>
          </div>
          {word.meaning_en && <div className="meaning-en">{word.meaning_en}</div>}
        </div>
      )}

      {faHint && (
        <p className="muted small">No Persian voice found on this device. Install one in Android Settings → Text-to-speech.</p>
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
          <div className="example-en">
            {word.example}
            <button className="icon-btn micro" onClick={() => handleListen(word.example, "en")} aria-label="Listen to English example" title="English">
              <Volume2 size={14} />
            </button>
          </div>
          <div className="example-fa">
            {word.example_fa}
            <button className="icon-btn micro" onClick={() => handleListen(word.example_fa, "fa")} aria-label="Listen to Persian example" title="Persian">
              <Volume2 size={14} />
            </button>
          </div>
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
