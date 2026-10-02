import React, { useState, useMemo } from "react";
import { shuffle } from "../utils/helpers";
import { speak } from "../services/tts";
import { Volume2, Check, X } from "lucide-react";

function makeQuestion(word, allWords, type) {
  if (type === 1) {
    // English → Persian meaning
    const correct = word.meaning_fa;
    const distractors = shuffle(
      allWords.filter(w => w.id !== word.id).map(w => w.meaning_fa)
    ).slice(0, 3);
    const options = shuffle([correct, ...distractors]);
    return {
      type: 1,
      prompt: `What does “${word.word}” mean?`,
      word,
      options,
      answer: correct
    };
  }
  if (type === 2) {
    // Persian → English word
    const correct = word.word;
    const distractors = shuffle(
      allWords.filter(w => w.id !== word.id).map(w => w.word)
    ).slice(0, 3);
    const options = shuffle([correct, ...distractors]);
    return {
      type: 2,
      prompt: `کدام کلمه یعنی «${word.meaning_fa}»؟`,
      word,
      options,
      answer: correct
    };
  }
  // type 3 – fill the blank (simple: replace the word in example)
  const blank = word.example.replace(new RegExp(word.word, "i"), "______");
  const correct = word.word;
  const distractors = shuffle(
    allWords.filter(w => w.id !== word.id).map(w => w.word)
  ).slice(0, 3);
  const options = shuffle([correct, ...distractors]);
  return {
    type: 3,
    prompt: blank,
    sub: "Choose the missing word",
    word,
    options,
    answer: correct
  };
}

export default function QuizPage({ vocabulary, rateWord }) {
  const [started, setStarted] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const [selected, setSelected] = useState(null);

  const questions = useMemo(() => {
    if (!started) return [];
    const pool = shuffle(vocabulary).slice(0, 10);
    return pool.map((w, i) => {
      const type = (i % 3) + 1;
      return makeQuestion(w, vocabulary, type);
    });
  }, [started, vocabulary]);

  const current = questions[qIndex];

  const handleAnswer = (opt) => {
    if (feedback) return;
    setSelected(opt);
    const isCorrect = opt === current.answer;
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) {
      setScore(s => s + 1);
      // mild positive rating
      rateWord(current.word.id, "good");
    } else {
      rateWord(current.word.id, "again");
    }
  };

  const next = () => {
    setFeedback(null);
    setSelected(null);
    if (qIndex + 1 >= questions.length) {
      setStarted(false);
      setQIndex(0);
    } else {
      setQIndex(i => i + 1);
    }
  };

  if (!started) {
    return (
      <section className="page">
        <h1>Quiz</h1>
        <p className="muted">Test yourself with 10 mixed questions.</p>
        <div className="card">
          <ul className="quiz-types">
            <li>English → Persian meaning</li>
            <li>Persian → English word</li>
            <li>Fill the blank in a sentence</li>
          </ul>
          <button className="primary-btn full" onClick={() => { setStarted(true); setScore(0); setQIndex(0); setFeedback(null); }}>
            Start Quiz
          </button>
        </div>
        {score > 0 && (
          <div className="card result-card">
            Last score: <b>{score} / 10</b>
          </div>
        )}
      </section>
    );
  }

  if (!current) return null;

  return (
    <section className="page quiz-page">
      <div className="page-header">
        <h1>Quiz</h1>
        <span className="muted">{qIndex + 1} / {questions.length} · Score {score}</span>
      </div>

      <div className="card quiz-card">
        <div className="quiz-prompt">{current.prompt}</div>
        {current.sub && <div className="muted small">{current.sub}</div>}
        {current.type === 1 && (
          <button className="icon-btn" onClick={() => speak(current.word.word)}>
            <Volume2 size={18} /> Listen
          </button>
        )}

        <div className="quiz-options">
          {current.options.map(opt => {
            let cls = "quiz-option";
            if (feedback) {
              if (opt === current.answer) cls += " correct";
              else if (opt === selected) cls += " wrong";
            }
            return (
              <button
                key={opt}
                className={cls}
                onClick={() => handleAnswer(opt)}
                disabled={!!feedback}
              >
                {opt}
                {feedback && opt === current.answer && <Check size={16} />}
                {feedback && opt === selected && opt !== current.answer && <X size={16} />}
              </button>
            );
          })}
        </div>

        {feedback && (
          <button className="primary-btn full" onClick={next}>
            {qIndex + 1 >= questions.length ? "Finish" : "Next"}
          </button>
        )}
      </div>
    </section>
  );
}
