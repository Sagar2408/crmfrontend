// ✅ FreshLead.js (Final Version with Split Screen)
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/freshlead.css";
import { useApi } from "../../context/ApiContext";
import { useExecutiveActivity } from "../../context/ExecutiveActivityContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

function FreshLead() {
  const {
    fetchFreshLeadsAPI,
    executiveInfo,
    fetchExecutiveData,
    executiveLoading,
    createFollowUp,
  } = useApi();

  const { leadtrack } = useExecutiveActivity();
  const [leadsData, setLeadsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const [activePopoverIndex, setActivePopoverIndex] = useState(null);
  const [splitScreen, setSplitScreen] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    const executiveId = userData?.id;
    if (executiveId) {
      leadtrack(executiveId);
    }
  }, []);

  useEffect(() => {
    const loadLeads = async () => {
      if (!executiveInfo?.username) {
        if (!executiveLoading) {
          await fetchExecutiveData();
        }
        return;
      }

      try {
        setLoading(true);
        const data = await fetchFreshLeadsAPI();
        let leads = [];

        if (Array.isArray(data)) {
          leads = data;
        } else if (data && Array.isArray(data.data)) {
          leads = data.data;
        } else {
          setError("Invalid data format received for leads.");
          return;
        }

        const filteredLeads = leads.filter(
          (lead) => lead.clientLead?.status === "Assigned"
        );

        setLeadsData(filteredLeads);
      } catch (err) {
        setError("Failed to load leads. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadLeads();
  }, [executiveInfo?.username, executiveLoading]);

  const totalPages = Math.ceil(leadsData.length / itemsPerPage);
  const currentLeads = leadsData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleAddFollowUp = (lead) => {
    const clientData = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      altPhone: lead.altPhone,
      education: lead.education,
      experience: lead.experience,
      state: lead.state,
      dob: lead.dob,
      country: lead.country,
      assignDate: lead.assignDate,
      freshLeadId: lead.id,
    };

    navigate(`/clients/${encodeURIComponent(lead.name)}`, {
      state: { client: clientData, createFollowUp: true, clientId: clientData.id },
    });
  };

  const handleCall = async (type, phone) => {
  const cleaned = phone.replace(/[^\d]/g, "");

  if (type === "whatsapp") {
    try {
      await fetch("http://localhost:5000/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleaned }),
      });
    } catch (error) {
      console.error("WhatsApp launch failed:", error);
    }
  } else if (type === "phonelink") {
    window.open(`ms-phone:?callto=${cleaned}`, "_blank");
  }

  // Optional: split screen effect
  setSplitScreen(true);
  setTimeout(() => setSplitScreen(false), 30000);
};


  if (executiveLoading) return <p>Loading executive data...</p>;

  return (
    <div className={`fresh-leads-split-container ${splitScreen ? "split-mode" : ""}`}>
      <div className="fresh-leads-main-content">
        {loading && <p className="loading-text">Loading leads...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && (
          <>
            <div className="fresh-leads-table-container">
              <table className="fresh-leads-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Add follow-ups</th>
                    <th>Status</th>
                    <th>Call</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLeads.length > 0 ? (
                    currentLeads.map((lead, index) => (
                      <tr key={index}>
                        <td>
                          <div className="fresh-leads-name">
                            <div className="fresh-lead-detail">
                              <div>{lead.name}</div>
                              <div className="fresh-leads-profession">
                                {lead.profession}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{lead.phone}</td>
                        <td>{lead.email}</td>
                        <td>
                          <button
                            className="followup-badge"
                            onClick={() => handleAddFollowUp(lead)}
                          >
                            Add Follow Up ✏
                          </button>
                        </td>
                        <td>
                          <input
                            type="radio"
                            name={`leadStatus-${index}`}
                            className="status-radio"
                          />
                        </td>
                        <td className="call-cell">
  <button
    className="call-button"
    onClick={(e) => {
      e.stopPropagation();
      setActivePopoverIndex(
        activePopoverIndex === index ? null : index
      );
    }}
  >
    📞
  </button>
  {activePopoverIndex === index && (
    <div className="popover">
      <button
        className="popover-option"
        onClick={() => {
          handleCall("whatsapp", lead.phone);  // 🟢 Calls Flask for WhatsApp
          setActivePopoverIndex(null);
        }}
      >
        <FontAwesomeIcon
          icon={faWhatsapp}
          style={{ color: "#25D366", marginRight: "6px", fontSize: "18px" }}
        />
        WhatsApp
      </button>
      <button
        className="popover-option"
        onClick={() => {
          handleCall("phonelink", lead.phone);  // 🟢 Opens Phone Link
          setActivePopoverIndex(null);
        }}
      >
        <FontAwesomeIcon
          icon={faPhone}
          style={{ color: "#4285F4", marginRight: "6px", fontSize: "16px" }}
        />
        Normal Call
      </button>
    </div>
  )}
</td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-leads-text">
                        No assigned leads available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="fresh-pagination">
              <button
                className="fresh-pagination-btn"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                « Prev
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="fresh-pagination-btn"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next »
              </button>
            </div>
          </>
        )}
      </div>
      {splitScreen && <div className="call-panel-placeholder">Calling via external app...</div>}
    </div>
  );
}

export default FreshLead;
