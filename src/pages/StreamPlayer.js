// src/pages/StreamPlayer.js
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

// ✅ Point to your Flask backend
const socket = io("https://monitoring-w28p.onrender.com"); 

const StreamPlayer = ({ executiveId, executiveName, type }) => {
  const [imageSrc, setImageSrc] = useState("");
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!executiveId || !executiveName || !type) return;

    const matchExec = (data) =>
      data.executiveId === executiveId || data.executiveName === executiveName;

    const handleScreenData = (data) => {
      if (matchExec(data)) {
        setImageSrc(`data:image/jpeg;base64,${data.image}`);
      }
    };

    const handleVideoData = (data) => {
  if (matchExec(data) && videoRef.current) {
    try {
      const binary = atob(data.buffer); // base64 decode
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'video/webm' }); // or 'image/jpeg' if still .jpg
      videoRef.current.src = URL.createObjectURL(blob);
      videoRef.current.play();
    } catch (e) {
      console.error("Failed to decode video buffer:", e);
    }
  }
};

    const handleAudioData = (data) => {
      if (matchExec(data) && audioRef.current) {
        const blob = new Blob([data.buffer], { type: 'audio/wav' });
        audioRef.current.src = URL.createObjectURL(blob);
        audioRef.current.play();
      }
    };

    socket.on('screen-data', handleScreenData);
    socket.on('video-data', handleVideoData);
    socket.on('audio-data', handleAudioData);

    return () => {
      socket.off('screen-data', handleScreenData);
      socket.off('video-data', handleVideoData);
      socket.off('audio-data', handleAudioData);
    };
  }, [executiveId, executiveName, type]);

  if (type === "screen") {
    return (
      <div>
        <h3>Screen Stream</h3>
        <img src={imageSrc} alt="Executive Screen" width="100%" />
      </div>
    );
  }

  if (type === "video") {
    return (
      <div>
        <h3>Video Stream</h3>
        <video ref={videoRef} width="100%" autoPlay controls />
      </div>
    );
  }

  if (type === "audio") {
    return (
      <div>
        <h3>Audio Stream</h3>
        <audio ref={audioRef} controls autoPlay />
      </div>
    );
  }

  return <p>Select a stream type</p>;
};

export default StreamPlayer;
