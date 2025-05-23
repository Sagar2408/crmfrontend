// src/pages/StreamPlayer.js
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io("https://monitoring-w28p.onrender.com");

const StreamPlayer = ({ executiveId, executiveName, type }) => {
  const [imageSrc, setImageSrc] = useState("");
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
      if (matchExec(data)) {
        setImageSrc(`data:image/jpeg;base64,${data.buffer}`);
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
        <img src={imageSrc} alt="Executive Webcam" width="100%" />
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
