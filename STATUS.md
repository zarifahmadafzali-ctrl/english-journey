# English Journey – status (honest)

## Tested for real (headless Chromium, real app bundle, 36 checks + 18 unit tests)
- Daily Goal 10: 0/10 -> 10 new words; 7/10 -> 3 left; 10/10 -> "Daily goal completed 🎉", no word card, Start Learning disabled.
- Enforcement is in logic (`evaluateRating` in `src/services/dailyGoal.js`, called by `rateWord`), not just hidden buttons.
- Review stays available at 10/10; reviews never add to the goal; double-tap rates only one card.
- Quiz cannot start new words; no duplicate options; options lock after answering; score correct.
- Local-date handling (not UTC): day rollover resets the goal; streak +1 / reset / shows 0 after missed days.
- TTS UI calls `speak()` with the right text and locale (en-US / fa-IR); TTS never touches SRS data; no crash if speechSynthesis is missing.

## Not tested
- Real audio and real Persian voices (the test used a stub that records what was spoken).
- Android device/emulator. Gradle build. APK. GitHub Actions run.
- `vite build` itself (npm registry blocked in my sandbox). Code was bundled with esbuild instead.

## Bugs fixed this round
- Learn skipped every other card (index advanced while the list shrank).
- Quiz could show two identical options (a distractor equal to the correct answer, e.g. focus/concentrate).
- Quiz/Review could bypass or double-rate; now guarded in `rateWord`.
- Streak and daily date used UTC; now local.
- `vite.config.js` base was `/english-journey/` -> blank screen inside the APK; now `./`.
- Workflow used JDK 17; Capacitor 7 needs JDK 21.
- Removed the Arabic voice fallback for Persian (mispronounces Persian letters); a hint is shown if no Persian voice is installed.

## Known / open
- `package.json` now lists `@capacitor/android`, but `package-lock.json` is stale. Run `npm install` and commit the new lock file.
- Vocabulary has a duplicate word ("consider": w028 and w097). Not changed (no data changes requested).
- `.github/workflows/deploy.yml` publishes the committed `dist/` folder. `dist/` is NOT in this zip; rebuild it with `npm run build` if you use GitHub Pages.
- Raising the goal with "+" on Home gives more new words that day (intended: it is the user's own setting).
