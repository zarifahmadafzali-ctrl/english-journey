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
        // Only construct controller — do NOT load ONNX models here (prevents startup OOM/crash).
        controller = TtsController.getInstance(getContext());
        Log.i(TAG, "NativeTts plugin loaded (models lazy)");
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        String lang = call.getString("lang", "en-US");
        Float speed = call.getFloat("speed", 1.0f);
        if (text == null || text.trim().isEmpty()) {
            call.resolve();
            return;
        }
        try {
            controller.speak(text, lang, speed != null ? speed : 1.0f);
            call.resolve();
        } catch (Throwable t) {
            Log.e(TAG, "speak error", t);
            call.reject("TTS speak failed: " + t.getMessage());
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        try {
            controller.stop();
            call.resolve();
        } catch (Throwable t) {
            call.reject("TTS stop failed: " + t.getMessage());
        }
    }

    @PluginMethod
    public void isReady(PluginCall call) {
        JSObject ret = new JSObject();
        // Models load on first speak; report available plugin as ready for UI.
        ret.put("ready", true);
        String err = controller != null ? controller.getInitError() : null;
        if (err != null) {
            ret.put("error", err);
            ret.put("ready", false);
        }
        call.resolve(ret);
    }
}
