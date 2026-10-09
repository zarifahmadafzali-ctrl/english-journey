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

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Native offline neural TTS via Sherpa-ONNX + Piper VITS.
 * Models are verified in assets, copied to filesDir, then loaded via newFromFile
 * (AssetManager=null) to avoid native crashes from memory-mapping assets.
 * All failures are caught and reported; they must never kill the process.
 */
public final class TtsController {
    private static final String TAG = "EjNativeTts";

    private static final String ASSET_EN_MODEL = "tts/en/en_US-amy-medium.onnx";
    private static final String ASSET_EN_TOKENS = "tts/en/tokens.txt";
    private static final String ASSET_FA_MODEL = "tts/fa/fa_IR-gyro-medium.onnx";
    private static final String ASSET_FA_TOKENS = "tts/fa/tokens.txt";
    private static final String ASSET_DATA_DIR = "tts/espeak-ng-data";

    private static TtsController instance;

    private final Context appContext;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final AtomicBoolean stopped = new AtomicBoolean(true);
    private final AtomicInteger generation = new AtomicInteger(0);

    private OfflineTts enTts;
    private OfflineTts faTts;
    private AudioTrack audioTrack;

    private boolean assetsVerified = false;
    private boolean assetsOk = false;
    private boolean filesPrepared = false;
    private String lastError = null;

    private File enModelFile;
    private File enTokensFile;
    private File faModelFile;
    private File faTokensFile;
    private File dataDirFile;

    private TtsController(Context context) {
        this.appContext = context.getApplicationContext();
    }

    public static synchronized TtsController getInstance(Context context) {
        if (instance == null) {
            instance = new TtsController(context);
        }
        return instance;
    }

    /** Strict asset existence check — no model load. */
    public synchronized boolean verifyAssets() {
        if (assetsVerified) {
            return assetsOk;
        }
        assetsVerified = true;
        try {
            AssetManager am = appContext.getAssets();
            String[] required = {
                    ASSET_EN_MODEL,
                    ASSET_EN_TOKENS,
                    ASSET_FA_MODEL,
                    ASSET_FA_TOKENS
            };
            for (String path : required) {
                if (!assetExists(am, path)) {
                    lastError = "Missing TTS asset: " + path;
                    Log.e(TAG, lastError);
                    assetsOk = false;
                    return false;
                }
            }
            // espeak data dir must list at least one entry
            String[] data = am.list(ASSET_DATA_DIR);
            if (data == null || data.length == 0) {
                lastError = "Missing or empty asset dir: " + ASSET_DATA_DIR;
                Log.e(TAG, lastError);
                assetsOk = false;
                return false;
            }
            assetsOk = true;
            Log.i(TAG, "TTS assets verified OK");
            return true;
        } catch (Throwable t) {
            lastError = "Asset verify failed: " + safeMsg(t);
            Log.e(TAG, lastError, t);
            assetsOk = false;
            return false;
        }
    }

    private static boolean assetExists(AssetManager am, String path) {
        InputStream is = null;
        try {
            is = am.open(path);
            return is != null;
        } catch (Throwable t) {
            return false;
        } finally {
            if (is != null) {
                try {
                    is.close();
                } catch (Throwable ignored) {
                }
            }
        }
    }

    /**
     * Copy assets to filesDir so OfflineTts can use newFromFile (AssetManager null).
     * Idempotent — skips copy if files already exist with size > 0.
     */
    public synchronized boolean prepareFiles() {
        if (filesPrepared) {
            return true;
        }
        if (!verifyAssets()) {
            return false;
        }
        try {
            File root = new File(appContext.getFilesDir(), "tts");
            File enDir = new File(root, "en");
            File faDir = new File(root, "fa");
            dataDirFile = new File(root, "espeak-ng-data");
            if (!enDir.exists() && !enDir.mkdirs()) {
                throw new IllegalStateException("Cannot mkdir " + enDir);
            }
            if (!faDir.exists() && !faDir.mkdirs()) {
                throw new IllegalStateException("Cannot mkdir " + faDir);
            }

            enModelFile = copyAssetIfNeeded(ASSET_EN_MODEL, new File(enDir, "en_US-amy-medium.onnx"));
            enTokensFile = copyAssetIfNeeded(ASSET_EN_TOKENS, new File(enDir, "tokens.txt"));
            faModelFile = copyAssetIfNeeded(ASSET_FA_MODEL, new File(faDir, "fa_IR-gyro-medium.onnx"));
            faTokensFile = copyAssetIfNeeded(ASSET_FA_TOKENS, new File(faDir, "tokens.txt"));
            copyAssetDirRecursive(ASSET_DATA_DIR, dataDirFile);

            if (!enModelFile.isFile() || enModelFile.length() < 1_000_000) {
                throw new IllegalStateException("English model file invalid: " + enModelFile);
            }
            if (!faModelFile.isFile() || faModelFile.length() < 1_000_000) {
                throw new IllegalStateException("Persian model file invalid: " + faModelFile);
            }
            if (!dataDirFile.isDirectory()) {
                throw new IllegalStateException("espeak data dir missing: " + dataDirFile);
            }

            filesPrepared = true;
            Log.i(TAG, "TTS files prepared under " + root.getAbsolutePath());
            return true;
        } catch (Throwable t) {
            lastError = "Prepare files failed: " + safeMsg(t);
            Log.e(TAG, lastError, t);
            filesPrepared = false;
            return false;
        }
    }

