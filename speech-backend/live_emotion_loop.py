import pyaudio
import wave
import time
import os
import sys
import os

sys.path.insert(
    0, os.path.abspath(os.path.join(os.path.dirname(__file__), "pyAudioAnalysis"))
)
from pyAudioAnalysis import audioTrainTest as aT

SAMPLE_RATE = 16000
CHUNK = 1024
RECORD_SECONDS = 2
WAV_OUTPUT_FILENAME = "live_temp.wav"
EMO_MODEL_DIR = "pyAudioAnalysis/pyAudioAnalysis/data/models/svm_rbf_4class"


def record_clip(filename):
    p = pyaudio.PyAudio()

    stream = p.open(
        format=pyaudio.paInt16,
        channels=1,
        rate=SAMPLE_RATE,
        input=True,
        frames_per_buffer=CHUNK,
    )

    print(f"[🎙️] Recording {RECORD_SECONDS}s...")
    frames = []
    for _ in range(0, int(SAMPLE_RATE / CHUNK * RECORD_SECONDS)):
        data = stream.read(CHUNK)
        frames.append(data)

    stream.stop_stream()
    stream.close()
    p.terminate()

    wf = wave.open(filename, "wb")
    wf.setnchannels(1)
    wf.setsampwidth(p.get_sample_size(pyaudio.paInt16))
    wf.setframerate(SAMPLE_RATE)
    wf.writeframes(b"".join(frames))
    wf.close()


def classify_emotion(filename):
    [class_result, probabilities, class_names] = aT.file_classification(
        filename, EMO_MODEL_DIR, "svm"
    )
    predicted_class = class_names[int(class_result)]
    print(f"[🧠] Detected Emotion: {predicted_class}")
    return predicted_class


if __name__ == "__main__":
    print("[🚀] Live Emotion Detection Started (CTRL+C to stop)")
    while True:
        try:
            record_clip(WAV_OUTPUT_FILENAME)
            classify_emotion(WAV_OUTPUT_FILENAME)
            print("-" * 30)
        except KeyboardInterrupt:
            print("Exiting...")
            break
        except Exception as e:
            print(f"[❌ Error] {e}")
            break
