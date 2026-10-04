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
        controller = TtsController.getInstance(getContext());
        // Warm-init off the UI thread
        new Thread(() -> {
            try {
                controller.initIfNeeded();
            } catch (Throwable t) {
                Log.e(TAG, "background init failed", t);
            }
        }, "ej-tts-init").start();
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
        try {
            controller.initIfNeeded();
            JSObject ret = new JSObject();
            ret.put("ready", controller.isReady());
            String err = controller.getInitError();
            if (err != null) {
                ret.put("error", err);
            }
            call.resolve(ret);
        } catch (Throwable t) {
            JSObject ret = new JSObject();
            ret.put("ready", false);
            ret.put("error", t.getMessage());
            call.resolve(ret);
        }
    }
}
