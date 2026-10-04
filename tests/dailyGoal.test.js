import { test } from "node:test";
import assert from "node:assert/strict";
process.env.TZ = "Asia/Tehran"; // UTC+3:30 - local date differs from UTC after 20:30 UTC

import { localDateStr, previousLocalDateStr } from "../src/utils/helpers.js";
import {
  getRemainingNewSlots, applyStudyActivity, getEffectiveStreak, evaluateRating, getNewWordsToday
} from "../src/services/dailyGoal.js";
import { getNewWords, createDefaultProgress, applyRating, getDueCards } from "../src/services/srs.js";

const T = "2026-10-03";
const stats = (n, date = T) => ({ studyDate: date, newWordsToday: n });
const vocab = Array.from({ length: 30 }, (_, i) => ({ id: "w" + i }));

test("goal 10, 0/10 -> 10 slots", () => assert.equal(getRemainingNewSlots(10, stats(0), T), 10));
test("goal 10, 7/10 -> 3 slots", () => assert.equal(getRemainingNewSlots(10, stats(7), T), 3));
test("goal 10, 9/10 -> 1 slot", () => assert.equal(getRemainingNewSlots(10, stats(9), T), 1));
test("goal 10, 10/10 -> 0 slots", () => assert.equal(getRemainingNewSlots(10, stats(10), T), 0));
test("getNewWords respects slots (7/10 -> exactly 3)", () => {
  assert.equal(getNewWords({}, vocab, getRemainingNewSlots(10, stats(7), T)).length, 3);
  assert.equal(getNewWords({}, vocab, 0).length, 0);
});

test("10/10 blocks starting a new word (logic, not UI)", () => {
  const v = evaluateRating({ source: "learn", existing: undefined, goal: 10, stats: stats(10), today: T });
  assert.equal(v.allowed, false);
  assert.equal(v.reason, "daily-goal-complete");
  // also blocked with no source at all
  assert.equal(evaluateRating({ existing: undefined, goal: 10, stats: stats(10), today: T }).allowed, false);
});

test("quiz cannot start a new word (no bypass via Quiz)", () => {
  assert.equal(evaluateRating({ source: "quiz", existing: undefined, goal: 10, stats: stats(0), today: T }).allowed, false);
});

test("Review still works at 10/10 for a due card, and is not counted as new", () => {
  const due = { ...applyRating(createDefaultProgress("a"), "good"), nextReview: Date.now() - 1000 };
  const v = evaluateRating({ source: "review", existing: due, goal: 10, stats: stats(10), today: T });
  assert.equal(v.allowed, true);
  assert.equal(v.isNewWord, false);
  const after = applyStudyActivity(stats(10), { isNewWord: false, today: T });
  assert.equal(after.newWordsToday, 10);
});

test("review of a card that is NOT due is refused (no double rating)", () => {
  const notDue = { ...applyRating(createDefaultProgress("a"), "good"), nextReview: Date.now() + 86400000 };
  assert.equal(evaluateRating({ source: "review", existing: notDue, goal: 10, stats: stats(0), today: T }).allowed, false);
});

test("learn cannot re-rate a word that is already started", () => {
  const started = applyRating(createDefaultProgress("a"), "good");
  assert.equal(evaluateRating({ source: "learn", existing: started, goal: 10, stats: stats(0), today: T }).allowed, false);
});

test("new word increments newWordsToday; after rating it leaves the new list", () => {
  const s = applyStudyActivity(stats(6), { isNewWord: true, today: T });
  assert.equal(s.newWordsToday, 7);
  const prog = { w0: applyRating(createDefaultProgress("w0"), "good") };
  assert.equal(getNewWords(prog, vocab, 30).some(w => w.id === "w0"), false);
});

test("new local day resets the daily count", () => {
  assert.equal(getNewWordsToday(stats(10, "2026-10-02"), "2026-10-03"), 0);
  assert.equal(getRemainingNewSlots(10, stats(10, "2026-10-02"), "2026-10-03"), 10);
  const s = applyStudyActivity(stats(10, "2026-10-02"), { isNewWord: true, today: "2026-10-03" });
  assert.equal(s.newWordsToday, 1);
});

test("localDateStr uses LOCAL date, not UTC (Tehran 00:30 on Jan 5 is Jan 4 in UTC)", () => {
  const d = new Date(2026, 0, 5, 0, 30);
  assert.equal(d.toISOString().slice(0, 10), "2026-01-04"); // the old (buggy) behaviour
  assert.equal(localDateStr(d), "2026-01-05");
});

test("previousLocalDateStr handles month/year boundaries", () => {
  assert.equal(previousLocalDateStr("2026-03-01"), "2026-02-28");
  assert.equal(previousLocalDateStr("2026-01-01"), "2025-12-31");
});

test("streak: consecutive days +1, gap resets to 1, same day not double counted", () => {
  let s = applyStudyActivity(null, { today: "2026-10-01" });
  assert.equal(s.currentStreak, 1);
  s = applyStudyActivity(s, { today: "2026-10-01" });
  assert.equal(s.currentStreak, 1);
  assert.equal(s.totalStudyDays, 1);
  s = applyStudyActivity(s, { today: "2026-10-02" });
  assert.equal(s.currentStreak, 2);
  s = applyStudyActivity(s, { today: "2026-10-05" });
  assert.equal(s.currentStreak, 1);
});

test("effective streak shows 0 once a day has been missed", () => {
  const s = applyStudyActivity(null, { today: "2026-10-01" });
  assert.equal(getEffectiveStreak(s, "2026-10-02"), 1);
  assert.equal(getEffectiveStreak(s, "2026-10-03"), 0);
});

test("reviews count for the streak but not for the daily goal", () => {
  const s = applyStudyActivity(null, { isNewWord: false, today: T });
  assert.equal(s.currentStreak, 1);
  assert.equal(s.newWordsToday, 0);
});

test("rating 'again' makes a card leave the due list (Review advances)", () => {
  const p = { ...applyRating(createDefaultProgress("a"), "good"), nextReview: Date.now() - 1 };
  const before = getDueCards({ a: p }, [{ id: "a" }]).length;
  const after = getDueCards({ a: applyRating(p, "again") }, [{ id: "a" }]).length;
  assert.equal(before, 1);
  assert.equal(after, 0);
});
