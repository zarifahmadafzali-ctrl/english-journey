import React from "react";
import { ChevronRight, Flame, Target } from "lucide-react";
import ProgressBar from "../components/ProgressBar";

export default function HomePage({ streak, goalInfo, computed, onNavigate, onSetGoal }) {
  const { goal, doneToday, completed } = goalInfo;

  return (
    <section className="page home-page">
      <div className="hero">
        <div className="badge">ENGLISH JOURNEY</div>
        <h1>Learn English.<br /><span>Remember it.</span></h1>
        <p className="muted">Short sessions. Smart review. Real progress.</p>
      </div>

      <div className="card daily-goal-card">
        <div className="card-header">
          <Target size={20} />
          <span>Today's Goal (new words)</span>
        </div>
        <ProgressBar value={Math.min(doneToday, goal)} max={goal} />
        {completed && <p className="goal-done">Daily goal completed 🎉</p>}
        <div className="goal-controls">
          <button className="ghost-btn" onClick={() => onSetGoal(goal - 1)} disabled={goal <= 1}>−</button>
          <span className="goal-value">{goal} words</span>
          <button className="ghost-btn" onClick={() => onSetGoal(goal + 1)} disabled={goal >= 50}>+</button>
        </div>
      </div>

      <div className="quick-actions">
        <button className="primary-btn" onClick={() => onNavigate("learn")} disabled={completed}>
          {completed ? "Daily goal completed 🎉" : <>Start Learning <ChevronRight size={18} /></>}
        </button>
        <button className="secondary-btn" onClick={() => onNavigate("review")}>
          Review due ({computed.wordsDueToday})
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <b>{computed.wordsLearned}</b>
          <span>Learned</span>
        </div>
        <div className="stat-item">
          <b>{computed.wordsDueToday}</b>
          <span>Due today</span>
        </div>
        <div className="stat-item">
          <b>{streak}</b>
          <span><Flame size={14} className="inline-icon" /> Streak</span>
        </div>
      </div>
    </section>
  );
}
