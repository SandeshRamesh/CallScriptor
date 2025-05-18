// components/ScriptDisplay.tsx
interface Props {
  lines: string[];
  highlightIdx: number;
}

export function ScriptDisplay({ lines, highlightIdx }: Props) {
  let wordCount = 0;

  return (
    <>
      {lines.map((line, lineIdx) => {
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
    </>
  );
}
