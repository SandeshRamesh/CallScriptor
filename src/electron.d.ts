export {};

declare global {
  interface Window {
    electronAPI: {
      onTranscription: (callback: (text: string) => void) => void;
    };
  }
}
