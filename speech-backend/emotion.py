import pyaudio
import wave
import torch
import torchaudio
import os
from speechbrain.inference.interfaces import foreign_class
import warnings

warnings.filterwarnings("ignore", category=UserWarning)

# --- Config ---
SAMPLE_RATE = 48000
CHUNK = 1024
RECORD_SECONDS = 2
OUTPUT_WAV = "temp.wav"
DEVICE_INDEX = 30  # 🎧 VB-Audio Virtual Cable input index
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODEL_PATH = os.path.abspath("speech-backend/models/wav2vec2")


# --- Load model ---

# print("[DEBUG] CWD is:", os.getcwd())

p = pyaudio.PyAudio()
# print("[DEBUG] Listing input devices...")
# for i in range(p.get_device_count()):
#     dev = p.get_device_info_by_index(i)
#     print(f"{i}: {dev['name']} | Input Channels: {dev['maxInputChannels']}")


classifier = foreign_class(
    source=MODEL_PATH,
    pymodule_file=os.path.join(MODEL_PATH, "custom_interface.py"),
    classname="CustomEncoderWav2vec2Classifier",
    run_opts={"device": DEVICE},
    savedir=MODEL_PATH,
)


# --- Record from VB-Audio ---
def record_clip(filename):
    # print(f"[🎙️] Recording {RECORD_SECONDS}s from VB-Audio...")
    # print("[DEBUG] Entered record_clip")
    p = pyaudio.PyAudio()

    # Get channel count from device
    dev_info = p.get_device_info_by_index(DEVICE_INDEX)
    channels = int(dev_info["maxInputChannels"])
    if channels < 1:
        raise RuntimeError("Selected device does not support input channels.")

    stream = p.open(
        format=pyaudio.paInt16,
        channels=channels,
        rate=SAMPLE_RATE,
        input=True,
        input_device_index=DEVICE_INDEX,
        frames_per_buffer=CHUNK,
    )

    frames = []
    for _ in range(0, int(SAMPLE_RATE / CHUNK * RECORD_SECONDS)):
        data = stream.read(CHUNK)
        frames.append(data)

    stream.stop_stream()
    stream.close()
    p.terminate()

    wf = wave.open(filename, "wb")
    wf.setnchannels(channels)
    wf.setsampwidth(p.get_sample_size(pyaudio.paInt16))
    wf.setframerate(SAMPLE_RATE)
    wf.writeframes(b"".join(frames))
    wf.close()


# --- Detect emotion ---
def detect_emotion(file_path):
    signal, fs = torchaudio.load(file_path)

    # Downmix to mono if needed
    if signal.shape[0] > 1:
        signal = torch.mean(signal, dim=0, keepdim=True)

    # Resample if needed
    if fs != 16000:
        signal = torchaudio.transforms.Resample(fs, 16000)(signal)

    label = classifier.classify_file(file_path)[-1]

    # ⬇️ This fixes the list problem
    if isinstance(label, list):
        label = label[0]

    # print(label)
    return label


EMOTION_LABELS = {"neu": "Neutral", "ang": "Angry", "hap": "Happy", "sad": "Sad"}

# --- Main loop ---
if __name__ == "__main__":
    print("[INFO] VB-Audio Emotion Detection Started (CTRL+C to stop)")
    while True:
        try:
            # print("[DEBUG] Starting emotion detection...")
            record_clip(OUTPUT_WAV)
            emotion = detect_emotion(OUTPUT_WAV)
            print(EMOTION_LABELS.get(emotion, emotion), flush=True)

        except KeyboardInterrupt:
            print("Exiting...")
            break
        except Exception as e:
            print(f"[Error] {e}")
            break
