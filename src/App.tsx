import React, { useEffect, useRef, useState } from 'react';
import { useTranscriptMatcher } from './hooks/useTranscriptMatcher';
import { matchNextWords } from './utils/matchNextWords';

interface ObjectionMatch {
  label: string;
  trigger: string;
  response: string;
}

export default function App() {
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [rawScriptLines, setRawScriptLines] = useState<string[]>([]);
  const [cleanScriptWords, setCleanScriptWords] = useState<string[]>([]);
  const [objection, setObjection] = useState<ObjectionMatch | null>(null);
  const bufferRef = useRef('');

  // 🔁 Hook that sets up live transcription and matching logic
  useTranscriptMatcher({
    flatScriptWords: cleanScriptWords,
    setHighlightIdx,
    setTranscript,
    bufferRef,
  });

  // 🧠 Listen for objection match events
  useEffect(() => {

    console.log('[DEBUG] useEffect running');

    if (window?.electronAPI?.onObjectionDetected) {
    //console.log('[DEBUG] onObjectionDetected available');

    window.electronAPI.onObjectionDetected((matchData) => {
      console.log('[DEBUG] Objection match data received in React:', matchData);  // Debug log
      setObjection(matchData);
    });

  } else {
    console.warn('[DEBUG] electronAPI.onObjectionDetected is not available');
  }
}, []);

  // 📂 Upload Handler
  const handleFileChoose = async () => {
    console.log('[Upload] Starting file dialog...');
    const filePath = await window.electronAPI.chooseFile();
    if (!filePath) {
      console.warn('[Upload] No file selected.');
      return;
    }

    const rawData = await window.electronAPI.parseSalesScript(filePath);
    let data;

    try {
      data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      console.log('[Upload] Parsed JSON:', data);
    } catch (err) {
      console.error('[Error] Failed to parse script JSON:', err);
      alert('Invalid script file format.');
      return;
    }

    if (!data.script_lines || data.script_lines.length === 0) {
      alert('No script lines found in file.');
      setRawScriptLines([]);
      setCleanScriptWords([]);
      return;
    }

    setRawScriptLines(data.script_lines);

    const cleaned = data.script_lines
      .map((line: string) =>
        line.trim().replace(/[-'.,!?]/g, '').split(' ').map((word: string) => word.trim())
      )
      .flat();

    setCleanScriptWords(cleaned);
    setHighlightIdx(0);
  };

  // 🖋️ UI Rendering
  let wordCount = 0;

  return (
    <div style={{ padding: 20, fontSize: 24, backgroundColor: 'black', color: 'white', minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <button onClick={handleFileChoose}>Upload Script File</button>
      </div>

      {rawScriptLines.length === 0 && <p>No script loaded yet.</p>}

      {rawScriptLines.map((line, lineIdx) => {
        const words = line.trim().split(' ');
        return (
          <div key={lineIdx} style={{ marginBottom: 12 }}>
            {words.map((word, wordIdx) => {
              const globalIdx = wordCount++;
              return (
                <span
                  key={wordIdx}
                  style={{
                    marginRight: 8,
                    color: globalIdx < highlightIdx ? 'white' : 'gray',
                  }}
                >
                  {word}
                </span>
              );
            })}
          </div>
        );
      })}

      {/* Objection Debug */}
      {objection && (
        <div style={{ marginTop: 40, padding: 20, backgroundColor: '#222', border: '1px solid #555' }}>
          <h2 style={{ color: 'red' }}>Objection Detected: {objection.label}</h2>
          <p style={{ color: 'white' }}>{objection.response}</p>
        </div>
      )}
    </div>
  );
}
