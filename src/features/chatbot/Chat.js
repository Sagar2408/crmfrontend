// --- NO CHANGE REQUIRED IN IMPORTS ---
import React, { useState, useEffect, useRef } from "react";
import { FaMicrophone, FaPaperPlane, FaUser, FaStopCircle } from "react-icons/fa";
import { MdSmartToy } from "react-icons/md";
import { BsRecordCircle } from "react-icons/bs";
import { jwtDecode } from "jwt-decode";

// Token from URL
const token = new URLSearchParams(window.location.search).get("token");

let executiveId = null;
let executiveName = null;

if (token) {
  try {
    const decoded = jwtDecode(token);
    executiveId = decoded.id;
    executiveName = decoded.name;
    console.log("✅ Executive identified:", executiveId, executiveName);
  } catch (err) {
    console.error("❌ Invalid token:", err);
  }
} else {
  console.warn("⚠️ No token found in URL");
}

const Chat = ({ isCallActive }) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);

  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async (input) => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { text: input, isUser: true }]);
    setUserInput("");
    setIsTyping(true);

    try {
      const response = await fetch("https://crmbackend-yho0.onrender.com/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-company-id": "f515cb0e-450f-11f0-bcd7-a2aa1a8f1119"
        },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch response");
      setMessages((prev) => [...prev, { text: data.message, isUser: false }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { text: "Error: Unable to get response.", isUser: false }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) recordChunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          const blob = new Blob(recordChunksRef.current, { type: "audio/webm" });
          const fileName = `call_recording_${Date.now()}.webm`;
          const fakePath = `C:/Users/${executiveName}/Downloads/${fileName}`;

          // Download
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);

          // 📤 Send metadata
          if (executiveId && executiveName) {
            const storedClient = JSON.parse(localStorage.getItem("activeClient") || "{}");
            const clientName = storedClient.name || "Unknown";
            const clientPhone = storedClient.phone || "0000000000";
            const now = new Date();
            const callEndTime = now.toISOString();
            const callStartTime = new Date(now.getTime() - recordTime * 1000).toISOString();

            const formData = new FormData();
            formData.append("executiveId", executiveId); // ✅ send it!
            formData.append("duration", recordTime);
            formData.append("clientName", clientName);
            formData.append("clientPhone", clientPhone);
            formData.append("callStartTime", callStartTime);
            formData.append("callEndTime", callEndTime);
            formData.append("recordingPath", fakePath);

            try {
              const res = await fetch("https://crmbackend-yho0.onrender.com/api/calldetails", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "x-company-id": "f515cb0e-450f-11f0-bcd7-a2aa1a8f1119"
                },
                body: formData
              });

              const data = await res.json();
              console.log("✅ Uploaded to backend:", data);
            } catch (err) {
              console.error("❌ Upload failed:", err);
            }
          }

          recordChunksRef.current = [];
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        setRecordTime(0);
        timerRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
      } catch (err) {
        console.error("Error accessing mic:", err);
      }
    } else {
      mediaRecorderRef.current?.stop();
      clearInterval(timerRef.current);
      setIsRecording(false);
      setRecordTime(0);
    }
  };

  const handleMicClick = () => {
    if (isListening) stopSpeechRecognition();
    else startSpeechRecognition();
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported.");
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "en-US";
    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onresult = (event) => {
      let transcript = event.results[event.results.length - 1][0].transcript.trim();
      setUserInput(transcript);
      if (event.results[event.results.length - 1].isFinal) handleSend(transcript);
    };
    recognitionRef.current.onerror = (e) => console.error("Speech error:", e.error);
    recognitionRef.current.onend = () => {
      if (!isCallActive && isListening) recognitionRef.current.start();
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
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(userInput);
              }
            }}
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
