/**
 * OTA web-bundle updates (JS/CSS/HTML only).
 * Does NOT re-download native TTS models or the full APK.
 * Hosted manifest on GitHub Pages; Capgo applies the zip on device.
 */
import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";

const CHANNEL_KEY = "ej-ota-channel";
const MANIFEST_URL =
  "https://zarifahmadafzali-ctrl.github.io/english-journey/ota/manifest.json";

export function getOtaChannel() {
  try {
    return localStorage.getItem(CHANNEL_KEY) || "production";
  } catch {
    return "production";
  }
}

export function setOtaChannel(channel) {
  const c = channel === "beta" ? "beta" : "production";
  try {
    localStorage.setItem(CHANNEL_KEY, c);
  } catch {
    /* ignore */
  }
  return c;
}

export function isOtaSupported() {
  return Capacitor.isNativePlatform();
}

/** Call once when the JS app has booted successfully (required by Capgo). */
export async function notifyOtaReady() {
  if (!isOtaSupported()) return;
  try {
    await CapacitorUpdater.notifyAppReady();
  } catch (e) {
    console.warn("[OTA] notifyAppReady failed", e);
  }
}

/**
 * Check + optionally download/apply web update for the selected channel.
 * @returns {Promise<{status: string, message?: string, version?: string}>}
 */
export async function checkForWebUpdate({ apply = true } = {}) {
  if (!isOtaSupported()) {
    return { status: "unsupported", message: "OTA only works inside the Android app" };
  }

  let manifest;
  try {
    const res = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`manifest HTTP ${res.status}`);
    manifest = await res.json();
  } catch (e) {
    return { status: "error", message: `Could not reach update channel: ${e.message || e}` };
  }

  const channel = getOtaChannel();
  const entry = manifest?.channels?.[channel] || manifest?.channels?.production;
  if (!entry?.version || !entry?.url) {
    return { status: "error", message: "Invalid update manifest" };
  }

  let currentVersion = "builtin";
  try {
    const cur = await CapacitorUpdater.current();
    currentVersion = cur?.bundle?.version || cur?.bundle?.versionName || "builtin";
  } catch {
    /* first run */
  }

  if (String(currentVersion) === String(entry.version)) {
    return {
      status: "up-to-date",
      version: entry.version,
      message: `Already on ${entry.version} (${channel})`
    };
  }

  if (!apply) {
    return {
      status: "available",
      version: entry.version,
      message: `Update ${entry.version} available on ${channel}`
    };
  }

  try {
    const bundle = await CapacitorUpdater.download({
      url: entry.url,
      version: String(entry.version)
    });
    await CapacitorUpdater.set({ id: bundle.id });
    await CapacitorUpdater.reload();
    return {
      status: "applied",
      version: entry.version,
      message: `Updated to ${entry.version}`
    };
  } catch (e) {
    return {
      status: "error",
      message: `Download/apply failed: ${e.message || e}`
    };
  }
}

/** Background check: download if newer, apply on next opportunity via set+reload when safe. */
export async function silentOtaCheck() {
  if (!isOtaSupported()) return;
  try {
    const result = await checkForWebUpdate({ apply: true });
    if (result.status === "error") {
      console.warn("[OTA]", result.message);
    } else {
      console.info("[OTA]", result.status, result.version || "");
    }
  } catch (e) {
    console.warn("[OTA] silent check failed", e);
  }
}
