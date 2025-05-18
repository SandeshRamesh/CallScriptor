export {};

declare global {
  interface Window {
    electronAPI: {
      onTranscription: (callback: (text: string) => void) => void;
      parseSalesScript: (filePath: string) => Promise<any>;
      chooseFile: () => Promise<string | null>; // 🆕 add this
    };
  }
}
