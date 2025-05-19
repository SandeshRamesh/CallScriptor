import { useEffect, useRef } from 'react';
import { matchNextWords } from '../utils/matchNextWords';

interface UseTranscriptMatcherParams {
  flatScriptWords: string[];
  setHighlightIdx: (idx: number) => void;
  setTranscript: (text: string) => void;
  bufferRef: React.MutableRefObject<string>;
}

export function useTranscriptMatcher({
  flatScriptWords,
  setHighlightIdx,
  setTranscript,
  bufferRef
}: UseTranscriptMatcherParams) {
  const maxHighlightRef = useRef(0);

  useEffect(() => {
    console.log('[Init] Setting up transcription listener');

    window.electronAPI.onTranscription((newText: string) => {
      //console.log('[Transcription Event] Raw input:', newText);

      try {
        const parsed = JSON.parse(newText);
        const spokenText = parsed.partial || parsed.text || '';
        //console.log('[Parsed Transcription]', spokenText);

        const newWords = spokenText
          .replace(/[-'.,!?]/g, '') // include hyphens and apostrophes
          .split(' ')
          .filter(Boolean);

        const lastWord = newWords[newWords.length - 1];
        if (!lastWord) return;

        const newIdx = matchNextWords(lastWord, flatScriptWords, maxHighlightRef.current);
        console.log(`[Matcher] Last word: "${lastWord}" → idx: ${newIdx} (current: ${maxHighlightRef.current})`);

        if (newIdx > maxHighlightRef.current) {
          maxHighlightRef.current = newIdx;
          setHighlightIdx(newIdx);
          console.log(`[Highlight ✅] Advanced to ${newIdx}`);
        } else {
          console.log(`[Highlight ⛔️] Ignored regression or duplicate (current: ${maxHighlightRef.current}, proposed: ${newIdx})`);
        }

        bufferRef.current = spokenText;
        setTranscript(spokenText);
      } catch (err) {
        console.error('[Error] Failed to parse transcription JSON:', err);
      }
    });
  }, [flatScriptWords]);
}
