import React from 'react';

interface ScriptLoaderProps {
  onScriptData: (data: any) => void;
}

export const ScriptLoader: React.FC<ScriptLoaderProps> = ({ onScriptData }) => {
  const handleFileChoose = async () => {
    console.log('[Upload] Starting file dialog...');
    const filePath = await window.electronAPI.chooseFile();
    if (!filePath) {
      console.warn('[Upload] No file selected.');
      return;
    }

    const rawData = await window.electronAPI.parseSalesScript(filePath);
    let data;

    try {
      data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      console.log('[Upload] Parsed JSON:', data);
      onScriptData(data);
    } catch (err) {
      console.error('[Error] Failed to parse script JSON:', err);
      alert('Invalid script file format.');
    }
  };

  return (
    <div>
      <button onClick={handleFileChoose}>Upload Script File</button>
    </div>
  );
};
