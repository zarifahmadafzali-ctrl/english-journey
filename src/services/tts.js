/**
 * Text-to-Speech service.
 * Android APK: use Sherpa-ONNX native TTS exclusively (bundled models).
 * Browser/PWA: Web Speech API only.
 */

import {
  isNativeTtsPlatform,
  nativeSpeak,
  nativeStop,
  nativeIsReady,
  nativeWarmUp,
} from "../plugins/nativeTts.js";

let preferredVoiceEN = null;
let preferredVoiceFA = null;
let nativeReadyCached = null;
/** One-time initialization state for native engine. */
let nativeInitState = "uninitialized"; // 'uninitialized'|'initializing'|'ready'|'failed'
let nativeInitPromise = null;
let nativeInitError = null;

function pickEnglishVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.startsWith("en-US") && v.name.includes("Google")) ||
    voices.find((v) => v.lang.startsWith("en-US")) ||
    voices.find((v) => v.lang.startsWith("en-GB")) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    null
  );
}

function pickPersianVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => v.lang.replace("_", "-").toLowerCase().startsWith("fa")) || null;
}

function mapLang(lang) {
  if (!lang) return "en-US";
  const l = String(lang).toLowerCase().replace("_", "-");
  if (l === "fa" || l.startsWith("fa-") || l === "persian" || l === "farsi") {
    return "fa-IR";
  }
  if (l === "en" || l.startsWith("en-")) {
    return "en-US";
  }
  return l.startsWith("fa") ? "fa-IR" : "en-US";
}

function initWebVoices() {
  if (!("speechSynthesis" in window)) return;
  if (speechSynthesis.getVoices().length) {
    preferredVoiceEN = pickEnglishVoice();
    preferredVoiceFA = pickPersianVoice();
  } else {
    speechSynthesis.onvoiceschanged = () => {
      preferredVoiceEN = pickEnglishVoice();
      preferredVoiceFA = pickPersianVoice();
    };
  }
}

export function initTTS() {
  // Initialize web voices for browser/PWA use only.
  initWebVoices();

  // Probe native readiness lazily; do not treat unknown as ready.
  if (!isNativeTtsPlatform()) return;

  nativeIsReady()
    .then((r) => {
      nativeReadyCached = r;
      if (r && r.assetsOk === false) {
        // assets missing — mark failed so UI can surface.
        nativeInitState = "failed";
        nativeInitError = r.error || "native assets missing";
        console.warn("[TTS] Native assets missing — mark failed:", nativeInitError);
      } else if (r && r.ready) {
        nativeInitState = "ready";
        console.info("[TTS] Native Sherpa-ONNX ready");
      } else {
        // Not ready yet — remain uninitialized; explicit warmUp will be required.
        nativeInitState = "uninitialized";
        console.info("[TTS] Native probe returned not-ready; warmUp required before speak");
      }
    })
    .catch((e) => {
      nativeInitState = "failed";
      nativeInitError = String(e && e.message ? e.message : e) || "native probe failed";
      console.warn("[TTS] Native init probe failed — mark failed", nativeInitError);
    });
}

function speakWeb(text, lang, options = {}) {
  if (!("speechSynthesis" in window)) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "fa-IR" ? "fa-IR" : "en-US";
      u.rate = options.rate ?? (lang === "fa-IR" ? 0.85 : 0.92);
      u.pitch = options.pitch ?? 1;
      u.volume = options.volume ?? 1;
      if (lang === "fa-IR" && preferredVoiceFA) u.voice = preferredVoiceFA;
      else if (preferredVoiceEN) u.voice = preferredVoiceEN;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
    } catch (err) {
      console.warn("[TTS] speakWeb failed", err);
      resolve();
    }
  });
}

