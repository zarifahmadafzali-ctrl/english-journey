# Offline TTS attribution and licenses

English Journey embeds offline neural text-to-speech for Android.

## Runtime

| Component | License | Notes |
|-----------|---------|--------|
| [Sherpa-ONNX](https://github.com/k2-fsa/sherpa-onnx) | Apache-2.0 | Offline TTS / ONNX inference framework |
| [ONNX Runtime](https://onnxruntime.ai/) | MIT | Bundled via Sherpa-ONNX Android AAR |

## Voice models

| Voice | Source | Packaging | Notes |
|-------|--------|-----------|--------|
| **en_US-amy-medium** (Piper VITS) | [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices) / Sherpa package `vits-piper-en_US-amy-medium` | Piper voices repo: **MIT** | MODEL_CARD references Mimic3 / dataset terms; attribute MycroftAI Mimic3 voices and Piper. Dataset lineage may include CC-BY-SA material — retain attribution. |
| **fa_IR-gyro-medium** (Piper VITS) | [gyroing/Persian-Piper-Model-gyro](https://huggingface.co/gyroing/Persian-Piper-Model-gyro) and [rhasspy/piper-voices `fa/fa_IR/gyro/medium`](https://huggingface.co/rhasspy/piper-voices/tree/main/fa/fa_IR/gyro/medium) | **MIT** | Persian neural voice by gyroing, distributed with Piper. |

Converted Sherpa archives:

- https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-en_US-amy-medium.tar.bz2
- https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-fa_IR-gyro-medium.tar.bz2

## espeak-ng data

Phonemization data is included from the Sherpa Piper packages (espeak-ng-data).  
Respect espeak-ng and Sherpa packaging licenses; retain bundled notices where present.

## App usage

Speech audio is generated entirely on-device. No Google TTS, no system TTS engine, and no network is required for synthesis.
