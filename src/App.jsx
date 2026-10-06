import React, { useState, useEffect } from "react";
import BottomNav from "./components/BottomNav";
import HomePage from "./pages/HomePage";
import LearnPage from "./pages/LearnPage";
import ReviewPage from "./pages/ReviewPage";
import ProgressPage from "./pages/ProgressPage";
import QuizPage from "./pages/QuizPage";
import { useProgress } from "./hooks/useProgress";
import { initTTS } from "./services/tts";
import { notifyOtaReady, silentOtaCheck } from "./services/otaUpdate";

export default function App() {
  const [tab, setTab] = useState("home");
  const {
    progress,
    settings,
    stats,
    streak,
    goalInfo,
    rateWord,
    setDailyGoal,
    dueWords,
    newWords,
    computedStats,
    vocabulary
  } = useProgress();

  useEffect(() => {
    initTTS();
    notifyOtaReady().then(() => {
      // Non-blocking; only fetches a small web zip when a new version is published
      silentOtaCheck();
    });
  }, []);

  let content;
  switch (tab) {
    case "learn":
      content = (
        <LearnPage
          newWords={newWords}
          rateWord={rateWord}
          goalInfo={goalInfo}
          dueCount={dueWords.length}
          onNavigate={setTab}
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
        <ProgressPage computed={computedStats} stats={stats} streak={streak} />
      );
      break;
    default:
      content = (
        <HomePage
          streak={streak}
          goalInfo={goalInfo}
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
