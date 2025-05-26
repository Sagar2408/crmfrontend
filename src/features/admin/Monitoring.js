import React, { useState, useEffect } from "react";
import { useApi } from "../../context/ApiContext";
import SidebarToggle from "./SidebarToggle";
import StreamPlayer from "../../pages/StreamPlayer"; // ✅ Corrected path

function Monitoring() {
  const [executives, setExecutives] = useState([]);
  const [selectedExec, setSelectedExec] = useState(null);

  const { fetchExecutivesAPI } = useApi();

  useEffect(() => {
    const fetchExecutives = async () => {
      try {
        const data = await fetchExecutivesAPI();
        setExecutives(data);
      } catch (error) {
        console.error("❌ Failed to load executives:", error);
      }
    };
    fetchExecutives();
  }, []);

  const selectedExecutive = executives.find(
    (e) => e.username === selectedExec
  );

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
            onChange={(e) =>
              setSelectedExec(e.target.value === "all" ? null : e.target.value)
            }
            style={{
              padding: "10px",
              fontSize: "16px",
              borderRadius: "8px",
              minWidth: "200px",
            }}
          >
            <option value="all">All Executives</option>
            {executives.map((e, i) => (
              <option key={i} value={e.username}>
                {e.username}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Executive Stream View */}
        {selectedExec && selectedExecutive ? (
          <div className="stream-section">
            <div className="exec-box-wrapper">
              <div className="exec-box">
                <StreamPlayer
                  executiveId={selectedExecutive.id}
                  executiveName={selectedExecutive.username}
                  type="screen"
                />
              </div>
            </div>

            <div className="exec-box-wrapper">
              <div className="exec-box">
                <StreamPlayer
                  executiveId={selectedExecutive.id}
                  executiveName={selectedExecutive.username}
                  type="video"
                />
              </div>
            </div>

            <div className="audio-test-bar">
              <StreamPlayer
                executiveId={selectedExecutive.id}
                executiveName={selectedExecutive.username}
                type="audio"
              />
            </div>
          </div>
        ) : (
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
                  <div className="media-toggle-attached">
                    <div className="toggle-btn">
                      🎤
                    </div>
                    <div className="toggle-btn">
                      🎥
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Monitoring;
