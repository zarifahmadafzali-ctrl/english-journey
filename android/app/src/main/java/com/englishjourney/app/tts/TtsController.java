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
 * Engines are loaded lazily (one language at a time) to avoid OOM on mid-range phones.
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
    private final AtomicBoolean stopped = new AtomicBoolean(true);
    private final AtomicInteger generation = new AtomicInteger(0);

    private OfflineTts enTts;
    private OfflineTts faTts;
    private AudioTrack audioTrack;
    private String lastError = null;

    private TtsController(Context context) {
        this.appContext = context.getApplicationContext();
    }

    public static synchronized TtsController getInstance(Context context) {
        if (instance == null) {
            instance = new TtsController(context);
        }
        return instance;
    }

    /** Do not load models at startup — only when a language is first needed. */
    public synchronized OfflineTts ensureEngine(boolean persian) {
        try {
            if (persian) {
                if (faTts == null) {
                    Log.i(TAG, "Lazy-loading Persian TTS model…");
                    faTts = createEngine(appContext.getAssets(), FA_MODEL, FA_TOKENS);
                    Log.i(TAG, "Persian TTS ready");
                }
                return faTts;
            } else {
                if (enTts == null) {
                    Log.i(TAG, "Lazy-loading English TTS model…");
                    enTts = createEngine(appContext.getAssets(), EN_MODEL, EN_TOKENS);
                    Log.i(TAG, "English TTS ready");
                }
                return enTts;
            }
        } catch (Throwable t) {
            lastError = t.getMessage() != null ? t.getMessage() : t.toString();
            Log.e(TAG, "ensureEngine failed: " + lastError, t);
            return null;
        }
    }

    /** Lightweight readiness: true if at least one engine can be attempted (assets present). */
    public boolean isReady() {
        return enTts != null || faTts != null || lastError == null;
    }

    public String getInitError() {
        return lastError;
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
        modelConfig.setNumThreads(1);
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

    public void speak(String text, String lang, float speed) {
        if (text == null || text.trim().isEmpty()) {
            return;
        }
        final String normalizedLang = normalizeLang(lang);
        final boolean persian = isPersian(normalizedLang);
        final float spd = speed <= 0 ? 1.0f : Math.min(speed, 2.0f);
        final int gen = generation.incrementAndGet();
        stopped.set(false);

        executor.execute(() -> {
            try {
                if (gen != generation.get() || stopped.get()) {
                    return;
                }
                OfflineTts engine = ensureEngine(persian);
                if (engine == null) {
                    Log.e(TAG, "speak aborted: engine null (" + lastError + ")");
                    return;
                }
                if (gen != generation.get() || stopped.get()) {
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
            } catch (UnsatisfiedLinkError e) {
                lastError = "Native library missing: " + e.getMessage();
                Log.e(TAG, lastError, e);
            } catch (OutOfMemoryError e) {
                lastError = "Out of memory loading TTS";
                Log.e(TAG, lastError, e);
            } catch (Throwable t) {
                lastError = t.getMessage() != null ? t.getMessage() : t.toString();
                Log.e(TAG, "speak failed: " + lastError, t);
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
        int bufSize = Math.max(minBuf, 4096);

        AudioTrack track;
        synchronized (this) {
            if (audioTrack != null) {
                try {
                    audioTrack.release();
                } catch (Throwable ignored) {
                }
                audioTrack = null;
            }
            track = new AudioTrack.Builder()
                    .setAudioAttributes(new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .build())
                    .setAudioFormat(new AudioFormat.Builder()
                            .setSampleRate(sampleRate)
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build())
                    .setBufferSizeInBytes(bufSize)
                    .setTransferMode(AudioTrack.MODE_STREAM)
                    .setSessionId(AudioManager.AUDIO_SESSION_ID_GENERATE)
                    .build();
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
            if (gen == generation.get() && !stopped.get()) {
                try {
                    Thread.sleep(30);
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
        });
    }
}