/** Ensure native engine is initialized exactly once and provide state. */
export function initNativeEngineOnce() {
  if (!isNativeTtsPlatform()) {
    return Promise.reject(new Error("not-native-platform"));
  }
  if (nativeInitState === "ready") return Promise.resolve({ ready: true });
  if (nativeInitState === "failed") return Promise.reject(new Error(nativeInitError || "native init failed"));
  if (nativeInitState === "initializing") return nativeInitPromise;

  // Start initializing
  nativeInitState = "initializing";
  nativeInitPromise = new Promise(async (resolve, reject) => {
    try {
      // First quick probe
      let probe = null;
      try {
        probe = await nativeIsReady();
      } catch (e) {
        // probe failed — continue to warmUp which will provide more info
        probe = null;
      }
      nativeReadyCached = probe;
      if (probe && probe.ready) {
        nativeInitState = "ready";
        nativeInitError = null;
        resolve({ ready: true });
        return;
      }

      // Not ready -> attempt a controlled warmUp which copies assets and loads the English engine.
      // WarmUp runs native prepareFiles + ensureEngine(false) and returns {ready,assetsOk,error}
      let warm = null;
      try {
        warm = await nativeWarmUp();
      } catch (e) {
        warm = { ready: false, assetsOk: false, error: String(e && e.message ? e.message : e) };
      }
      nativeReadyCached = warm;
      if (warm && warm.ready) {
        nativeInitState = "ready";
        nativeInitError = null;
        resolve({ ready: true });
        return;
      }

      // warmUp did not succeed — mark failed and return diagnostic
      nativeInitState = "failed";
      nativeInitError = (warm && (warm.error || (warm.assetsOk === false ? "assets missing" : null))) || "warmUp failed";
      console.error("[TTS] native warmUp failed:", nativeInitError);
      reject(new Error(nativeInitError));
    } catch (t) {
      nativeInitState = "failed";
      nativeInitError = String(t && t.message ? t.message : t) || "native init exception";
      console.error("[TTS] native init exception:", nativeInitError, t);
      reject(new Error(nativeInitError));
    }
  });
  return nativeInitPromise;
}

/**
 * Speak text in English or Persian.
 * On Android native platforms we MUST use the bundled native TTS. We will not
 * transparently fall back to Web Speech on Android. If native engine is not
 * ready or initialization fails, speak() returns a rejected Promise with a
 * diagnostic error. Caller (UI) must handle and optionally disable speaker UI.
 *
 * In browser/PWA builds, we use Web Speech API.
 */
export function speak(text, options = {}) {
  if (!text) return Promise.resolve();

  const lang = mapLang(options.lang || "en");
  const speed = options.speed ?? options.rate ?? 1.0;

  if (isNativeTtsPlatform()) {
    // Ensure native engine initialized once. If initializing, wait for completion.
    return initNativeEngineOnce()
      .then(() => {
        // double-check ready
        if (nativeInitState !== "ready") {
          return Promise.reject(new Error(nativeInitError || "native not ready"));
        }
        // Call nativeSpeak and propagate any errors to caller. If nativeSpeak rejects
        // we mark nativeInitState=failed to prevent repeated attempts.
        return nativeSpeak(text, lang, speed).catch((e) => {
          nativeInitState = "failed";
          nativeInitError = String(e && e.message ? e.message : e) || "nativeSpeak failed";
          console.error("[TTS] nativeSpeak error — marking failed:", nativeInitError, e);
          return Promise.reject(new Error(nativeInitError));
        });
      })
      .catch((err) => {
        // Initialization failed — return clear JS error. Do NOT fall back to Web Speech on Android.
        const msg = err && err.message ? err.message : String(err);
        console.error("[TTS] speak blocked — native engine unavailable:", msg);
        return Promise.reject(new Error("Native TTS unavailable: " + msg));
      });
  }

  // Browser / PWA path: Web Speech OK
  return speakWeb(text, lang, options);
}

export function stopSpeaking() {
  if (isNativeTtsPlatform()) {
    nativeStop().catch((e) => console.warn("[TTS] nativeStop failed", e));
  }
  if ("speechSynthesis" in window) {
    try {
      speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}

/** 'available' | 'missing' | 'unknown' */
export function persianVoiceStatus() {
  if (isNativeTtsPlatform()) {
    if (nativeInitState === "ready") return "available";
    if (nativeInitState === "failed") return "missing";
    return "unknown";
  }
  if (!("speechSynthesis" in window)) return "missing";
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return "unknown";
  return voices.some((v) => v.lang.replace("_", "-").toLowerCase().startsWith("fa"))
    ? "available"
    : "missing";
}

export function isTTSAvailable() {
  if (isNativeTtsPlatform()) return nativeInitState === "ready";
  return "speechSynthesis" in window;
}
