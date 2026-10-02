import React, { useState, useEffect } from "react";
import BottomNav from "./components/BottomNav";
import HomePage from "./pages/HomePage";
import LearnPage from "./pages/LearnPage";
import ReviewPage from "./pages/ReviewPage";
import ProgressPage from "./pages/ProgressPage";
import QuizPage from "./pages/QuizPage";
import { useProgress } from "./hooks/useProgress";
import { initTTS } from "./services/tts";

export default function App() {
  const [tab, setTab] = useState("home");
  const {
    progress,
    settings,
    stats,
    rateWord,
    setDailyGoal,
    dueWords,
    newWords,
    computedStats,
    vocabulary,
    dailyGoal,
    completedToday,
    remainingToday,
    goalCompleted
  } = useProgress();

  useEffect(() => {
    initTTS();
  }, []);

  let content;
  switch (tab) {
    case "learn":
      content = (
        <LearnPage
          newWords={newWords}
          progress={progress}
          rateWord={rateWord}
          goalCompleted={goalCompleted}
          completedToday={completedToday}
          dailyGoal={dailyGoal}
        />
      );
      break;
    case "review":
      content = (
        <ReviewPage dueWords={dueWords} rateWord={rateWord} />
      );
      break;
    case "quiz":
      content = (
        <QuizPage vocabulary={vocabulary} rateWord={rateWord} />
      );
      break;
    case "progress":
      content = (
        <ProgressPage computed={computedStats} stats={stats} />
      );
      break;
    default:
      content = (
        <HomePage
          stats={stats}
          settings={settings}
          computed={computedStats}
          onNavigate={setTab}
          onSetGoal={setDailyGoal}
        />
      );
  }

  return (
    <div className="app">
      <main className="main">{content}</main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
