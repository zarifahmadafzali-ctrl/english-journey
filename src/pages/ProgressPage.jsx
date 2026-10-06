import React, { useState } from "react";
import { Flame, BookOpen, CheckCircle, Target, Calendar, Percent, RefreshCw } from "lucide-react";
import {
  getOtaChannel,
  setOtaChannel,
  checkForWebUpdate,
  isOtaSupported
} from "../services/otaUpdate.js";

export default function ProgressPage({ computed, stats, streak }) {
  const [channel, setChannelState] = useState(getOtaChannel());
  const [otaMsg, setOtaMsg] = useState("");
  const [otaBusy, setOtaBusy] = useState(false);

  const items = [
    { icon: BookOpen, label: "Words learned", value: computed.wordsLearned },
    { icon: CheckCircle, label: "Words mastered", value: computed.wordsMastered },
    { icon: Target, label: "Words due today", value: computed.wordsDueToday },
    { icon: Flame, label: "Current streak", value: `${streak ?? 0} days` },
    { icon: Calendar, label: "Total study days", value: stats.totalStudyDays || 0 },
    { icon: Percent, label: "Accuracy", value: `${computed.accuracy}%` }
  ];

  const onChannel = (c) => {
    setChannelState(setOtaChannel(c));
    setOtaMsg("");
  };

  const onCheckUpdate = async () => {
    setOtaBusy(true);
    setOtaMsg("Checking…");
    try {
      const r = await checkForWebUpdate({ apply: true });
      setOtaMsg(r.message || r.status);
    } catch (e) {
      setOtaMsg(String(e.message || e));
    } finally {
      setOtaBusy(false);
    }
  };

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

      <div className="card ota-card">
        <h2 className="ota-title">
          <RefreshCw size={18} /> App updates
        </h2>
        <p className="small muted">
          Downloads only the small web layer (UI and learning logic). Offline TTS models stay on the phone — no full APK re-download for normal fixes.
        </p>
        {!isOtaSupported() && (
          <p className="small muted">OTA runs inside the Android app. Browser uses the latest web build from the site.</p>
        )}
        <div className="ota-channels">
          <button
            type="button"
            className={channel === "production" ? "btn primary" : "btn"}
            onClick={() => onChannel("production")}
          >
            Production
          </button>
          <button
            type="button"
            className={channel === "beta" ? "btn primary" : "btn"}
            onClick={() => onChannel("beta")}
          >
            Beta (debug)
          </button>
        </div>
        <button
          type="button"
          className="btn primary ota-check"
          disabled={otaBusy || !isOtaSupported()}
          onClick={onCheckUpdate}
        >
          {otaBusy ? "Working…" : "Check for update"}
        </button>
        {otaMsg ? <p className="small ota-msg">{otaMsg}</p> : null}
      </div>
    </section>
  );
}
