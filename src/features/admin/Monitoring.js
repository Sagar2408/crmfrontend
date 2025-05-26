import React, { useState, useEffect } from "react";
import { useApi } from "../../context/ApiContext";
import SidebarToggle from "./SidebarToggle";
import StreamPlayer from "../../pages/StreamPlayer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDesktop, faVideo, faVolumeUp } from "@fortawesome/free-solid-svg-icons";

function Monitoring() {
  const [executives, setExecutives] = useState([]);
  const [selectedExec, setSelectedExec] = useState(null);

  const [showScreen, setShowScreen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showAudio, setShowAudio] = useState(false);

  const { fetchExecutivesAPI } = useApi();

  useEffect(() => {
    fetchExecutivesAPI().then(setExecutives).catch(console.error);
  }, []);

  const selectedExecutive = executives.find(e => e.username === selectedExec);

  // ✅ Trigger backend to start stream via REST
  const triggerStream = async (type) => {
    if (!selectedExecutive) return;

    try {
      const res = await fetch("https://monitoring-w28p.onrender.com/trigger-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          executive_id: selectedExecutive.id,
          stream_type: type
        })
      });

      const result = await res.json();
      if (result.status === "triggered") {
        console.log(`✅ Triggered ${type} for ${selectedExecutive.username}`);
        if (type === "screen") setShowScreen(true);
        if (type === "video") setShowVideo(true);
        if (type === "audio") setShowAudio(true);
      } else {
        console.warn("⚠️ Trigger failed");
      }
    } catch (err) {
      console.error("❌ Error triggering stream:", err);
    }
  };

  return (
    <>
      <SidebarToggle />
      <div>
        <h1 style={{ textAlign: "center", marginTop: "20px" }}>
          Choose Executives
        </h1>

        {/* Dropdown */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <select
            onChange={(e) => {
              setSelectedExec(e.target.value === "all" ? null : e.target.value);
              setShowScreen(false);
              setShowVideo(false);
              setShowAudio(false);
            }}
            style={{
              padding: "10px",
              fontSize: "16px",
              borderRadius: "8px",
              minWidth: "200px",
            }}
          >
            <option value="all">All Executives</option>
            {executives.map((e, i) => (
              <option key={i} value={e.username}>{e.username}</option>
            ))}
          </select>
        </div>

        {/* 👥 All executives view */}
        {!selectedExec && (
          <div className="exec-grid">
            {executives.map((e, i) => (
              <div className="exec-item" key={i}>
                <p className="exec-name">{e.username}</p>
                <div className="exec-box-wrapper">
                  <div className="exec-box">
                    <div className="exe-avatar">
                      {e.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 🧑‍💻 Selected executive view */}
        {selectedExec && selectedExecutive && (
          <>
            <div className="stream-section">
              {/* Screen Cast */}
              <div className="exec-box-wrapper">
                <div className="exec-box">
                  {showScreen ? (
                    <StreamPlayer
                      executiveId={selectedExecutive.id}
                      executiveName={selectedExecutive.username}
                      type="screen"
                    />
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <p>Start Screen Cast</p>
                      <FontAwesomeIcon
                        icon={faDesktop}
                        size="2x"
                        style={{ cursor: "pointer", marginTop: "10px" }}
                        onClick={() => triggerStream("screen")}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Webcam Video */}
              <div className="exec-box-wrapper">
                <div className="exec-box">
                  {showVideo ? (
                    <StreamPlayer
                      executiveId={selectedExecutive.id}
                      executiveName={selectedExecutive.username}
                      type="video"
                    />
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <p>Start Webcam</p>
                      <FontAwesomeIcon
                        icon={faVideo}
                        size="2x"
                        style={{ cursor: "pointer", marginTop: "10px" }}
                        onClick={() => triggerStream("video")}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Audio Panel */}
            <div className="audio-test-bar">
              {showAudio ? (
                <StreamPlayer
                  executiveId={selectedExecutive.id}
                  executiveName={selectedExecutive.username}
                  type="audio"
                />
              ) : (
                <div style={{ textAlign: "center" }}>
                  <p>Start Audio Stream</p>
                  <FontAwesomeIcon
                    icon={faVolumeUp}
                    size="2x"
                    style={{ cursor: "pointer", marginTop: "10px" }}
                    onClick={() => triggerStream("audio")}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Monitoring;
