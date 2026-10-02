# English Journey v0.2

Offline-first English vocabulary learning app (mobile-first, dark theme).

## Stack
- React + Vite
- Capacitor (ready for Android)
- LocalStorage for all progress
- Spaced Repetition (Again / Hard / Good / Easy)
- Browser SpeechSynthesis TTS

## Features in this version
- 100 sample vocabulary items (A1–C1)
- Real SRS with ease, interval, repetitions, nextReview
- Learn flow: Word → Listen → Reveal → Example → Rating
- Review only shows due cards (nextReview ≤ now)
- Daily Goal on Home (editable)
- Progress page (learned, due, streak, accuracy…)
- Quiz: English→Persian, Persian→English, Fill-the-blank
- Fully offline, no backend

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Android (later)
```bash
npm run android:add      # first time only
npm run android:sync
npm run android:open     # opens Android Studio
```

Requires Android Studio / SDK on the machine that builds the APK.
