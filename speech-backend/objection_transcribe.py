import json
import queue
import sys
import os
import pyaudio
import vosk
import numpy as np
from sentence_transformers import SentenceTransformer

# --- Configuration ---
DEVICE_INDEX = 30  # VB-Audio index
SAMPLE_RATE = 48000
CHUNK = 4000
THRESHOLD = 0.5  # Lower for debugging; raise once stable

# --- Load model & objection script ---
model_path = os.path.abspath("speech-backend/models/vosk-model-small-en-us-0.15")
objection_json_path = os.path.abspath("speech-backend/last_script.json")

try:
    with open(objection_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        objections = data["objections"]
except Exception as e:
    print(f"[ERROR] Failed to load objections: {e}", file=sys.stderr)
    sys.exit(1)

# --- Load sentence transformer & embed triggers ---
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
trigger_map = {}  # { trigger_phrase: (np.array(embedding), label) }

for obj in objections:
    for trig in obj["triggers"]:
        emb = np.array(embedding_model.encode(trig))
        trigger_map[trig] = (emb, obj["label"])


def cosine_sim(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


# --- Setup Vosk + Audio ---
vosk.SetLogLevel(0)
rec_model = vosk.Model(model_path)
recognizer = vosk.KaldiRecognizer(rec_model, SAMPLE_RATE)

audio_queue = queue.Queue()


def audio_callback(in_data, frame_count, time_info, status):
    audio_queue.put(in_data)
    return (None, pyaudio.paContinue)


p = pyaudio.PyAudio()
stream = p.open(
    format=pyaudio.paInt16,
    channels=1,
    rate=SAMPLE_RATE,
    input=True,
    input_device_index=DEVICE_INDEX,
    frames_per_buffer=CHUNK,
    stream_callback=audio_callback,
)
stream.start_stream()

# --- Main Loop ---
# print("[READY] Real-time objection listener started.", flush=True)


try:
    buffered_text = ""
    while True:
        data = audio_queue.get()

        if recognizer.AcceptWaveform(data):
            result = json.loads(recognizer.Result())
            final_text = result.get("text", "").strip()

            # Combine with previous buffer
            full_phrase = (buffered_text + " " + final_text).strip()
            buffered_text = ""  # clear after processing

            if full_phrase:
                phrase_vec = np.array(embedding_model.encode(full_phrase))
                matched = False
                for trig, (vec, label) in trigger_map.items():
                    score = cosine_sim(phrase_vec, vec)
                    # print(
                    #     f"[DEBUG] Compared to: {trig} -> Score: {score:.2f}", flush=True
                    # )
                    if score > THRESHOLD:
                        matchData = {
                            "label": label,
                            "trigger": trig,
                            "response": obj["response"],
                        }
                        print(
                            json.dumps(matchData), flush=True
                        )  # Send match data to Electron
                        matched = True
                        break
                if not matched:
                    print(full_phrase, flush=True)

        else:
            partial = json.loads(recognizer.PartialResult()).get("partial", "").strip()
            if partial:
                buffered_text = partial  # store last spoken phrase

except KeyboardInterrupt:
    print("Stopping transcription...", flush=True)

finally:
    stream.stop_stream()
    stream.close()
    p.terminate()
