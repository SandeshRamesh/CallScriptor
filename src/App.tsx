import React, { useEffect, useRef, useState } from 'react';
import { ScriptLoader } from './components/ScriptLoader';
import { TranscriptDisplay } from './components/TranscriptDisplay';
import { Objection } from './components/Objection';
import { useTranscriptMatcher } from './hooks/useTranscriptMatcher';

interface ObjectionMatch {
  label: string;
  trigger: string;
  response: string;
}

export default function App() {
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [rawScriptLines, setRawScriptLines] = useState<string[]>([]);
  const [cleanScriptWords, setCleanScriptWords] = useState<string[]>([]);
  const [objection, setObjection] = useState<ObjectionMatch | null>(null);
  const [isScriptUploaded, setIsScriptUploaded] = useState(false); // Track script upload
  const bufferRef = useRef('');

  // Set transcript state
  const setTranscript = (text: string) => {
    console.log('Updated Transcript:', text);
  };

  // 🔁 Hook that sets up live transcription and matching logic
  useTranscriptMatcher({
    flatScriptWords: cleanScriptWords,
    setHighlightIdx,
    setTranscript, // Now this is above
    bufferRef,
  });

  // 🧠 Listen for objection match events
  useEffect(() => {
    if (window?.electronAPI?.onObjectionDetected) {
      window.electronAPI.onObjectionDetected((matchData) => {
        console.log('[DEBUG] Objection match data received in React:', matchData);
        setObjection(matchData);

        // Remove the objection after 15 seconds
        setTimeout(() => {
          setObjection(null);
        }, 20000);
      });
    } else {
      console.warn('[DEBUG] electronAPI.onObjectionDetected is not available');
    }
  }, []);

  // 📂 Handler for uploaded script data
  const handleScriptData = (data: any) => {
    setRawScriptLines(data.script_lines);
    const cleaned = data.script_lines
      .map((line: string) => line.trim().replace(/[-'.,!?]/g, '').split(' ').map((word: string) => word.trim()))
      .flat();
    setCleanScriptWords(cleaned);
    setHighlightIdx(0);
    setIsScriptUploaded(true); // Mark script as uploaded
  };

  return (
    <div style={{ padding: 20, fontSize: 24, backgroundColor: 'black', color: 'white', minHeight: '100vh' }}>
      {objection && (
        <Objection objection={objection} />
      )}

      {!isScriptUploaded && (
        <ScriptLoader onScriptData={handleScriptData} /> // Show the upload button if script is not uploaded
      )}

      {rawScriptLines.length === 0 && <p>No script loaded yet.</p>}

      <TranscriptDisplay scriptLines={rawScriptLines} highlightIdx={highlightIdx} />
    </div>
  );
}
