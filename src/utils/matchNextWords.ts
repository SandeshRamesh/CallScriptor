import stringSimilarity from 'string-similarity';

export function matchNextWords(
  spokenWord: string,
  targetWords: string[],
  startIndex: number,
  windowSize = 7,
  threshold = 0.7
): number {
  const lowerSpoken = spokenWord.toLowerCase();

  for (let i = 0; i < windowSize; i++) {
    const compareIdx = startIndex + i;
    const targetWord = targetWords[compareIdx];
    //console.log(`[Matcher] Comparing "${lowerSpoken}" with "${targetWord}" at index ${compareIdx}`);
    if (!targetWord) continue;


    const similarity = stringSimilarity.compareTwoStrings(
      lowerSpoken,
      targetWord.toLowerCase()
    );

    //console.log(`[Matcher] Comparing "${lowerSpoken}" ↔ "${targetWord.toLowerCase()}" = ${similarity.toFixed(2)}`);

    if (similarity >= threshold) {
      console.log(`[Matcher ✅] Match at index ${compareIdx} → advancing to ${compareIdx + 1}`);
      return compareIdx + 1;
    }
  }

  console.log(`[Matcher ❌] No match found for "${spokenWord}"`);
  return startIndex;
}
