declare module 'string-similarity' {
  function compareTwoStrings(a: string, b: string): number;
  function bestMatch(a: string, b: string[]): { bestMatch: { target: string; rating: number }; ratings: { [key: string]: number } };
  
  export { compareTwoStrings, bestMatch };
}
