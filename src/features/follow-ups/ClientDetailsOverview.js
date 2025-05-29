import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useApi } from "../../context/ApiContext";
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';

// Utility function to convert time to 24-hour format for MySQL
function convertTo24HrFormat(timeStr) {
  const dateObj = new Date(`1970-01-01 ${timeStr}`);
  const hours = dateObj.getHours().toString().padStart(2, "0");
  const minutes = dateObj.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}:00`;
}

// Utility function to format dates for display
function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Utility function to validate date input
function validateDate(dateStr) {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

// Utility function to validate time input
function validateTime(timeStr) {
  const regex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;
  return regex.test(timeStr);
}

const ClientDetailsOverview = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { followUpHistories, fetchFollowUpHistoriesAPI, updateFollowUp, createConvertedClientAPI, createCloseLeadAPI } = useApi();

  const client = location.state?.client || {};

  // State variables for managing client info, form inputs, and UI states
  const [clientInfo, setClientInfo] = useState(client);
  const [contactMethod, setContactMethod] = useState("");
  const [followUpType, setFollowUpType] = useState("");
  const [interactionRating, setInteractionRating] = useState("");
  const [reasonDesc, setReasonDesc] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(null);
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
  const [isEditing, setIsEditing] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(isListening);

  // Client fields for display
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

  // Contact method options
  const contactMethods = ["call", "email", "whatsapp"];

  // Follow-up type options
  const followUpTypes = [
    "interested",
    "appointment",
    "no response",
    "converted",
    "not interested",
    "close",
  ];

  // Interaction rating options
  const interactionRatings = ["hot", "warm", "cold"];

  // Speech Recognition Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

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
        setErrorMessage("");
      };

      recognitionRef.current.onerror = (event) => {
        setSpeechError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
        console.error("Speech recognition error:", event.error);
        setErrorMessage("Speech recognition failed. Please try again or type manually.");
      };

      recognitionRef.current.onend = () => {
        if (isListeningRef.current) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error("Error restarting speech recognition:", error);
            setSpeechError("Failed to restart speech recognition.");
            setIsListening(false);
          }
        }
      };
    } else {
      setSpeechError("Speech recognition is not supported in this browser.");
      setErrorMessage("Speech recognition is not supported. Please type the description.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Load client info and follow-up histories
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
      setLastUpdated(new Date().toLocaleString());
      loadFollowUpHistories(freshLeadId);
    }
  }, [client]);

  // Fetch follow-up histories
  const loadFollowUpHistories = async (freshLeadId) => {
    if (!freshLeadId) {
      setErrorMessage("Invalid lead ID. Unable to fetch follow-up history.");
      return;
    }
    
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
        setSuccessMessage("Follow-up history loaded successfully.");
      } else {
        setErrorMessage("No follow-up history found for this client.");
      }
    } catch (error) {
      console.error("Error fetching follow-up histories:", error);
      setErrorMessage("Failed to fetch follow-up history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Populate form with latest history
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

  // Sync listening state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Handle client info changes
  const handleChange = (field, value) => {
    setClientInfo((prev) => ({ ...prev, [field]: value }));
    setLastUpdated(new Date().toLocaleString());
  };

  // Capitalize text for consistency
  const capitalize = (text) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  // Validate form inputs
  const validateForm = () => {
    const errors = {};
    if (!contactMethod) errors.contactMethod = "Please select a contact method.";
    if (!followUpType) errors.followUpType = "Please select a follow-up type.";
    if (!interactionRating) errors.interactionRating = "Please select an interaction rating.";
    if (!reasonDesc.trim()) errors.reasonDesc = "Please provide a reason for follow-up.";
    if (!interactionDate || !validateDate(interactionDate)) errors.interactionDate = "Please select a valid date.";
    if (!interactionTime || !validateTime(interactionTime)) errors.interactionTime = "Please select a valid time.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission for updating follow-up
  const handleTextUpdate = async () => {
    if (!validateForm()) {
      setErrorMessage("Please fill in all required fields correctly.");
      return;
    }

    setIsFormSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

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
      setErrorMessage("Missing follow-up ID or fresh lead ID.");
      setIsFormSubmitting(false);
      return;
    }  
    
    try {
      const response = await updateFollowUp(followUpId, updatedData);
      setSuccessMessage("Follow-up updated successfully!");
      loadFollowUpHistories(updatedData.fresh_lead_id);
      setTimeout(() => {
        navigate('/follow-up');
      }, 2000);
    } catch (error) {
      console.error("Error updating Follow-up:", error);
      setErrorMessage("Failed to update follow-up. Please try again.");
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Handle converted or close actions
  const handleConvertedOrClose = async () => {
    if (!validateForm()) {
      setErrorMessage("Please fill in all required fields correctly.");
      return;
    }

    setIsFormSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (followUpType === "converted") {
      try {
        if (!clientInfo.fresh_lead_id) {
          setErrorMessage("Fresh Lead ID is missing. Please ensure the lead exists.");
          setIsFormSubmitting(false);
          return;
        }        
        const convertedPayload = {
          fresh_lead_id: clientInfo.fresh_lead_id,
        };
  
        const response = await createConvertedClientAPI(convertedPayload);
        setSuccessMessage("Converted client created successfully!");
        loadFollowUpHistories(clientInfo.fresh_lead_id);
        setTimeout(() => {
          navigate('/follow-up');
        }, 2000);
      } catch (error) {
        console.error("❌ Error creating converted client:", error);
        setErrorMessage("Failed to create converted client. Ensure the lead exists.");
      } finally {
        setIsFormSubmitting(false);
      }
    } else if (followUpType === "close") {
      try {
        if (!clientInfo.fresh_lead_id) {
          setErrorMessage("Fresh Lead ID is missing. Please ensure the lead exists.");
          setIsFormSubmitting(false);
          return;
        }

        const closeLeadPayload = { fresh_lead_id: clientInfo.fresh_lead_id };
        const response = await createCloseLeadAPI(closeLeadPayload); 
        setSuccessMessage("Close lead created successfully!");
        loadFollowUpHistories(clientInfo.fresh_lead_id);
        setTimeout(() => {
          navigate('/follow-up');
        }, 2000);
      } catch (error) {
        console.error("❌ Error creating close lead:", error);
        setErrorMessage("Failed to create close lead.");
      } finally {
        setIsFormSubmitting(false);
      }
    }
  };

  // Toggle speech recognition
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use a supported browser like Google Chrome.");
      return;
    }
    setSpeechError(null);
    setErrorMessage("");
    if (isListening) {
      stopListening();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setSuccessMessage("Speech recognition started. Speak now...");
      } catch (error) {
        setSpeechError("Failed to start speech recognition. Please try again.");
        console.error("Error starting speech recognition:", error);
        setErrorMessage("Failed to start speech recognition.");
      }
    }
  };

  const stopListening = () => {
    setIsListening(false);
    recognitionRef.current?.stop();
    setSuccessMessage("Speech recognition stopped.");
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      setSuccessMessage("Client info saved.");
    }
  };

  const toggleHistoryModal = () => {
    setShowHistoryModal(!showHistoryModal);
  };

  // Reset form fields
  const resetForm = () => {
    setContactMethod("");
    setFollowUpType("");
    setInteractionRating("");
    setReasonDesc("");
    setInteractionDate("");
    setInteractionTime(defaultTime);
    setFormErrors({});
    setErrorMessage("");
    setSuccessMessage("Form reset successfully.");
  };

  // Render client info header
  const renderClientInfoHeader = () => (
    <div className="client-info-header">
      <h3>Client Overview</h3>
      <div className="header-actions">
        <button onClick={toggleEditMode} className="edit-toggle-btn">
          {isEditing ? "Save" : "Edit"}
        </button>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  // Render client info footer
  const renderClientInfoFooter = () => (
    <div className="client-info-footer">
      <p>Last Updated: {lastUpdated || "N/A"}</p>
    </div>
  );

  // Render follow-up summary
  const renderFollowUpSummary = () => (
    <div className="follow-up-summary">
      <h4>Follow-Up Summary</h4>
      <p>Total Follow-Ups: {histories.length}</p>
      <p>Last Interaction: {histories.length > 0 ? formatDate(histories[0].follow_up_date) : "N/A"}</p>
    </div>
  );

  // Render history modal
  const renderHistoryModal = () => (
    showHistoryModal && (
      <div className="history-modal">
        <div className="modal-content">
          <h3>Follow-Up History</h3>
          <button onClick={toggleHistoryModal} className="close-modal-btn">Close</button>
          <div className="modal-history-list">
            {histories.length > 0 ? (
              histories.map((history, index) => (
                <div key={index} className="modal-history-item">
                  <p><strong>Date:</strong> {formatDate(history.follow_up_date)}</p>
                  <p><strong>Time:</strong> {history.follow_up_time}</p>
                  <p><strong>Reason:</strong> {history.reason_for_follow_up}</p>
                  <p><strong>Type:</strong> {history.follow_up_type}</p>
                  <p><strong>Rating:</strong> {history.interaction_rating}</p>
                  <p><strong>Contact Via:</strong> {history.connect_via}</p>
                  <hr />
                </div>
              ))
            ) : (
              <p>No follow-up history available.</p>
            )}
          </div>
        </div>
      </div>
    )
  );

  // Render form status messages
  const renderFormStatus = () => (
    <div className="form-status">
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}
    </div>
  );

  return (
    <div className="client-overview-wrapper">
      {/* Client Details Section */}
      <div className="c-container">
        <div className="c-header">
          <h2>Client Details</h2>
          <button className="c-button" onClick={() => navigate('/leads')}>
            ×
          </button>
        </div>
        <div className="c-content">
          <div className="c-layout">
            <div className="client-info-column">
              {renderClientInfoHeader()}
              <div className="c-profile">
                <div className="c-info">
                  {clientFields.map(({ key, label }) => (
                    <div className="info-item" key={key}>
                      <span className="label">{label} -</span>
                      <span
                        className="value"
                        contentEditable={isEditing}
                        suppressContentEditableWarning
                        onBlur={(e) => handleChange(key, e.target.innerText)}
                      >
                        {clientInfo[key] || ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {renderClientInfoFooter()}
            </div>

            <div className="follow-up-column">
              <div className="last-follow-up">
                <h3>Last Follow-up</h3>
                {isLoading ? (
                  <p>Loading follow-up history...</p>
                ) : histories.length > 0 ? (
                  <div className="last-follow-up-details">
                    <p><strong>Reason:</strong> {histories[0].reason_for_follow_up || "No description available."}</p>
                    <p><strong>Date:</strong> {formatDate(histories[0].follow_up_date)}</p>
                    <p><strong>Time:</strong> {histories[0].follow_up_time}</p>
                  </div>
                ) : (
                  <p>No follow-up history available.</p>
                )}
              </div>
              
              {histories.length > 0 && (
                <div className="follow-up-history-summary">
                  <h4>Previous Follow-ups</h4>
                  <button onClick={toggleHistoryModal} className="view-history-btn">
                    View Full History
                  </button>
                  <div className="history-list" style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {histories.slice(1).map((history, index) => (
                      <div key={index} className="history-item" style={{ marginBottom: "10px", padding: "5px", borderBottom: "1px solid #eee" }}>
                        <p><strong>{formatDate(history.follow_up_date)} - {history.follow_up_time}</strong></p>
                        <p>{history.reason_for_follow_up}</p>
                        <p><strong>Type:</strong> {history.follow_up_type}</p>
                        <p><strong>Rating:</strong> {history.interaction_rating}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {renderFollowUpSummary()}
            </div>
          </div>
        </div>
      </div>

      {/* Client Interaction Section */}
      <div className="client-interaction-container">
        <div className="interaction-form">
          <div className="connected-via">
            <h4>Connected Via</h4>
            <div className="radio-group">
              {contactMethods.map((method) => (
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
            {formErrors.contactMethod && (
              <p className="error-text">{formErrors.contactMethod}</p>
            )}
          </div>

          <div className="follow-up-type">
            <h4>Follow-Up Type</h4>
            <div className="radio-group">
              {followUpTypes.map((type) => (
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
            {formErrors.followUpType && (
              <p className="error-text">{formErrors.followUpType}</p>
            )}
          </div>

          <div className="interaction-rating">
            <h4>Interaction Rating</h4>
            <div className="radio-group">
              {interactionRatings.map((rating) => (
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
            {formErrors.interactionRating && (
              <p className="error-text">{formErrors.interactionRating}</p>
            )}
          </div>
        </div>
      </div>

      {/* Follow-Up Detail Section */}
      <div className="followup-detail-theme">
        <div className="followup-detail-container">
          <h2>Follow-Up Details</h2>
          {renderFormStatus()}
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
                  rows="5"
                />
                <button
                  type="button"
                  className={`speech-btn ${isListening ? "listening" : ""}`}
                  onClick={toggleListening}
                  aria-label={isListening ? "Stop recording" : "Start recording"}
                  disabled={isFormSubmitting}
                >
                  {isListening ? "⏹" : "🎤"}
                </button>
              </div>
              {speechError && (
                <p style={{ color: "red", marginTop: "5px" }}>{speechError}</p>
              )}
              {formErrors.reasonDesc && (
                <p className="error-text">{formErrors.reasonDesc}</p>
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
                      disabled={isFormSubmitting}
                    />
                    {formErrors.interactionDate && (
                      <p className="error-text">{formErrors.interactionDate}</p>
                    )}
                  </div>
                  <div>
                    <label style={{ fontWeight: "400" }}>Time:</label>
                    <TimePicker
                      onChange={setInteractionTime}
                      value={interactionTime}
                      format="hh:mm a"
                      disableClock={true}
                      clearIcon={null}
                      disabled={isFormSubmitting}
                    />
                    {formErrors.interactionTime && (
                      <p className="error-text">{formErrors.interactionTime}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="button-group" style={{ marginTop: "20px" }}>
                <button
                  onClick={handleTextUpdate}
                  className="crm-button update-follow-btn"
                  disabled={isFormSubmitting}
                >
                  {isFormSubmitting ? "Updating..." : "Update Follow-Up"}
                </button>
                {(followUpType === "converted" || followUpType === "close") && (
                  <button
                    onClick={handleConvertedOrClose}
                    className="crm-button converted-btn"
                    disabled={isFormSubmitting}
                  >
                    {isFormSubmitting
                      ? "Processing..."
                      : followUpType === "converted"
                      ? "Create Converted"
                      : "Create Close"}
                  </button>
                )}
                <button
                  onClick={resetForm}
                  className="crm-button reset-btn"
                  disabled={isFormSubmitting}
                >
                  Reset Form
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Render History Modal */}
      {renderHistoryModal()}
    </div>
  );
};

export default ClientDetailsOverview;