package com.englishjourney.app.tts;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

@CapacitorPlugin(name = "NativeTts")
public class NativeTtsPlugin extends Plugin {
    private static final String TAG = "NativeTtsPlugin";
    private TtsController controller;

    @Override
    public void load() {
        try {
            controller = TtsController.getInstance(getContext());
            boolean ok = controller.verifyAssets();
            Log.i(TAG, "NativeTts loaded assetsOk=" + ok + " state=" + controller.getState()
                    + (controller.getInitError() != null ? " err=" + controller.getInitError() : ""));
        } catch (Throwable t) {
            Log.e(TAG, "plugin load failed (non-fatal)", t);
        }
    }

    private TtsController ctl() {
        if (controller == null) {
            controller = TtsController.getInstance(getContext());
        }
        return controller;
    }

    private JSObject statusObject(TtsController c) {
        TtsController.JSStatus s = c.snapshot();
        JSObject ret = new JSObject();
        ret.put("state", s.state);
        ret.put("ready", s.ready);
        ret.put("assetsOk", s.assetsOk);
        ret.put("enLoaded", s.enLoaded);
        ret.put("faLoaded", s.faLoaded);
        if (s.error != null) ret.put("error", s.error);
        if (s.nativeLibError != null) ret.put("nativeLibError", s.nativeLibError);
        return ret;
    }

    /**
     * Initialize engines (EN+FA). Blocks worker until READY or FAILED.
     * Does not run on the UI thread.
     */
    @PluginMethod
    public void warmUp(PluginCall call) {
        final TtsController c = ctl();
        new Thread(() -> {
            try {
                Future<Boolean> f = c.initializeAsync();
                boolean ok = Boolean.TRUE.equals(f.get(180, TimeUnit.SECONDS));
                JSObject ret = statusObject(c);
                ret.put("ready", ok && c.isReady());
                if (!ok && c.getInitError() != null) {
                    ret.put("error", c.getInitError());
                }
                call.resolve(ret);
            } catch (Throwable t) {
                JSObject ret = statusObject(c);
                ret.put("ready", false);
                ret.put("error", t.getMessage() != null ? t.getMessage() : "warmUp failed");
                call.resolve(ret);
            }
        }, "ej-tts-warmup").start();
    }

    @PluginMethod
    public void isReady(PluginCall call) {
        try {
            TtsController c = ctl();
            // Only verify assets here; do not claim READY until warmUp succeeded.
            c.verifyAssets();
            call.resolve(statusObject(c));
        } catch (Throwable t) {
            JSObject ret = new JSObject();
            ret.put("ready", false);
            ret.put("assetsOk", false);
            ret.put("state", "FAILED");
            ret.put("error", t.getMessage() != null ? t.getMessage() : "isReady failed");
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        isReady(call);
    }

    /**
     * Speak only when READY. Waits for synthesis+playback to finish before resolving.
     * Rejects with diagnostic error otherwise — never reports success on failure.
     */
    @PluginMethod
    public void speak(PluginCall call) {
        final TtsController c = ctl();
        final String text = call.getString("text", "");
        final String lang = call.getString("lang", "en-US");
        final Float speedObj = call.getFloat("speed", 1.0f);
        final float speed = speedObj != null ? speedObj : 1.0f;

        if (text == null || text.trim().isEmpty()) {
            call.resolve();
            return;
        }

        if (c.getState() != TtsController.State.READY) {
            // Attempt one controlled init if still uninitialized
            if (c.getState() == TtsController.State.UNINITIALIZED
                    || c.getState() == TtsController.State.FAILED) {
                new Thread(() -> {
                    try {
                        c.initializeAsync().get(180, TimeUnit.SECONDS);
                        if (!c.isReady()) {
                            call.reject(c.getInitError() != null ? c.getInitError() : "TTS init failed");
                            return;
                        }
                        String err = c.speakAsync(text, lang, speed).get(120, TimeUnit.SECONDS);
                        if (err != null) {
                            call.reject(err);
                        } else {
                            JSObject ret = new JSObject();
                            ret.put("ok", true);
                            call.resolve(ret);
                        }
                    } catch (Throwable t) {
                        call.reject(t.getMessage() != null ? t.getMessage() : "speak failed");
                    }
                }, "ej-tts-speak").start();
                return;
            }
            call.reject("TTS not ready (state=" + c.getState() + ")"
                    + (c.getInitError() != null ? ": " + c.getInitError() : ""));
            return;
        }

        new Thread(() -> {
            try {
                String err = c.speakAsync(text, lang, speed).get(120, TimeUnit.SECONDS);
                if (err != null) {
                    call.reject(err);
                } else {
                    JSObject ret = new JSObject();
                    ret.put("ok", true);
                    call.resolve(ret);
                }
            } catch (Throwable t) {
                call.reject(t.getMessage() != null ? t.getMessage() : "speak failed");
            }
        }, "ej-tts-speak").start();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        try {
            ctl().stop();
            call.resolve();
        } catch (Throwable t) {
            Log.e(TAG, "stop error", t);
            call.resolve();
        }
    }
}
