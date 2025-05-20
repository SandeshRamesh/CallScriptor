import React from 'react';

interface TranscriptDisplayProps {
  scriptLines: string[];
  highlightIdx: number;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ scriptLines, highlightIdx }) => {
  let wordCount = 0;

  return (
    <div>
      {scriptLines.map((line, lineIdx) => {
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
    </div>
  );
};