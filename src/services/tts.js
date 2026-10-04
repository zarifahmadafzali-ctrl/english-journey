/**
 * Text-to-Speech service.
 * Android APK: Sherpa-ONNX offline neural TTS (NativeTts plugin).
 * Browser/PWA: Web Speech API fallback only.
 */

import { isNativeTtsPlatform, nativeSpeak, nativeStop, nativeIsReady } from "../plugins/nativeTts.js";

let preferredVoiceEN = null;
let preferredVoiceFA = null;
let nativeReadyCached = null;

function pickEnglishVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang.startsWith("en-US") && v.name.includes("Google"))
    || voices.find(v => v.lang.startsWith("en-US"))
    || voices.find(v => v.lang.startsWith("en-GB"))
    || voices.find(v => v.lang.startsWith("en"));
  return preferred || null;
}

function pickPersianVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = speechSynthesis.getVoices();
  // Persian voices only. No Arabic fallback: it mispronounces Persian letters (پ چ ژ گ).
  const preferred = voices.find(v => v.lang.replace("_", "-").toLowerCase().startsWith("fa"));
  return preferred || null;
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

export function initTTS() {
  if (isNativeTtsPlatform()) {
    nativeIsReady()
      .then((r) => {
        nativeReadyCached = r;
        if (r && r.ready) {
          console.info("[TTS] Native Sherpa-ONNX ready");
        } else {
          console.warn("[TTS] Native TTS not ready:", r && r.error);
        }
      })
      .catch((e) => {
        console.warn("[TTS] Native init check failed", e);
      });
    return;
  }

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

/**
 * Speak text in English or Persian.
 * @param {string} text
 * @param {object} options - { lang: 'en' | 'fa' | 'en-US' | 'fa-IR', rate, speed }
 */
export function speak(text, options = {}) {
  if (!text) return Promise.resolve();

  const lang = mapLang(options.lang || "en");
  const speed = options.speed ?? options.rate ?? 1.0;

  if (isNativeTtsPlatform()) {
    return nativeSpeak(text, lang, speed).catch((e) => {
      console.error("[TTS] native speak failed", e);
    });
  }

  if (!("speechSynthesis" in window)) return Promise.resolve();

  return new Promise((resolve) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "fa-IR" ? "fa-IR" : "en-US";
    u.rate = options.rate ?? (lang === "fa-IR" ? 0.85 : 0.92);
    u.pitch = options.pitch ?? 1;
    u.volume = options.volume ?? 1;

    if (lang === "fa-IR") {
      if (preferredVoiceFA) u.voice = preferredVoiceFA;
    } else if (preferredVoiceEN) {
      u.voice = preferredVoiceEN;
    }

    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (isNativeTtsPlatform()) {
    return nativeStop().catch(() => {});
  }
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}

/** 'available' | 'missing' | 'unknown' */
export function persianVoiceStatus() {
  if (isNativeTtsPlatform()) {
    if (nativeReadyCached && nativeReadyCached.ready) return "available";
    if (nativeReadyCached && nativeReadyCached.ready === false) return "missing";
    return "unknown";
  }
  if (!("speechSynthesis" in window)) return "missing";
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return "unknown";
  return voices.some(v => v.lang.replace("_", "-").toLowerCase().startsWith("fa")) ? "available" : "missing";
}

export function isTTSAvailable() {
  if (isNativeTtsPlatform()) {
    return true;
  }
  return "speechSynthesis" in window;
}
