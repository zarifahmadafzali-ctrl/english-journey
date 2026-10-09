/**
 * Text-to-Speech service.
 * Android APK: try Sherpa-ONNX native TTS; on any failure fall back to Web Speech API.
 * Browser/PWA: Web Speech API only.
 */

import {
  isNativeTtsPlatform,
  nativeSpeak,
  nativeStop,
  nativeIsReady
} from "../plugins/nativeTts.js";

let preferredVoiceEN = null;
let preferredVoiceFA = null;
let nativeReadyCached = null;
/** Once native fails hard, prefer Web Speech for the rest of the session. */
let nativeDisabled = false;

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

  if (!isNativeTtsPlatform()) {
    return;
  }

  nativeIsReady()
    .then((r) => {
      nativeReadyCached = r;
      if (r && r.assetsOk === false) {
        nativeDisabled = true;
        console.warn("[TTS] Native assets missing — using Web Speech only:", r.error);
      } else if (r && r.ready) {
        console.info("[TTS] Native Sherpa-ONNX ready");
      } else {
        console.info("[TTS] Native not loaded yet (will try on first speak, else Web Speech)");
      }
    })
    .catch((e) => {
      nativeDisabled = true;
      console.warn("[TTS] Native init check failed — Web Speech fallback", e);
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
    } catch {
      resolve();
    }
  });
}

/**
 * Speak text in English or Persian.
 * @param {string} text
 * @param {object} options - { lang, rate, speed }
 */
export function speak(text, options = {}) {
  if (!text) return Promise.resolve();

  const lang = mapLang(options.lang || "en");
  const speed = options.speed ?? options.rate ?? 1.0;

  if (isNativeTtsPlatform() && !nativeDisabled) {
    return nativeSpeak(text, lang, speed)
      .then(() => {
        // mark ready after successful queue (engine may still load async)
        if (!nativeReadyCached || !nativeReadyCached.ready) {
          nativeIsReady().then((r) => {
            nativeReadyCached = r;
          }).catch(() => {});
        }
      })
      .catch((e) => {
        console.warn("[TTS] native speak failed — falling back to Web Speech", e);
        nativeDisabled = true;
        return speakWeb(text, lang, options);
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

/** 'available' | 'missing' | 'unknown' */
export function persianVoiceStatus() {
  if (isNativeTtsPlatform() && !nativeDisabled) {
    if (nativeReadyCached && nativeReadyCached.ready) return "available";
    if (nativeReadyCached && nativeReadyCached.assetsOk === false) return "missing";
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
  if (isNativeTtsPlatform()) return true;
  return "speechSynthesis" in window;
}
