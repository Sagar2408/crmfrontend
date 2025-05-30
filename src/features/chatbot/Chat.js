import React, { useState, useEffect, useRef } from "react";
import { FaMicrophone, FaPaperPlane, FaUser, FaStopCircle } from "react-icons/fa";
import { MdSmartToy } from "react-icons/md";
import { BsRecordCircle } from "react-icons/bs"; // for record button

const Chat = ({ isCallActive }) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // --- ADDED ---
  const [recordTime, setRecordTime] = useState(0); // --- ADDED ---

  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const wakeWordRecognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null); // --- ADDED ---
  const recordChunksRef = useRef([]); // --- ADDED ---
  const timerRef = useRef(null); // --- ADDED ---

  useEffect(() => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [messages]);

  const stopWakeWordRecognition = () => {
    if (wakeWordRecognitionRef.current) {
      wakeWordRecognitionRef.current.abort();
      wakeWordRecognitionRef.current.onend = null;
      wakeWordRecognitionRef.current = null;
    }
  };

  const startWakeWordListening = () => {
    if (isListening || isCallActive) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || wakeWordRecognitionRef.current) return;

    wakeWordRecognitionRef.current = new SpeechRecognition();
    wakeWordRecognitionRef.current.lang = "en-US";
    wakeWordRecognitionRef.current.continuous = true;

    wakeWordRecognitionRef.current.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      if (transcript.includes("hello") || transcript.includes("how can i help you")) {
        stopWakeWordRecognition();
        startSpeechRecognition();
      }
    };

    wakeWordRecognitionRef.current.onerror = (event) => {
      console.error("Wake word recognition error:", event.error);
    };

    wakeWordRecognitionRef.current.onend = () => {
      if (!isListening && !isCallActive) {
        setTimeout(startWakeWordListening, 2000);
      }
    };

    try {
      wakeWordRecognitionRef.current.start();
    } catch (error) {
      console.warn("Wake word start error:", error);
    }
  };

  useEffect(() => {
    startWakeWordListening();
  }, []);

  const handleMicClick = () => {
    isListening ? stopSpeechRecognition() : startSpeechRecognition();
  };

  const startSpeechRecognition = () => {
    stopWakeWordRecognition();
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported.");
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onstart = () => setIsListening(true);

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      setUserInput(transcript);
      if (event.results[event.results.length - 1].isFinal) {
        handleSend(transcript);
      }
    };

    recognitionRef.current.onerror = (event) => console.error("Speech error:", event.error);

    recognitionRef.current.onend = () => {
      if (!isCallActive) recognitionRef.current.start();
    };

    recognitionRef.current.start();
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current.onend = null;
      recognitionRef.current = null;
    }
    setIsListening(false);
    startWakeWordListening();
  };

  const handleSend = async (input) => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { text: input, isUser: true }]);
    setUserInput("");
    setIsTyping(true);

    try {
      const response = await fetch("https://crmbackend-yho0.onrender.com/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed");
      setMessages((prev) => [...prev, { text: data.message, isUser: false }]);
    } catch (err) {
      console.error("Error:", err);
      setMessages((prev) => [...prev, { text: "Error: Unable to get response.", isUser: false }]);
    } finally {
      setIsTyping(false);
    }
  };

  // --- AUDIO RECORDING SECTION ---

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) recordChunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(recordChunksRef.current, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `call_recording_${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
          recordChunksRef.current = [];
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        setRecordTime(0);
        timerRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
        console.log("Recording started...");
      } catch (err) {
        console.error("Error starting recording:", err);
      }
    } else {
      mediaRecorderRef.current?.stop();
      clearInterval(timerRef.current);
      setIsRecording(false);
      setRecordTime(0);
      console.log("Recording stopped.");
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-header">
          <MdSmartToy size={30} className="chat-icon" />
          <h2>AI ChatBot</h2>
        </div>

        <div className="chat-messages" ref={chatContainerRef}>
          {messages.map((msg, index) => (
            <div className="message-row" key={index}>
              <div className="bot-side">
                {!msg.isUser ? (
                  <div className="message bot-message">
                    <MdSmartToy className="bot-icon" />
                    <div className="message-content">{msg.text}</div>
                  </div>
                ) : (
                  <div className="empty-placeholder" />
                )}
              </div>
              <div className="user-side">
                {msg.isUser ? (
                  <div className="message user-message">
                    <FaUser className="user-icon" />
                    <div className="message-content">{msg.text}</div>
                  </div>
                ) : (
                  <div className="empty-placeholder" />
                )}
              </div>
            </div>
          ))}

          {isTyping && <div className="typing-indicator">...</div>}
        </div>

        <div className="chat-input-container">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message..."
          />
          <button onClick={() => handleSend(userInput)} className="send-button">
            <FaPaperPlane />
          </button>
          <button onClick={handleMicClick} className={`mic-button ${isListening ? "active" : ""}`}>
            <FaMicrophone />
          </button>
          <button onClick={toggleRecording} className={`record-button ${isRecording ? "active" : ""}`}>
            {isRecording ? <FaStopCircle /> : <BsRecordCircle />}
          </button>
        </div>

        {isRecording && (
          <div style={{ textAlign: "center", color: "red", marginTop: "5px" }}>
            Recording Time: {recordTime}s
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
