import React, { useState, useEffect } from 'react';
import { useApi } from '../../context/ApiContext';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone, faVideo, faDesktop,
} from "@fortawesome/free-solid-svg-icons";
import SidebarToggle from "./SidebarToggle";
import StreamPlayer from "../../pages/StreamPlayer";

function Monitoring() {
  const [executives, setExecutives] = useState([]);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState(null);
  const [selectedExecutiveName, setSelectedExecutiveName] = useState(null);
  const [streamType, setStreamType] = useState(null);

  const { fetchExecutivesAPI } = useApi();

  // Fetch executives list
  const fetchExecutives = async () => {
    try {
      const data = await fetchExecutivesAPI();
      setExecutives(data);
    } catch (error) {
      console.error("❌ Failed to load executives:", error);
    }
  };

  useEffect(() => {
    fetchExecutives();
  }, []);

  // Trigger stream via Flask backend
  const triggerStream = async (executiveId, stream) => {
    try {
      const res = await fetch("https://monitoring-w28p.onrender.com/trigger-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ executive_id: executiveId, stream })
      });

      const data = await res.json();
      console.log(`✅ Triggered ${stream} for Exec ${executiveId}:`, data);
    } catch (error) {
      console.error("❌ Failed to trigger stream:", error);
    }
  };

  return (
    <>
      <SidebarToggle />
      <div>
        <h1 style={{ textAlign: "center", marginTop: "20px" }}>Executives</h1>
        <div className="exec-grid">
          {executives?.map((e, i) => (
            <div className="exec-item" key={i}>
              <p className='exec-name'>{e?.username}</p>
              <div className="exec-box-wrapper">
                <div className="exec-box">
                  <div className="exe-avatar">
                    {e?.username?.charAt(0)?.toUpperCase()}
                  </div>
                </div>
                <div className="media-toggle-attached">
                  <button
                    className="toggle-btn"
                    title="View Screen"
                    onClick={() => {
                      setSelectedExecutiveId(e.id);
                      setSelectedExecutiveName(e.username);
                      setStreamType("screen");
                      triggerStream(e.id, "screen");
                    }}
                  >
                    <FontAwesomeIcon icon={faDesktop} />
                  </button>

                  <button
                    className="toggle-btn"
                    title="View Video"
                    onClick={() => {
                      setSelectedExecutiveId(e.id);
                      setSelectedExecutiveName(e.username);
                      setStreamType("video");
                      triggerStream(e.id, "video");
                    }}
                  >
                    <FontAwesomeIcon icon={faVideo} />
                  </button>

                  <button
                    className="toggle-btn"
                    title="Listen Audio"
                    onClick={() => {
                      setSelectedExecutiveId(e.id);
                      setSelectedExecutiveName(e.username);
                      setStreamType("audio");
                      triggerStream(e.id, "audio");
                    }}
                  >
                    <FontAwesomeIcon icon={faMicrophone} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stream Player */}
        {selectedExecutiveId && streamType && (
          <div style={{ marginTop: "30px", padding: "20px" }}>
            <h2 style={{ textAlign: "center" }}>{streamType.toUpperCase()} Stream</h2>
            <StreamPlayer
              executiveId={selectedExecutiveId}
              executiveName={selectedExecutiveName}
              type={streamType}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default Monitoring;
