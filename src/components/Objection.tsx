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
    <div style={{ marginTop: 40, padding: 20, backgroundColor: '#222', border: '1px solid #555' }}>
      <h2 style={{ color: 'red' }}>Objection Detected: {objection.label}</h2>
      <p style={{ color: 'white' }}>{objection.response}</p>
    </div>
  );
};
