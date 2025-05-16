import React, { useEffect, useRef, useState } from 'react';
import { matchNextWords } from './utils/matchNextWords';

const fullScript = `
The quick brown fox jumps over the lazy dog.
What a wonderful day to be coding in React.
Live transcription makes this a fun challenge!
`;

// Split into lines → then into words
const scriptLines = fullScript
  .trim()
  .split('\n')
  .map(line => line.trim().replace(/[.,!?]/g, '').split(' '));

const flatScriptWords = scriptLines.flat();

export default function App() {
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [transcript, setTranscript] = useState('');
  const bufferRef = useRef('');

  useEffect(() => {
    window.electronAPI.onTranscription((newText: string) => {
      try {
        const parsed = JSON.parse(newText);
        const spokenText = parsed.partial || parsed.text || '';
        const newWords = spokenText
          .replace(/[.,!?]/g, '')
          .split(' ')
          .filter(Boolean);

        const lastWord = newWords[newWords.length - 1];
        if (!lastWord) return;

        const newIdx = matchNextWords(lastWord, flatScriptWords, highlightIdx);
        if (newIdx !== highlightIdx) {
          setHighlightIdx(newIdx);
        }

        bufferRef.current = spokenText;
        setTranscript(spokenText);
      } catch (err) {
        console.error('Failed to parse:', err);
      }
    });
  }, [highlightIdx]);

  // Track how many words we’ve highlighted so far
  let wordCount = 0;

  return (
    <div style={{ padding: 20, fontSize: 24, backgroundColor: 'black', color: 'white', minHeight: '100vh' }}>
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
