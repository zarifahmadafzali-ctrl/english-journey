package com.englishjourney.app.tts;

import android.content.Context;
import android.content.res.AssetManager;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.util.Log;

import com.k2fsa.sherpa.onnx.GeneratedAudio;
import com.k2fsa.sherpa.onnx.OfflineTts;
import com.k2fsa.sherpa.onnx.OfflineTtsConfig;
import com.k2fsa.sherpa.onnx.OfflineTtsModelConfig;
import com.k2fsa.sherpa.onnx.OfflineTtsVitsModelConfig;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Native offline neural TTS via Sherpa-ONNX + Piper VITS.
 * Completely independent of system/Google TTS and Web Speech.
 */
public final class TtsController {
    private static final String TAG = "EjNativeTts";
    private static final String EN_MODEL = "tts/en/en_US-amy-medium.onnx";
    private static final String EN_TOKENS = "tts/en/tokens.txt";
    private static final String FA_MODEL = "tts/fa/fa_IR-gyro-medium.onnx";
    private static final String FA_TOKENS = "tts/fa/tokens.txt";
    private static final String DATA_DIR = "tts/espeak-ng-data";

    private static TtsController instance;

    private final Context appContext;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final AtomicBoolean ready = new AtomicBoolean(false);
    private final AtomicBoolean stopped = new AtomicBoolean(true);
    private final AtomicInteger generation = new AtomicInteger(0);

    private OfflineTts enTts;
    private OfflineTts faTts;
    private AudioTrack audioTrack;
    private String initError = null;

    private TtsController(Context context) {
        this.appContext = context.getApplicationContext();
    }

    public static synchronized TtsController getInstance(Context context) {
        if (instance == null) {
            instance = new TtsController(context);
        }
        return instance;
    }

    public synchronized void initIfNeeded() {
        if (ready.get() || initError != null && enTts != null) {
            return;
        }
        try {
            AssetManager am = appContext.getAssets();
            enTts = createEngine(am, EN_MODEL, EN_TOKENS);
            faTts = createEngine(am, FA_MODEL, FA_TOKENS);
            ready.set(true);
            initError = null;
            Log.i(TAG, "Sherpa-ONNX TTS ready (en_US-amy-medium + fa_IR-gyro-medium)");
        } catch (Throwable t) {
            initError = t.getMessage() != null ? t.getMessage() : t.toString();
            Log.e(TAG, "TTS init failed: " + initError, t);
            ready.set(false);
        }
    }

    private OfflineTts createEngine(AssetManager am, String model, String tokens) {
        OfflineTtsVitsModelConfig vits = new OfflineTtsVitsModelConfig();
        vits.setModel(model);
        vits.setTokens(tokens);
        vits.setDataDir(DATA_DIR);
        vits.setLexicon("");
        vits.setDictDir("");
        vits.setNoiseScale(0.667f);
        vits.setNoiseScaleW(0.8f);
        vits.setLengthScale(1.0f);

        OfflineTtsModelConfig modelConfig = new OfflineTtsModelConfig();
        modelConfig.setVits(vits);
        modelConfig.setNumThreads(2);
        modelConfig.setDebug(false);
        modelConfig.setProvider("cpu");

        OfflineTtsConfig config = new OfflineTtsConfig(
                modelConfig,
                "",
                "",
                1,
                0.2f
        );
        return new OfflineTts(am, config);
    }

    public boolean isReady() {
        return ready.get();
    }

    public String getInitError() {
        return initError;
    }

