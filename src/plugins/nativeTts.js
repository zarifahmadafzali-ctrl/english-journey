/**
 * Capacitor bridge to NativeTts (Sherpa-ONNX offline TTS).
 * Only active on native Android; web uses Web Speech fallback in tts.js.
 */
import { registerPlugin, Capacitor } from "@capacitor/core";

const NativeTts = registerPlugin("NativeTts");

export function isNativeTtsPlatform() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export async function nativeSpeak(text, lang = "en-US", speed = 1.0) {
  if (!isNativeTtsPlatform()) {
    throw new Error("NativeTts only available on Android");
  }
  await NativeTts.speak({ text, lang, speed });
}

export async function nativeStop() {
  if (!isNativeTtsPlatform()) return;
  await NativeTts.stop();
}

export async function nativeIsReady() {
  if (!isNativeTtsPlatform()) {
    return { ready: false, error: "not-android" };
  }
  return NativeTts.isReady();
}

export { NativeTts };
