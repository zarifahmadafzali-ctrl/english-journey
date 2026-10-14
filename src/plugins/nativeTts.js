/**
 * Capacitor bridge to NativeTts (Sherpa-ONNX offline TTS).
 * Android only — browser path is handled in tts.js.
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
    return { ready: false, assetsOk: false, state: "FAILED", error: "not-android" };
  }
  try {
    return await NativeTts.isReady();
  } catch (e) {
    return {
      ready: false,
      assetsOk: false,
      state: "FAILED",
      error: String(e && e.message ? e.message : e)
    };
  }
}

export async function nativeWarmUp() {
  if (!isNativeTtsPlatform()) {
    return { ready: false, state: "FAILED", error: "not-android" };
  }
  try {
    return await NativeTts.warmUp();
  } catch (e) {
    return {
      ready: false,
      state: "FAILED",
      error: String(e && e.message ? e.message : e)
    };
  }
}

export async function nativeGetStatus() {
  if (!isNativeTtsPlatform()) {
    return { ready: false, state: "FAILED" };
  }
  try {
    return await NativeTts.getStatus();
  } catch (e) {
    return { ready: false, state: "FAILED", error: String(e && e.message ? e.message : e) };
  }
}

export { NativeTts };
