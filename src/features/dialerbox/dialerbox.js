import React, { useEffect, useState } from 'react';
import { useCall } from '../context/CallContext'; // 🔄 Global call state

const DialerBox = () => {
  const { dialingPhone, stopCall } = useCall();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!dialingPhone) return;
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [dialingPhone]);

  if (!dialingPhone) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#ffffff',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      zIndex: 9999,
      minWidth: '240px'
    }}>
      <p style={{ fontWeight: 'bold', margin: 0 }}>📞 Call with: {dialingPhone}</p>
      <p style={{ fontSize: '14px', margin: '6px 0 12px' }}>
        Duration: {String(Math.floor(seconds / 60)).padStart(2, '0')}:
        {String(seconds % 60).padStart(2, '0')}
      </p>
      <button
        onClick={stopCall}
        style={{
          padding: '8px 16px',
          backgroundColor: '#dc2626',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Hang Up
      </button>
    </div>
  );
};

export default DialerBox;
