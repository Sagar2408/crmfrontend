import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useApi } from "../../context/ApiContext";
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';

function convertTo24HrFormat(timeStr) {
  const dateObj = new Date(`1970-01-01 ${timeStr}`);
  const hours = dateObj.getHours().toString().padStart(2, "0");
  const minutes = dateObj.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}:00`; // valid for MySQL TIME
}

const ClientDetailsOverview = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { followUpHistories, fetchFollowUpHistoriesAPI, updateFollowUp, createConvertedClientAPI, createCloseLeadAPI } = useApi();
  
  const client = location.state?.client || {};
  
  const [clientInfo, setClientInfo] = useState(client);
  const [contactMethod, setContactMethod] = useState("");
  const [followUpType, setFollowUpType] = useState("");
  const [interactionRating, setInteractionRating] = useState("");
  const [reasonDesc, setReasonDesc] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(null); // For handling speech recognition errors
  const [interactionDate, setInteractionDate] = useState("");
  const now = new Date();
  const defaultTime = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const [interactionTime, setInteractionTime] = useState(defaultTime);
  const [histories, setHistories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(isListening);

  const clientFields = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "altPhone", label: "Alt Phone" },
    { key: "education", label: "Education" },
    { key: "experience", label: "Experience" },
    { key: "state", label: "State" },
    { key: "dob", label: "Date of Birth" },
    { key: "country", label: "Country" },
    { key: "assignDate", label: "Assign Date" },
  ];
  
  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Continuous listening
      recognitionRef.current.interimResults = true; // Show interim results
      recognitionRef.current.lang = 'en-US'; // Set language to English

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setReasonDesc((prev) => prev + finalTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        setSpeechError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
        console.error("Speech recognition error:", event.error);
      };

      recognitionRef.current.onend = () => {
        if (isListeningRef.current) {
          recognitionRef.current.start(); // Restart if still listening
        }
      };
    } else {
      setSpeechError("Speech recognition is not supported in this browser.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (client) {
      const freshLeadId = client.freshLead && client.freshLead.id 
        ? client.freshLead.id 
        : client.fresh_lead_id || client.id;
        
      const normalizedClient = {
        ...client,
        fresh_lead_id: freshLeadId,
        followUpId: client.followUpId || client.id, 
      };
      setClientInfo(normalizedClient);
      
      loadFollowUpHistories(freshLeadId);
    }
  }, [client]);
  
  const loadFollowUpHistories = async (freshLeadId) => {
    if (!freshLeadId) return;
    
    setIsLoading(true);
    try {
      const response = await fetchFollowUpHistoriesAPI(freshLeadId);
      console.log("Follow-up histories:", response);
      
      if (response && Array.isArray(response)) {
        setHistories(response);
        
        if (response.length > 0) {
          const latestHistory = response[0];
          populateFormWithHistory(latestHistory);
        }
      }
    } catch (error) {
      console.error("Error fetching follow-up histories:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const populateFormWithHistory = (history) => {
    if (!history) return;
    
    const method = history.connect_via ? history.connect_via.toLowerCase() : "";
    setContactMethod(method);
    
    setFollowUpType(history.follow_up_type || "");
    
    const rating = history.interaction_rating ? history.interaction_rating.toLowerCase() : "";
    setInteractionRating(rating);
    
    setReasonDesc(history.reason_for_follow_up || "");
    
    setInteractionDate(history.follow_up_date || "");
    setInteractionTime(history.follow_up_time || "");
  };
  
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const handleChange = (field, value) => {
    setClientInfo((prev) => ({ ...prev, [field]: value }));
  };

  const capitalize = (text) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const handleTextUpdate = () => {  
    const updatedData = {
      connect_via: capitalize(contactMethod),
      follow_up_type: followUpType,
      interaction_rating: capitalize(interactionRating),
      reason_for_follow_up: reasonDesc,
      follow_up_date: interactionDate,
      follow_up_time: convertTo24HrFormat(interactionTime),
      fresh_lead_id: clientInfo.fresh_lead_id || clientInfo.freshLeadId || clientInfo.leadId || clientInfo.id,
    };
  
    const followUpId = clientInfo.followUpId || clientInfo.id;
  
    if (!followUpId || !updatedData.fresh_lead_id) {
      alert("Missing follow-up ID or fresh lead ID.");
      return;
    }  
    
    updateFollowUp(followUpId, updatedData)
      .then((response) => {
        alert("Follow-up updated successfully!");
        loadFollowUpHistories(updatedData.fresh_lead_id);
        setTimeout(() => {
          navigate('/follow-up');
        }, 2000);
      })
      .catch((error) => {
        console.error("Error updating Follow-up:", error);
        alert("Failed to update follow-up.");
      });
  };  
  
  const handleConvertedOrClose = async () => {
    if (followUpType === "converted") {
      try {
        if (!clientInfo.fresh_lead_id) {
          alert("Fresh Lead ID is missing. Please ensure the lead exists.");
          return;
        }        
        const convertedPayload = {
          fresh_lead_id: clientInfo.fresh_lead_id,
        };
  
        const response = await createConvertedClientAPI(convertedPayload);
        alert("Converted client created successfully!");
        loadFollowUpHistories(clientInfo.fresh_lead_id);
        setTimeout(() => {
          navigate('/follow-up');
        }, 2000);
      } catch (error) {
        console.error("❌ Error creating converted client:", error);
        alert("Failed to create converted client. Ensure the lead exists.");
      }
    } else if (followUpType === "close") {
      try {
        if (!clientInfo.fresh_lead_id) {
          alert("Fresh Lead ID is missing. Please ensure the lead exists.");
          return;
        }

        const closeLeadPayload = { fresh_lead_id: clientInfo.fresh_lead_id };
        const response = await createCloseLeadAPI(closeLeadPayload); 
        alert("Close lead created successfully!");
        loadFollowUpHistories(clientInfo.fresh_lead_id);
        setTimeout(() => {
          navigate('/follow-up');
        }, 2000);
      } catch (error) {
        console.error("❌ Error creating close lead:", error);
        alert("Failed to create close lead.");
      }
    }
  };  

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use a supported browser like Google Chrome.");
      return;
    }
    setSpeechError(null); // Clear any previous errors
    if (isListening) {
      stopListening();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        setSpeechError("Failed to start speech recognition. Please try again.");
        console.error("Error starting speech recognition:", error);
      }
    }
  };

  const stopListening = () => {
    setIsListening(false);
    recognitionRef.current?.stop();
  };

  return (
    <div className="client-overview-wrapper">
      {/* Client Details */}
      <div className="c-container">
        <div className="c-header">
          <h2>Client Details</h2>
          <button className="c-button">×</button>
        </div>
        <div className="c-content">
          <div className="c-layout">
            <div className="client-info-column">
              <div className="c-profile">
                <div className="c-info">
                  {clientFields.map(({ key, label }) => (
                    <div className="info-item" key={key}>
                      <span className="label">{label} -</span>
                      <span
                        className="value"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleChange(key, e.target.innerText)}
                      >
                        {clientInfo[key] || ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="follow-up-column">
              <div className="last-follow-up">
                <h3>Last Follow-up</h3>
                {isLoading ? (
                  <p>Loading follow-up history...</p>
                ) : histories.length > 0 ? (
                  <p>{histories[0].reason_for_follow_up || "No description available."}</p>
                ) : (
                  <p>No follow-up history available.</p>
                )}
              </div>
              
              {histories.length > 0 && (
                <div className="follow-up-history-summary">
                  <h4>Previous Follow-ups</h4>
                  <div className="history-list" style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {histories.slice(1).map((history, index) => (
                      <div key={index} className="history-item" style={{ marginBottom: "10px", padding: "5px", borderBottom: "1px solid #eee" }}>
                        <p><strong>{new Date(history.follow_up_date).toLocaleDateString()} - {history.follow_up_time}</strong></p>
                        <p>{history.reason_for_follow_up}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Client Interaction */}
      <div className="client-interaction-container">
        <div className="interaction-form">
          <div className="connected-via">
            <h4>Connected Via</h4>
            <div className="radio-group">
              {["call", "email", "whatsapp"].map((method) => (
                <label key={method} className="radio-container">
                  <input
                    type="radio"
                    name="contactMethod"
                    checked={contactMethod === method}
                    onChange={() => setContactMethod(method)}
                  />
                  <span className="radio-label">
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="follow-up-type">
            <h4>Follow-Up Type</h4>
            <div className="radio-group">
              {[
                "interested",
                "appointment",
                "no response",
                "converted",
                "not interested",
                "close",
              ].map((type) => (
                <label key={type} className="radio-container">
                  <input
                    type="radio"
                    name="followUpType"
                    checked={followUpType === type}
                    onChange={() => setFollowUpType(type)}
                  />
                  <span className="radio-label">{type.replace("-", " ")}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="interaction-rating">
            <h4>Interaction Rating</h4>
            <div className="radio-group">
              {["hot", "warm", "cold"].map((rating) => (
                <label key={rating} className="radio-container">
                  <input
                    type="radio"
                    name="interactionRating"
                    checked={interactionRating === rating}
                    onChange={() => setInteractionRating(rating)}
                  />
                  <span className="radio-label">
                    {rating.charAt(0).toUpperCase() + rating.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Follow-Up Detail */}
      <div className="followup-detail-theme">
        <div className="followup-detail-container">
          <h2>Follow-Up Details</h2>
          <div className="follow-up-reason">
            <h3>Reason for Follow-Up</h3>
            <div className="interaction-field">
              <label>Interaction Description:</label>
              <div className="textarea-with-speech">
                <textarea
                  value={reasonDesc}
                  onChange={(e) => setReasonDesc(e.target.value)}
                  className="interaction-textarea"
                  placeholder="Describe the follow-up reason..."
                />
                <button
                  type="button"
                  className={`speech-btn ${isListening ? "listening" : ""}`}
                  onClick={toggleListening}
                  aria-label={isListening ? "Stop recording" : "Start recording"}
                >
                  {isListening ? "⏹" : "🎤"}
                </button>
              </div>
              {speechError && (
                <p style={{ color: "red", marginTop: "5px" }}>{speechError}</p>
              )}

              <div className="interaction-datetime" style={{ marginTop: "20px" }}>
                <h4>Interaction Schedule and Time</h4>
                <div style={{ display: "flex", gap: "10px" }}>
                  <div>
                    <label style={{ fontWeight: "400" }}>Date:</label>
                    <input
                      type="date"
                      value={interactionDate}
                      onChange={(e) => setInteractionDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: "400" }}>Time:</label>
                    <TimePicker
                      onChange={setInteractionTime}
                      value={interactionTime}
                      format="hh:mm a"
                      disableClock={true}       
                      clearIcon={null}          
                    />
                  </div>
                </div>
              </div>

              <div className="button-group" style={{ marginTop: "20px" }}>
                <button
                  onClick={handleTextUpdate}
                  className="crm-button update-follow-btn"
                >
                  Update Follow-Up
                </button>
                {(followUpType === "converted" || followUpType === "close") && (
                  <button
                    onClick={handleConvertedOrClose}
                    className="crm-button converted-btn"
                  >
                    {followUpType === "converted" ? "Create Converted" : "Create Close"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsOverview;