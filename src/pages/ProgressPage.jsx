import React from "react";
import { Flame, BookOpen, CheckCircle, Target, Calendar, Percent } from "lucide-react";

export default function ProgressPage({ computed, stats }) {
  const items = [
    { icon: BookOpen, label: "Words learned", value: computed.wordsLearned },
    { icon: CheckCircle, label: "Words mastered", value: computed.wordsMastered },
    { icon: Target, label: "Words due today", value: computed.wordsDueToday },
    { icon: Flame, label: "Current streak", value: `${stats.currentStreak || 0} days` },
    { icon: Calendar, label: "Total study days", value: stats.totalStudyDays || 0 },
    { icon: Percent, label: "Accuracy", value: `${computed.accuracy}%` }
  ];

  return (
    <section className="page progress-page">
      <h1>Progress</h1>
      <p className="muted">Your offline learning journey so far.</p>

      <div className="progress-list">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="progress-row">
            <div className="progress-row-left">
              <Icon size={20} />
              <span>{label}</span>
            </div>
            <b>{value}</b>
          </div>
        ))}
      </div>

      <div className="card subtle">
        <p className="small muted">
          Total vocabulary: {computed.totalWords} words · All data stored locally on your device.
        </p>
      </div>
    </section>
  );
}
