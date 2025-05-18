import React, { useEffect, useRef, useState } from 'react';
import { matchNextWords } from './utils/matchNextWords';

export default function App() {
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [transcript, setTranscript] = useState('');
  const bufferRef = useRef('');
  //const [rawScriptLines, setRawScriptLines] = useState<string[][]>([]);
  const [scriptLines, setScriptLines] = useState<string[][]>([]);
  const flatScriptWords = scriptLines.flat();
  const maxHighlightRef = useRef(0);

  // 🔁 Transcription Listener
useEffect(() => {
  console.log('[Init] Setting up transcription listener');

  window.electronAPI.onTranscription((newText: string) => {
    console.log('[Transcription Event] Raw input:', newText);

    try {
      const parsed = JSON.parse(newText);
      const spokenText = parsed.partial || parsed.text || '';
      console.log('[Parsed Transcription]', spokenText);

      const newWords = spokenText
        .replace(/[-'.,!?]/g, '') // include hyphens and apostrophes
        .split(' ')
        .filter(Boolean);

      const lastWord = newWords[newWords.length - 1];
      if (!lastWord) return;

      const newIdx = matchNextWords(lastWord, flatScriptWords, highlightIdx);
      console.log(`[Matcher] Last word: "${lastWord}" → idx: ${newIdx} (current: ${highlightIdx})`);

      if (newIdx > maxHighlightRef.current) {
        maxHighlightRef.current = newIdx;
        setHighlightIdx(newIdx);
        console.log(`[Highlight ✅] Advanced to ${newIdx}`);
      } else {
        console.log(`[Highlight ⛔️] Ignored regression or duplicate (current: ${highlightIdx}, proposed: ${newIdx})`);
      }

      bufferRef.current = spokenText;
      setTranscript(spokenText);
    } catch (err) {
      console.error('[Error] Failed to parse transcription JSON:', err);
    }
  });
}, [flatScriptWords]); // 🔁 Only depends on words — not highlightIdx

  // 📂 Upload Handler
  const handleFileChoose = async () => {
    console.log('[Upload] Starting file dialog...');
    const filePath = await window.electronAPI.chooseFile();
    if (!filePath) {
      console.warn('[Upload] No file selected.');
      return;
    }

    console.log('[Upload] Selected path:', filePath);
    await window.electronAPI.parseSalesScript(filePath).then((rawData) => {
      console.log('[Upload] Raw script data:', rawData);

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
        console.warn('[Upload] No script lines found.');
        alert('No script lines found in file.');
        setScriptLines([]);
        return;
      }

    //setRawScriptLines(data.script_lines);

    const newLines = data.script_lines.map((line: string) =>
     line.trim().replace(/[]/g, '').split(' ').map(word => word.trim())
    );


      console.log('[Upload] Script loaded successfully.');
      setScriptLines(newLines);
      setHighlightIdx(0); // reset highlight index on new script
    });
  };

  useEffect(() => {
  if (scriptLines.length > 0) {
    const flatScriptWords = scriptLines.flat();
    console.log('[Script Ready] flatScriptWords:', flatScriptWords.slice(0, 10));
  }
}, [scriptLines]);

  // 🖋️ UI Rendering
  let wordCount = 0;

  return (
    <div style={{ padding: 20, fontSize: 24, backgroundColor: 'black', color: 'white', minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <button onClick={handleFileChoose}>Upload Script File</button>
      </div>

      {scriptLines.length === 0 && <p>No script loaded yet.</p>}

      {scriptLines.map((line, lineIdx) => (
        <div key={lineIdx} style={{ marginBottom: 12 }}>
          {line.map((word, wordIdx) => {
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
      ))}
    </div>
  );
}
