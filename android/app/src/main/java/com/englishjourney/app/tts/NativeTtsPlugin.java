package com.englishjourney.app.tts;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeTts")
public class NativeTtsPlugin extends Plugin {
    private static final String TAG = "NativeTtsPlugin";
    private TtsController controller;

    @Override
    public void load() {
        try {
            controller = TtsController.getInstance(getContext());
            // Only verify assets exist — do not load ONNX on startup.
            boolean ok = controller.verifyAssets();
            Log.i(TAG, "NativeTts loaded, assetsOk=" + ok
                    + (controller.getInitError() != null ? (" err=" + controller.getInitError()) : ""));
        } catch (Throwable t) {
            Log.e(TAG, "plugin load failed (non-fatal)", t);
        }
    }

    @PluginMethod
    public void speak(PluginCall call) {
        try {
            if (controller == null) {
                controller = TtsController.getInstance(getContext());
            }
            String text = call.getString("text", "");
            String lang = call.getString("lang", "en-US");
            Float speed = call.getFloat("speed", 1.0f);
            if (text == null || text.trim().isEmpty()) {
                call.resolve();
                return;
            }
            if (!controller.verifyAssets()) {
                JSObject err = new JSObject();
                err.put("ok", false);
                err.put("error", controller.getInitError() != null
                        ? controller.getInitError()
                        : "TTS assets missing");
                call.reject(err.getString("error"), err);
                return;
            }
            String queueErr = controller.speak(text, lang, speed != null ? speed : 1.0f);
            if (queueErr != null) {
                call.reject(queueErr);
                return;
            }
            JSObject ret = new JSObject();
            ret.put("ok", true);
            call.resolve(ret);
        } catch (Throwable t) {
            Log.e(TAG, "speak error (non-fatal)", t);
            call.reject("TTS speak failed: " + (t.getMessage() != null ? t.getMessage() : t.getClass().getSimpleName()));
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        try {
            if (controller != null) {
                controller.stop();
            }
            call.resolve();
        } catch (Throwable t) {
            Log.e(TAG, "stop error (non-fatal)", t);
            call.resolve(); // never fail stop
        }
    }

    /**
     * ready=true only when assets verified AND at least one engine has been
     * successfully loaded. Otherwise JS should fall back to Web Speech.
     */
    @PluginMethod
    public void isReady(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            if (controller == null) {
                controller = TtsController.getInstance(getContext());
            }
            boolean assetsOk = controller.verifyAssets();
            boolean loaded = controller.isReady();
            ret.put("assetsOk", assetsOk);
            ret.put("ready", loaded);
            String err = controller.getInitError();
            if (err != null) {
                ret.put("error", err);
            }
            if (!assetsOk) {
                ret.put("ready", false);
                if (err == null) {
                    ret.put("error", "TTS model assets not found in APK");
                }
            }
            call.resolve(ret);
        } catch (Throwable t) {
            ret.put("ready", false);
            ret.put("assetsOk", false);
            ret.put("error", t.getMessage() != null ? t.getMessage() : "isReady failed");
            call.resolve(ret);
        }
    }

    /** Explicitly prepare files + load English engine; returns status for JS. */
    @PluginMethod
    public void warmUp(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            if (controller == null) {
                controller = TtsController.getInstance(getContext());
            }
            boolean ok = controller.prepareFiles() && controller.ensureEngine(false) != null;
            ret.put("ready", ok);
            ret.put("assetsOk", controller.assetsAreOk());
            if (!ok && controller.getInitError() != null) {
                ret.put("error", controller.getInitError());
            }
            call.resolve(ret);
        } catch (Throwable t) {
            ret.put("ready", false);
            ret.put("error", t.getMessage() != null ? t.getMessage() : "warmUp failed");
            call.resolve(ret);
        }
    }
}
