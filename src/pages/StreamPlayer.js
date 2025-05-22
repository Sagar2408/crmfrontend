// src/pages/StreamPlayer.js
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io("https://crmbackend-yho0.onrender.com"); // ✅ Update if .env used

const StreamPlayer = ({ executiveId, type }) => {
  const [imageSrc, setImageSrc] = useState("");
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!executiveId || !type) return;

    const handleScreenData = (data) => {
      if (data.executiveId === executiveId) {
        setImageSrc(`data:image/jpeg;base64,${data.image}`);
      }
    };

    const handleVideoData = (data) => {
      if (data.executiveId === executiveId && videoRef.current) {
        const blob = new Blob([data.buffer], { type: 'video/webm' });
        videoRef.current.src = URL.createObjectURL(blob);
        videoRef.current.play();
      }
    };

    const handleAudioData = (data) => {
      if (data.executiveId === executiveId && audioRef.current) {
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
  }, [executiveId, type]);

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
