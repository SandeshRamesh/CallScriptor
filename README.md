# 🧠 CallScriptor: Real-Time Audio-to-Script Sales Assistant

CallScriptor is a local desktop app that helps sales reps stay on script and handle objections seamlessly during live Zoom calls. It listens to real-time audio (via VB-Audio Cable), transcribes speech, detects objections using AI, and instantly displays the best response right on-screen.

---

## 🚀 Features

- 🎯 Live transcript highlighting (teleprompter style)
- 🤖 Real-time objection detection with semantic matching
- 🔊 VB-Audio Cable input for Zoom call listening
- ⚡ Works fully offline — no cloud APIs
- 🎨 Built with React + Electron + Python (Vosk, Sentence Transformers)

---

## 📁 Project Structure

- `main/` — Electron main + preload scripts
- `src/` — React components (script display, loader, matcher)
- `speech-backend/` — Python audio + AI backend (transcribe, emotion, objections)
- `models/` — Place downloaded model files here (e.g. Vosk, HuggingFace)
- `public/` — (optional) static files
- `README.md` — You’re reading it.

---

## 🛠 Setup

### 1. Install Dependencies

```bash
npm install
pip install -r requirements.txt
```

### 2. Download Models

Vosk Model → speech-backend/models/vosk-model-small-en-us-0.15

HuggingFace model files → speech-backend/models/ (for sentence-transformers, emotion)

### 3. Run the App

npm run electron