    public void speak(String text, String lang, float speed) {
        if (text == null || text.trim().isEmpty()) {
            return;
        }
        final String normalizedLang = normalizeLang(lang);
        final float spd = speed <= 0 ? 1.0f : speed;
        final int gen = generation.incrementAndGet();
        stopped.set(false);

        executor.execute(() -> {
            try {
                initIfNeeded();
                if (!ready.get()) {
                    Log.e(TAG, "speak aborted: not ready (" + initError + ")");
                    return;
                }
                if (gen != generation.get() || stopped.get()) {
                    return;
                }

                OfflineTts engine = isPersian(normalizedLang) ? faTts : enTts;
                if (engine == null) {
                    Log.e(TAG, "No engine for lang=" + normalizedLang);
                    return;
                }

                Log.i(TAG, "synthesize lang=" + normalizedLang + " len=" + text.length());
                GeneratedAudio audio = engine.generate(text, 0, spd);
                if (gen != generation.get() || stopped.get()) {
                    return;
                }
                if (audio == null || audio.getSamples() == null || audio.getSamples().length == 0) {
                    Log.w(TAG, "empty audio");
                    return;
                }
                playPcm(audio.getSamples(), audio.getSampleRate(), gen);
            } catch (Throwable t) {
                Log.e(TAG, "speak failed: " + t.getMessage(), t);
            }
        });
    }

    public void stop() {
        generation.incrementAndGet();
        stopped.set(true);
        synchronized (this) {
            if (audioTrack != null) {
                try {
                    audioTrack.pause();
                    audioTrack.flush();
                    audioTrack.stop();
                } catch (Throwable ignored) {
                }
                try {
                    audioTrack.release();
                } catch (Throwable ignored) {
                }
                audioTrack = null;
            }
        }
    }

    private void playPcm(float[] samples, int sampleRate, int gen) {
        if (gen != generation.get() || stopped.get()) {
            return;
        }
        int n = samples.length;
        short[] pcm = new short[n];
        for (int i = 0; i < n; i++) {
            float s = samples[i];
            if (s > 1f) s = 1f;
            if (s < -1f) s = -1f;
            pcm[i] = (short) (s * 32767f);
        }

        int minBuf = AudioTrack.getMinBufferSize(
                sampleRate,
                AudioFormat.CHANNEL_OUT_MONO,
                AudioFormat.ENCODING_PCM_16BIT
        );
        int bufSize = Math.max(minBuf, pcm.length * 2);

        AudioTrack track;
        synchronized (this) {
            if (audioTrack != null) {
                try {
                    audioTrack.release();
                } catch (Throwable ignored) {
                }
                audioTrack = null;
            }
            track = new AudioTrack(
                    new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .build(),
                    new AudioFormat.Builder()
                            .setSampleRate(sampleRate)
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build(),
                    bufSize,
                    AudioTrack.MODE_STREAM,
                    AudioManager.AUDIO_SESSION_ID_GENERATE
            );
            audioTrack = track;
        }

        try {
            track.play();
            int offset = 0;
            while (offset < pcm.length) {
                if (gen != generation.get() || stopped.get()) {
                    break;
                }
                int written = track.write(pcm, offset, Math.min(4096, pcm.length - offset));
                if (written < 0) {
                    break;
                }
                offset += written;
            }
            // brief wait for buffer drain
            if (gen == generation.get() && !stopped.get()) {
                try {
                    Thread.sleep(50);
                } catch (InterruptedException ignored) {
                }
            }
        } catch (Throwable t) {
            Log.e(TAG, "playback failed: " + t.getMessage(), t);
        } finally {
            synchronized (this) {
                if (audioTrack == track) {
                    try {
                        track.stop();
                    } catch (Throwable ignored) {
                    }
                    try {
                        track.release();
                    } catch (Throwable ignored) {
                    }
                    audioTrack = null;
                }
            }
        }
    }

    private static String normalizeLang(String lang) {
        if (lang == null) return "en-US";
        String l = lang.trim().toLowerCase().replace('_', '-');
        if (l.startsWith("fa") || l.equals("persian") || l.equals("farsi")) {
            return "fa-IR";
        }
        return "en-US";
    }

    private static boolean isPersian(String normalizedLang) {
        return normalizedLang.startsWith("fa");
    }

    public void release() {
        stop();
        executor.execute(() -> {
            try {
                if (enTts != null) {
                    enTts.release();
                    enTts = null;
                }
                if (faTts != null) {
                    faTts.release();
                    faTts = null;
                }
            } catch (Throwable t) {
                Log.w(TAG, "release: " + t.getMessage());
            }
            ready.set(false);
        });
    }
}
