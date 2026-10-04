/**
 * Text-to-Speech service
 * Uses browser SpeechSynthesis with support for English & Persian.
 * Architecture allows swapping to native Capacitor TTS later.
 */

let preferredVoiceEN = null;
let preferredVoiceFA = null;

function pickEnglishVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = speechSynthesis.getVoices();
  // Prefer en-US or en-GB
  const preferred = voices.find(v => v.lang.startsWith("en-US") && v.name.includes("Google"))
    || voices.find(v => v.lang.startsWith("en-US"))
    || voices.find(v => v.lang.startsWith("en-GB"))
    || voices.find(v => v.lang.startsWith("en"));
  return preferred || null;
}

function pickPersianVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = speechSynthesis.getVoices();
  // Try Persian/Farsi first
  // Persian voices only. No Arabic fallback: it mispronounces Persian letters (پ چ ژ گ).
  const preferred = voices.find(v => v.lang.replace("_", "-").toLowerCase().startsWith("fa"));
  return preferred || null;
}

export function initTTS() {
  if (!("speechSynthesis" in window)) return;
  // Voices may load asynchronously
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
 * Speak text in English or Persian
 * @param {string} text - Text to speak
 * @param {object} options - { lang: 'en' | 'fa', rate, pitch, volume }
 */
export function speak(text, options = {}) {
  if (!text || !("speechSynthesis" in window)) return Promise.resolve();

  return new Promise((resolve) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    
    const lang = options.lang || "en";
    u.lang = lang === "fa" ? "fa-IR" : "en-US";
    u.rate = options.rate ?? (lang === "fa" ? 0.85 : 0.92); // Slower for Persian
    u.pitch = options.pitch ?? 1;
    u.volume = options.volume ?? 1;
    
    // Select appropriate voice
    if (lang === "fa") {
      if (preferredVoiceFA) u.voice = preferredVoiceFA;
    } else {
      if (preferredVoiceEN) u.voice = preferredVoiceEN;
    }

    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}

/** 'available' | 'missing' | 'unknown' (voice list not loaded yet / not exposed by WebView) */
export function persianVoiceStatus() {
  if (!("speechSynthesis" in window)) return "missing";
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return "unknown";
  return voices.some(v => v.lang.replace("_", "-").toLowerCase().startsWith("fa")) ? "available" : "missing";
}

export function isTTSAvailable() {
  return "speechSynthesis" in window;
}
