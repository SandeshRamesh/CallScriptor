import stringSimilarity from 'string-similarity';

export function matchNextWords(
  spokenWord: string,
  targetWords: string[],
  startIndex: number,
  windowSize = 3,
  threshold = 0.85
): number {
  for (let i = 0; i < windowSize; i++) {
    const targetWord = targetWords[startIndex + i];
    if (!targetWord) continue;

    const similarity = stringSimilarity.compareTwoStrings(
      spokenWord.toLowerCase(),
      targetWord.toLowerCase()
    );

    if (similarity >= threshold) {
      return startIndex + i + 1; // return new target index
    }
  }

  return startIndex; // no match found, don't advance
}
