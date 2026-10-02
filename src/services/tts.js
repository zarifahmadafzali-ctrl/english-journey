/**
 * Text-to-Speech service
 * Uses browser SpeechSynthesis.
 * Architecture allows swapping to native Capacitor TTS later.
 */

let preferredVoice = null;

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

export function initTTS() {
  if (!("speechSynthesis" in window)) return;
  // Voices may load asynchronously
  if (speechSynthesis.getVoices().length) {
    preferredVoice = pickEnglishVoice();
  } else {
    speechSynthesis.onvoiceschanged = () => {
      preferredVoice = pickEnglishVoice();
    };
  }
}

/**
 * Speak English text
 * @param {string} text
 * @param {object} options { rate, pitch, volume }
 */
export function speak(text, options = {}) {
  if (!text || !("speechSynthesis" in window)) return Promise.resolve();

  return new Promise((resolve) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = options.rate ?? 0.92;
    u.pitch = options.pitch ?? 1;
    u.volume = options.volume ?? 1;
    if (preferredVoice) u.voice = preferredVoice;

    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}

export function isTTSAvailable() {
  return "speechSynthesis" in window;
}
