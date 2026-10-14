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
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Offline neural TTS (Sherpa-ONNX + Piper VITS).
 *
 * State machine: UNINITIALIZED → INITIALIZING → READY | FAILED
 * Models are copied from assets to filesDir, then loaded via newFromFile.
 * Speech is never attempted until READY.
 */
public final class TtsController {
    public enum State {
        UNINITIALIZED,
        INITIALIZING,
        READY,
        FAILED
    }

    private static final String TAG = "EjNativeTts";

    private static final String ASSET_EN_MODEL = "tts/en/en_US-amy-medium.onnx";
    private static final String ASSET_EN_TOKENS = "tts/en/tokens.txt";
    private static final String ASSET_FA_MODEL = "tts/fa/fa_IR-gyro-medium.onnx";
    private static final String ASSET_FA_TOKENS = "tts/fa/tokens.txt";
    private static final String ASSET_DATA_DIR = "tts/espeak-ng-data";

    private static final AtomicReference<String> nativeLibError = new AtomicReference<>(null);

    static {
        // Explicit load order: onnxruntime → c-api → cxx-api → jni
        String[] libs = {
                "onnxruntime",
                "sherpa-onnx-c-api",
                "sherpa-onnx-cxx-api",
                "sherpa-onnx-jni"
        };
        for (String lib : libs) {
            try {
                System.loadLibrary(lib);
                Log.i(TAG, "Loaded native library: " + lib);
            } catch (UnsatisfiedLinkError e) {
                // Some AARs merge symbols; continue but record first hard failure on jni
                Log.w(TAG, "loadLibrary(" + lib + "): " + e.getMessage());
                if ("sherpa-onnx-jni".equals(lib)) {
                    nativeLibError.set("Failed to load sherpa-onnx-jni: " + e.getMessage());
                }
            } catch (Throwable t) {
                Log.w(TAG, "loadLibrary(" + lib + ") unexpected: " + t.getMessage());
            }
        }
    }

    private static TtsController instance;

