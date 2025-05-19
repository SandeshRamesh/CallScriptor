import sys
import os
import json
import queue
import threading
from vosk import Model, KaldiRecognizer
import pyaudio

MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "models", "vosk-model-small-en-us-0.15"
)
SAMPLE_RATE = 16000
CHUNK_SIZE = 4000  # About 0.25s of audio

# Check model path
if not os.path.exists(MODEL_PATH):
    print(json.dumps({"error": f"Model not found at {MODEL_PATH}"}))
    sys.exit(1)

# Load Vosk model
model = Model(MODEL_PATH)
recognizer = KaldiRecognizer(model, SAMPLE_RATE)

# Queue and threading to handle stream
audio_queue = queue.Queue()


def callback(in_data, frame_count, time_info, status):
    audio_queue.put(in_data)
    return (None, pyaudio.paContinue)


# # 🔍 Find VB-Audio input device
# def find_vb_audio_input(p):
#     for i in range(p.get_device_count()):
#         info = p.get_device_info_by_index(i)
#         if "VB-Audio" in info["name"] and info["maxInputChannels"] > 0:
#             return i
#     return None


# # Initialize PyAudio
# p = pyaudio.PyAudio()
# vb_input_index = find_vb_audio_input(p)

# if vb_input_index is None:
#     print(json.dumps({"error": "VB-Audio input device not found"}))
#     sys.exit(1)

# # 🎤 Open stream from VB-Audio
# try:
#     stream = p.open(
#         format=pyaudio.paInt16,
#         channels=1,
#         rate=SAMPLE_RATE,
#         input=True,
#         input_device_index=vb_input_index,
#         frames_per_buffer=CHUNK_SIZE,
#         stream_callback=callback,
#     )
# except Exception as e:
#     print(json.dumps({"error": f"Failed to open VB-Audio device: {str(e)}"}))
#     sys.exit(1)

# stream.start_stream()

# Initialize PyAudio
p = pyaudio.PyAudio()
try:
    stream = p.open(
        format=pyaudio.paInt16,
        channels=1,
        rate=SAMPLE_RATE,
        input=True,
        frames_per_buffer=CHUNK_SIZE,
        stream_callback=callback,
    )
except Exception as e:
    print(json.dumps({"error": f"Failed to open microphone: {str(e)}"}))
    sys.exit(1)

stream.start_stream()

# Recognition loop
try:
    while True:
        data = audio_queue.get()
        if recognizer.AcceptWaveform(data):
            result = recognizer.Result()
            print(result)
            sys.stdout.flush()
        else:
            partial = recognizer.PartialResult()
            print(partial)
            sys.stdout.flush()
except KeyboardInterrupt:
    pass
except Exception as e:
    print(json.dumps({"error": f"Runtime error: {str(e)}"}))
    sys.stdout.flush()
finally:
    stream.stop_stream()
    stream.close()
    p.terminate()
