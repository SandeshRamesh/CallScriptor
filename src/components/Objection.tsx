import React from 'react';

interface ObjectionMatch {
  label: string;
  trigger: string;
  response: string;
}

interface ObjectionProps {
  objection: ObjectionMatch | null;
}

export const Objection: React.FC<ObjectionProps> = ({ objection }) => {
  if (!objection) return null;

  return (
  <div style={{ marginTop: 20, padding: 10, backgroundColor: 'black', border: 'none' }}>
    <h2 style={{ color: 'red', fontSize: '24px' }}>Objection Detected: {objection.label}</h2>
    <p style={{ color: 'white', fontSize: '24px' }}>{objection.response}</p>
  </div>

  );
};