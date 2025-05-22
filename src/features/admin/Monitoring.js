import React, { useState, useEffect } from 'react';
import { useApi } from '../../context/ApiContext'; // ✅ Using Context API
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone, faVideo, faDesktop,
} from "@fortawesome/free-solid-svg-icons";
import SidebarToggle from "./SidebarToggle";// ✅
import StreamPlayer from "./StreamPlayer";
function Monitoring() {
  const [executives, setExecutives] = useState([]);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState(null);
  const [streamType, setStreamType] = useState(null);

  const { fetchExecutivesAPI } = useApi();

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
                  <button className="toggle-btn" title="View Screen"
                    onClick={() => {
                      setSelectedExecutiveId(e.id);
                      setStreamType("screen");
                    }}>
                    <FontAwesomeIcon icon={faDesktop} />
                  </button>
                  <button className="toggle-btn" title="View Video"
                    onClick={() => {
                      setSelectedExecutiveId(e.id);
                      setStreamType("video");
                    }}>
                    <FontAwesomeIcon icon={faVideo} />
                  </button>
                  <button className="toggle-btn" title="Listen Audio"
                    onClick={() => {
                      setSelectedExecutiveId(e.id);
                      setStreamType("audio");
                    }}>
                    <FontAwesomeIcon icon={faMicrophone} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stream View */}
        {selectedExecutiveId && streamType && (
          <div style={{ marginTop: "30px", padding: "20px" }}>
            <h2 style={{ textAlign: "center" }}>{streamType.toUpperCase()} Stream</h2>
            <StreamPlayer executiveId={selectedExecutiveId} type={streamType} />
          </div>
        )}
      </div>
    </>
  );
}

export default Monitoring;
