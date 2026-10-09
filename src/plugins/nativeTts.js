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
  return NativeTts.speak({ text, lang, speed });
}

export async function nativeStop() {
  if (!isNativeTtsPlatform()) return;
  try {
    await NativeTts.stop();
  } catch {
    /* ignore */
  }
}

export async function nativeIsReady() {
  if (!isNativeTtsPlatform()) {
    return { ready: false, assetsOk: false, error: "not-android" };
  }
  try {
    return await NativeTts.isReady();
  } catch (e) {
    return { ready: false, assetsOk: false, error: String(e && e.message ? e.message : e) };
  }
}

export async function nativeWarmUp() {
  if (!isNativeTtsPlatform()) {
    return { ready: false };
  }
  try {
    return await NativeTts.warmUp();
  } catch (e) {
    return { ready: false, error: String(e && e.message ? e.message : e) };
  }
}

export { NativeTts };