    private File copyAssetIfNeeded(String assetPath, File dest) throws Exception {
        if (dest.isFile() && dest.length() > 0) {
            return dest;
        }
        File parent = dest.getParentFile();
        if (parent != null && !parent.exists() && !parent.mkdirs()) {
            throw new IllegalStateException("Cannot mkdir " + parent);
        }
        AssetManager am = appContext.getAssets();
        try (InputStream in = am.open(assetPath);
             OutputStream out = new FileOutputStream(dest)) {
            byte[] buf = new byte[64 * 1024];
            int n;
            while ((n = in.read(buf)) > 0) {
                out.write(buf, 0, n);
            }
            out.flush();
        }
        Log.i(TAG, "Copied asset " + assetPath + " -> " + dest.getAbsolutePath()
                + " (" + dest.length() + " bytes)");
        return dest;
    }

    private void copyAssetDirRecursive(String assetDir, File destDir) throws Exception {
        if (!destDir.exists() && !destDir.mkdirs()) {
            throw new IllegalStateException("Cannot mkdir " + destDir);
        }
        // Marker: if phontab exists and size>0, assume dir already copied
        File marker = new File(destDir, "phontab");
        if (marker.isFile() && marker.length() > 0) {
            return;
        }
        AssetManager am = appContext.getAssets();
        String[] children = am.list(assetDir);
        if (children == null) {
            return;
        }
        for (String child : children) {
            String childAsset = assetDir + "/" + child;
            String[] sub = am.list(childAsset);
            File out = new File(destDir, child);
            if (sub != null && sub.length > 0) {
                copyAssetDirRecursive(childAsset, out);
            } else {
                copyAssetIfNeeded(childAsset, out);
            }
        }
    }

    /**
     * Load one language engine from filesDir. Never throws out of this method.
     * @return engine or null on failure
     */
    public synchronized OfflineTts ensureEngine(boolean persian) {
        try {
            if (!prepareFiles()) {
                return null;
            }
            if (persian) {
                if (faTts != null) {
                    return faTts;
                }
                Log.i(TAG, "Loading Persian OfflineTts from files…");
                faTts = createEngineFromFiles(
                        faModelFile.getAbsolutePath(),
                        faTokensFile.getAbsolutePath(),
                        dataDirFile.getAbsolutePath()
                );
                if (faTts == null) {
                    lastError = "Persian OfflineTts constructor returned null/failed";
                    return null;
                }
                Log.i(TAG, "Persian TTS loaded");
                return faTts;
            } else {
                if (enTts != null) {
                    return enTts;
                }
                Log.i(TAG, "Loading English OfflineTts from files…");
                enTts = createEngineFromFiles(
                        enModelFile.getAbsolutePath(),
                        enTokensFile.getAbsolutePath(),
                        dataDirFile.getAbsolutePath()
                );
                if (enTts == null) {
                    lastError = "English OfflineTts constructor returned null/failed";
                    return null;
                }
                Log.i(TAG, "English TTS loaded");
                return enTts;
            }
        } catch (Throwable t) {
            lastError = "ensureEngine: " + safeMsg(t);
            Log.e(TAG, lastError, t);
            return null;
        }
    }

