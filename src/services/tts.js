/**
 * Text-to-Speech service.
 * Android APK: Sherpa-ONNX offline neural TTS only (no system/Web Speech fallback).
 * Browser/PWA: Web Speech API.
 *
 * JS mirrors native state: uninitialized → initializing → ready | failed
 */

import {
  isNativeTtsPlatform,
  nativeSpeak,
  nativeStop,
  nativeIsReady,
  nativeWarmUp
} from "../plugins/nativeTts.js";

let preferredVoiceEN = null;
let preferredVoiceFA = null;

/** @type {'uninitialized'|'initializing'|'ready'|'failed'} */
let nativeInitState = "uninitialized";
let nativeInitPromise = null;
let nativeInitError = null;
let nativeReadyCached = null;

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
  initWebVoices();
  if (!isNativeTtsPlatform()) return;

  nativeIsReady()
    .then((r) => {
      nativeReadyCached = r;
      if (r && r.ready) {
        nativeInitState = "ready";
        nativeInitError = null;
        console.info("[TTS] Native already READY");
      } else if (r && r.assetsOk === false) {
        nativeInitState = "failed";
        nativeInitError = r.error || "native assets missing";
        console.warn("[TTS] assets missing:", nativeInitError);
      } else {
        nativeInitState = "uninitialized";
        console.info("[TTS] native not ready yet — will warmUp on first speak");
      }
    })
    .catch((e) => {
      nativeInitState = "failed";
      nativeInitError = String(e && e.message ? e.message : e);
      console.warn("[TTS] probe failed:", nativeInitError);
    });
}

export function initNativeEngineOnce() {
  if (!isNativeTtsPlatform()) {
    return Promise.reject(new Error("not-native-platform"));
  }
  if (nativeInitState === "ready") return Promise.resolve({ ready: true });
  if (nativeInitState === "failed") {
    return Promise.reject(new Error(nativeInitError || "native init failed"));
  }
  if (nativeInitState === "initializing" && nativeInitPromise) {
    return nativeInitPromise;
  }

  nativeInitState = "initializing";
  nativeInitPromise = (async () => {
    try {
      const probe = await nativeIsReady().catch(() => null);
      nativeReadyCached = probe;
      if (probe && probe.ready) {
        nativeInitState = "ready";
        nativeInitError = null;
        return { ready: true };
      }

      const warm = await nativeWarmUp();
      nativeReadyCached = warm;
      if (warm && warm.ready) {
        nativeInitState = "ready";
        nativeInitError = null;
        console.info("[TTS] warmUp OK state=", warm.state);
        return { ready: true };
      }

      nativeInitState = "failed";
      nativeInitError =
        (warm && warm.error) ||
        (warm && warm.nativeLibError) ||
        "warmUp failed — native TTS not available";
      console.error("[TTS] warmUp failed:", nativeInitError, warm);
      throw new Error(nativeInitError);
    } catch (t) {
      nativeInitState = "failed";
      nativeInitError = String(t && t.message ? t.message : t);
      throw new Error(nativeInitError);
    }
  })();

  return nativeInitPromise;
}

function speakWeb(text, lang, options = {}) {
  if (!("speechSynthesis" in window)) return Promise.resolve();
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
    } catch {
      resolve();
    }
  });
}

/**
 * Android: native only. Rejects if engine cannot initialize or speak fails.
 * Browser: Web Speech API.
 */
export function speak(text, options = {}) {
  if (!text) return Promise.resolve();

  const lang = mapLang(options.lang || "en");
  const speed = options.speed ?? options.rate ?? 1.0;

  if (isNativeTtsPlatform()) {
    return initNativeEngineOnce()
      .then(() => {
        if (nativeInitState !== "ready") {
          return Promise.reject(new Error(nativeInitError || "native not ready"));
        }
        return nativeSpeak(text, lang, speed).catch((e) => {
          const msg = String(e && e.message ? e.message : e);
          console.error("[TTS] nativeSpeak error:", msg);
          // Do not permanently FAILED on a single speak error (e.g. empty text edge cases),
          // unless message indicates init/native lib failure.
          if (/Failed to load|not READY|Init failed|Native lib/i.test(msg)) {
            nativeInitState = "failed";
            nativeInitError = msg;
          }
          return Promise.reject(new Error(msg));
        });
      })
      .catch((err) => {
        const msg = err && err.message ? err.message : String(err);
        console.error("[TTS] speak blocked:", msg);
        return Promise.reject(new Error("Native TTS unavailable: " + msg));
      });
  }

  return speakWeb(text, lang, options);
}

export function stopSpeaking() {
  if (isNativeTtsPlatform()) {
    nativeStop().catch(() => {});
  }
  if ("speechSynthesis" in window) {
    try {
      speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}

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

export function getNativeTtsState() {
  return {
    state: nativeInitState,
    error: nativeInitError,
    cached: nativeReadyCached
  };
}