    private final Context appContext;
    private final ExecutorService executor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "ej-tts-worker");
        t.setPriority(Thread.NORM_PRIORITY - 1);
        return t;
    });

    private final AtomicReference<State> state = new AtomicReference<>(State.UNINITIALIZED);
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
        if (nativeLibError.get() != null) {
            lastError = nativeLibError.get();
            state.set(State.FAILED);
        }
    }

    public static synchronized TtsController getInstance(Context context) {
        if (instance == null) {
            instance = new TtsController(context);
        }
        return instance;
    }

    public State getState() {
        return state.get();
    }

    public String getInitError() {
        return lastError;
    }

    public synchronized boolean verifyAssets() {
        if (assetsVerified) {
            return assetsOk;
        }
        assetsVerified = true;
        try {
            AssetManager am = appContext.getAssets();
            String[] required = {
                    ASSET_EN_MODEL, ASSET_EN_TOKENS,
                    ASSET_FA_MODEL, ASSET_FA_TOKENS
            };
            for (String path : required) {
                if (!assetExists(am, path)) {
                    lastError = "Missing TTS asset: " + path;
                    Log.e(TAG, lastError);
                    assetsOk = false;
                    return false;
                }
                // size sanity for models
                long size = assetSize(am, path);
                if (path.endsWith(".onnx") && size < 1_000_000L) {
                    lastError = "TTS model too small (corrupt?): " + path + " size=" + size;
                    Log.e(TAG, lastError);
                    assetsOk = false;
                    return false;
                }
            }
            String[] data = am.list(ASSET_DATA_DIR);
            if (data == null || data.length == 0) {
                lastError = "Missing or empty: " + ASSET_DATA_DIR;
                assetsOk = false;
                return false;
            }
            if (!assetExists(am, ASSET_DATA_DIR + "/phontab")
                    || !assetExists(am, ASSET_DATA_DIR + "/phondata")
                    || !assetExists(am, ASSET_DATA_DIR + "/fa_dict")) {
                lastError = "espeak-ng-data incomplete (phontab/phondata/fa_dict)";
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
            return true;
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

    private static long assetSize(AssetManager am, String path) {
        InputStream is = null;
        try {
            is = am.open(path);
            long n = 0;
            byte[] buf = new byte[65536];
            int r;
            while ((r = is.read(buf)) > 0) {
                n += r;
            }
            return n;
        } catch (Throwable t) {
            return -1;
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
     * Full initialization on the worker thread:
     * verify assets → copy to filesDir → load EN + FA engines → optional smoke test.
     * Transitions state UNINITIALIZED/FAILED → INITIALIZING → READY|FAILED.
     */
    public boolean initializeBlocking() {
        State cur = state.get();
        if (cur == State.READY) {
            return true;
        }
        if (cur == State.INITIALIZING) {
            // Wait briefly for in-flight init
            long deadline = System.currentTimeMillis() + 120_000;
            while (state.get() == State.INITIALIZING && System.currentTimeMillis() < deadline) {
                try {
                    Thread.sleep(50);
                } catch (InterruptedException e) {
                    break;
                }
            }
            return state.get() == State.READY;
        }
        if (!state.compareAndSet(State.UNINITIALIZED, State.INITIALIZING)
                && !state.compareAndSet(State.FAILED, State.INITIALIZING)) {
            return state.get() == State.READY;
        }

        try {
            if (nativeLibError.get() != null) {
                throw new IllegalStateException(nativeLibError.get());
            }
            if (!verifyAssets()) {
                throw new IllegalStateException(lastError != null ? lastError : "assets missing");
            }
            if (!prepareFiles()) {
                throw new IllegalStateException(lastError != null ? lastError : "prepareFiles failed");
            }

            OfflineTts en = ensureEngine(false);
            if (en == null) {
                throw new IllegalStateException(lastError != null ? lastError : "English engine failed");
            }
            OfflineTts fa = ensureEngine(true);
            if (fa == null) {
                throw new IllegalStateException(lastError != null ? lastError : "Persian engine failed");
            }

            // Smoke test: short synthesis must return samples (catches broken native path)
            GeneratedAudio test = en.generate("hi", 0, 1.0f);
            if (test == null || test.getSamples() == null || test.getSamples().length < 100) {
                throw new IllegalStateException("English smoke synthesis returned empty audio");
            }

            state.set(State.READY);
            lastError = null;
            Log.i(TAG, "TTS READY (en+fa loaded, smoke OK, samples=" + test.getSamples().length + ")");
            return true;
        } catch (Throwable t) {
            lastError = "Init failed: " + safeMsg(t);
            Log.e(TAG, lastError, t);
            state.set(State.FAILED);
            return false;
        }
    }

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

            enModelFile = copyAssetIfNeeded(ASSET_EN_MODEL, new File(enDir, "en_US-amy-medium.onnx"), 1_000_000L);
            enTokensFile = copyAssetIfNeeded(ASSET_EN_TOKENS, new File(enDir, "tokens.txt"), 10L);
            faModelFile = copyAssetIfNeeded(ASSET_FA_MODEL, new File(faDir, "fa_IR-gyro-medium.onnx"), 1_000_000L);
            faTokensFile = copyAssetIfNeeded(ASSET_FA_TOKENS, new File(faDir, "tokens.txt"), 10L);
            copyAssetDirRecursive(ASSET_DATA_DIR, dataDirFile);

            File phontab = new File(dataDirFile, "phontab");
            File phondata = new File(dataDirFile, "phondata");
            File faDict = new File(dataDirFile, "fa_dict");
            if (!phontab.isFile() || phontab.length() == 0
                    || !phondata.isFile() || phondata.length() == 0
                    || !faDict.isFile() || faDict.length() == 0) {
                // Incomplete previous copy — force re-copy
                deleteRecursive(dataDirFile);
                if (!dataDirFile.mkdirs()) {
                    throw new IllegalStateException("Cannot recreate espeak data dir");
                }
                copyAssetDirRecursive(ASSET_DATA_DIR, dataDirFile);
                phontab = new File(dataDirFile, "phontab");
                if (!phontab.isFile() || phontab.length() == 0) {
                    throw new IllegalStateException("espeak phontab still missing after copy");
                }
            }

            filesPrepared = true;
            Log.i(TAG, "TTS files prepared under " + root.getAbsolutePath()
                    + " en=" + enModelFile.length() + " fa=" + faModelFile.length());
            return true;
        } catch (Throwable t) {
            lastError = "Prepare files failed: " + safeMsg(t);
            Log.e(TAG, lastError, t);
            filesPrepared = false;
            return false;
        }
    }

    private File copyAssetIfNeeded(String assetPath, File dest, long minBytes) throws Exception {
        if (dest.isFile() && dest.length() >= minBytes) {
            return dest;
        }
        if (dest.exists()) {
            //noinspection ResultOfMethodCallIgnored
            dest.delete();
        }
        File parent = dest.getParentFile();
        if (parent != null && !parent.exists() && !parent.mkdirs()) {
            throw new IllegalStateException("Cannot mkdir " + parent);
        }
        AssetManager am = appContext.getAssets();
        try (InputStream in = am.open(assetPath);
             OutputStream out = new FileOutputStream(dest)) {
            byte[] buf = new byte[128 * 1024];
            int n;
            while ((n = in.read(buf)) > 0) {
                out.write(buf, 0, n);
            }
            out.flush();
        }
        if (dest.length() < minBytes) {
            throw new IllegalStateException("Copied file too small: " + dest + " size=" + dest.length());
        }
        Log.i(TAG, "Copied " + assetPath + " -> " + dest.getAbsolutePath() + " (" + dest.length() + " B)");
        return dest;
    }

    private void copyAssetDirRecursive(String assetDir, File destDir) throws Exception {
        if (!destDir.exists() && !destDir.mkdirs()) {
            throw new IllegalStateException("Cannot mkdir " + destDir);
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
                copyAssetIfNeeded(childAsset, out, 1L);
            }
        }
    }

    private static void deleteRecursive(File f) {
        if (f == null || !f.exists()) return;
        if (f.isDirectory()) {
            File[] kids = f.listFiles();
            if (kids != null) {
                for (File k : kids) {
                    deleteRecursive(k);
                }
            }
        }
        //noinspection ResultOfMethodCallIgnored
        f.delete();
    }

    public synchronized OfflineTts ensureEngine(boolean persian) {
        try {
            if (!prepareFiles()) {
                return null;
            }
            if (persian) {
                if (faTts != null) return faTts;
                Log.i(TAG, "Creating Persian OfflineTts…");
                faTts = createEngineFromFiles(
                        faModelFile.getAbsolutePath(),
                        faTokensFile.getAbsolutePath(),
                        dataDirFile.getAbsolutePath());
                return faTts;
            } else {
                if (enTts != null) return enTts;
                Log.i(TAG, "Creating English OfflineTts…");
                enTts = createEngineFromFiles(
                        enModelFile.getAbsolutePath(),
                        enTokensFile.getAbsolutePath(),
                        dataDirFile.getAbsolutePath());
                return enTts;
            }
        } catch (Throwable t) {
            lastError = "ensureEngine: " + safeMsg(t);
            Log.e(TAG, lastError, t);
            return null;
        }
    }

    private OfflineTts createEngineFromFiles(String modelPath, String tokensPath, String dataDir) {
        File m = new File(modelPath);
        File t = new File(tokensPath);
        File d = new File(dataDir);
        if (!m.isFile() || m.length() < 1_000_000L) {
            throw new IllegalStateException("Model missing/small: " + modelPath);
        }
        if (!t.isFile() || t.length() < 10) {
            throw new IllegalStateException("Tokens missing: " + tokensPath);
        }
        if (!d.isDirectory() || !new File(d, "phontab").isFile()) {
            throw new IllegalStateException("Data dir invalid: " + dataDir);
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
        modelConfig.setDebug(true);
        modelConfig.setProvider("cpu");

        OfflineTtsConfig config = new OfflineTtsConfig(modelConfig, "", "", 1, 0.2f);
        // null AssetManager → native newFromFile
        OfflineTts tts = new OfflineTts(null, config);
        if (tts.sampleRate() <= 0) {
            throw new IllegalStateException("OfflineTts sampleRate invalid after create");
        }
        Log.i(TAG, "OfflineTts created sampleRate=" + tts.sampleRate() + " speakers=" + tts.numSpeakers());
        return tts;
    }

    /** READY only after successful initializeBlocking(). */
    public boolean isReady() {
        return state.get() == State.READY;
    }

    public boolean assetsAreOk() {
        return verifyAssets();
    }

    /**
     * Synthesize and play fully on worker thread. Returns null on success, error message on failure.
     * Does not throw. Rejects if not READY.
     */
    public String speakBlocking(String text, String lang, float speed) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }
        if (state.get() != State.READY) {
            return "TTS not READY (state=" + state.get() + ")"
                    + (lastError != null ? ": " + lastError : "");
        }

        final String normalizedLang = normalizeLang(lang);
        final boolean persian = isPersian(normalizedLang);
        final float spd = speed <= 0 ? 1.0f : Math.min(speed, 2.0f);
        final int gen = generation.incrementAndGet();
        stopped.set(false);

        try {
            OfflineTts engine;
            synchronized (this) {
                engine = persian ? faTts : enTts;
            }
            if (engine == null) {
                return "Engine null for lang=" + normalizedLang;
            }
            if (gen != generation.get() || stopped.get()) {
                return null;
            }

            Log.i(TAG, "synthesize lang=" + normalizedLang + " len=" + text.length());
            GeneratedAudio audio = engine.generate(text, 0, spd);
            if (gen != generation.get() || stopped.get()) {
                return null;
            }
            if (audio == null || audio.getSamples() == null || audio.getSamples().length == 0) {
                return "Empty audio from synthesizer";
            }
            playPcmSafe(audio.getSamples(), audio.getSampleRate(), gen);
            return null;
        } catch (UnsatisfiedLinkError e) {
            lastError = "Native lib missing during speak: " + e.getMessage();
            state.set(State.FAILED);
            Log.e(TAG, lastError, e);
            return lastError;
        } catch (OutOfMemoryError e) {
            lastError = "Out of memory during speak";
            Log.e(TAG, lastError, e);
            return lastError;
        } catch (Throwable t) {
            lastError = "speak failed: " + safeMsg(t);
            Log.e(TAG, lastError, t);
            return lastError;
        }
    }

    /** Queue init on worker; callable from any thread. */
    public Future<Boolean> initializeAsync() {
        return executor.submit(this::initializeBlocking);
    }

    /** Queue speak on worker. */
    public Future<String> speakAsync(String text, String lang, float speed) {
        return executor.submit(() -> speakBlocking(text, lang, speed));
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
                Log.e(TAG, "Invalid AudioTrack buffer: " + minBuf);
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
                if (gen != generation.get() || stopped.get()) break;
                int written = track.write(pcm, offset, Math.min(4096, pcm.length - offset));
                if (written < 0) break;
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

    public JSStatus snapshot() {
        JSStatus s = new JSStatus();
        s.state = state.get().name();
        s.ready = state.get() == State.READY;
        s.assetsOk = assetsOk;
        s.error = lastError;
        s.nativeLibError = nativeLibError.get();
        s.enLoaded = enTts != null;
        s.faLoaded = faTts != null;
        return s;
    }

    public static final class JSStatus {
        public String state;
        public boolean ready;
        public boolean assetsOk;
        public String error;
        public String nativeLibError;
        public boolean enLoaded;
        public boolean faLoaded;
    }
}