    private OfflineTts createEngineFromFiles(String modelPath, String tokensPath, String dataDir)
            throws Exception {
        if (modelPath == null || tokensPath == null || dataDir == null) {
            throw new IllegalArgumentException("null path");
        }
        File m = new File(modelPath);
        File t = new File(tokensPath);
        File d = new File(dataDir);
        if (!m.isFile() || m.length() == 0) {
            throw new IllegalStateException("Model missing: " + modelPath);
        }
        if (!t.isFile() || t.length() == 0) {
            throw new IllegalStateException("Tokens missing: " + tokensPath);
        }
        if (!d.isDirectory()) {
            throw new IllegalStateException("Data dir missing: " + dataDir);
        }

        OfflineTtsVitsModelConfig vits = new OfflineTtsVitsModelConfig();
        vits.setModel(modelPath);
        vits.setTokens(tokensPath);
        vits.setDataDir(dataDir);
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
        // AssetManager null => newFromFile (safer for large ONNX)
        OfflineTts tts = new OfflineTts(null, config);
        return tts;
    }

    /**
     * ready only if assets OK and at least one engine successfully loaded.
     * Before first successful load, returns false so JS can use Web Speech.
     */
    public synchronized boolean isReady() {
        return assetsOk && (enTts != null || faTts != null);
    }

    public synchronized boolean assetsAreOk() {
        return verifyAssets();
    }

    public String getInitError() {
        return lastError;
    }

    /**
     * Speak. All errors swallowed / logged. Returns error string or null on queued OK.
     * Does not throw.
     */
    public String speak(String text, String lang, float speed) {
        if (text == null || text.trim().isEmpty()) {
            return null;
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
                playPcmSafe(audio.getSamples(), audio.getSampleRate(), gen);
            } catch (UnsatisfiedLinkError e) {
                lastError = "Native lib missing: " + e.getMessage();
                Log.e(TAG, lastError, e);
            } catch (OutOfMemoryError e) {
                lastError = "Out of memory in TTS";
                Log.e(TAG, lastError, e);
            } catch (Throwable t) {
                lastError = "speak failed: " + safeMsg(t);
                Log.e(TAG, lastError, t);
            }
        });
        return null;
    }

    public void stop() {
        try {
            generation.incrementAndGet();
            stopped.set(true);
            synchronized (this) {
                releaseTrackLocked();
            }
        } catch (Throwable t) {
            Log.w(TAG, "stop: " + safeMsg(t));
        }
    }

    private void playPcmSafe(float[] samples, int sampleRate, int gen) {
        AudioTrack track = null;
        try {
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
            if (minBuf <= 0) {
                Log.e(TAG, "Invalid AudioTrack buffer size: " + minBuf);
                return;
            }
            int bufSize = Math.max(minBuf, 4096);

            synchronized (this) {
                releaseTrackLocked();
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

            track.play();
            int offset = 0;
            while (offset < pcm.length) {
                if (gen != generation.get() || stopped.get()) {
                    break;
                }
                int written = track.write(pcm, offset, Math.min(4096, pcm.length - offset));
                if (written < 0) {
                    Log.w(TAG, "AudioTrack.write error: " + written);
                    break;
                }
                offset += written;
            }
        } catch (Throwable t) {
            Log.e(TAG, "playback failed: " + safeMsg(t), t);
        } finally {
            synchronized (this) {
                if (audioTrack == track) {
                    releaseTrackLocked();
                } else if (track != null) {
                    try {
                        track.release();
                    } catch (Throwable ignored) {
                    }
                }
            }
        }
    }

    private void releaseTrackLocked() {
        if (audioTrack == null) return;
        try {
            audioTrack.pause();
        } catch (Throwable ignored) {
        }
        try {
            audioTrack.flush();
        } catch (Throwable ignored) {
        }
        try {
            audioTrack.stop();
        } catch (Throwable ignored) {
        }
        try {
            audioTrack.release();
        } catch (Throwable ignored) {
        }
        audioTrack = null;
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

    private static String safeMsg(Throwable t) {
        if (t == null) return "unknown";
        String m = t.getMessage();
        return m != null ? m : t.getClass().getSimpleName();
    }

    public void release() {
        stop();
        executor.execute(() -> {
            try {
                synchronized (TtsController.this) {
                    if (enTts != null) {
                        try {
                            enTts.release();
                        } catch (Throwable ignored) {
                        }
                        enTts = null;
                    }
                    if (faTts != null) {
                        try {
                            faTts.release();
                        } catch (Throwable ignored) {
                        }
                        faTts = null;
                    }
                }
            } catch (Throwable t) {
                Log.w(TAG, "release: " + safeMsg(t));
            }
        });
    }
}
