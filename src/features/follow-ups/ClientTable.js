
import React, { useEffect, useState,useContext } from "react";
import { useNavigate,useLocation } from "react-router-dom";
import { useApi } from "../../context/ApiContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone,faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { SearchContext } from "../../context/SearchContext";

const ClientTable = ({ filter = "All Follow Ups", onSelectClient }) => {
  const { followUps, getAllFollowUps, followUpLoading } = useApi();
  const clients = Array.isArray(followUps?.data) ? followUps.data : [];
  const [activePopoverIndex, setActivePopoverIndex] = useState(null);
  const [tableHeight, setTableHeight] = useState("500px");
  const navigate = useNavigate();
  const { searchQuery, setActivePage } = useContext(SearchContext);
  const location = useLocation(); // ✅ Replace global reference

  useEffect(() => {
    getAllFollowUps();
  }, []);

  useEffect(() => {
    setActivePage("follow-up");
  }, [setActivePage]);

  useEffect(() => {
    const updateTableHeight = () => {
      const windowHeight = window.innerHeight;
      const tablePosition = document.querySelector(".table-container")?.getBoundingClientRect().top || 0;
      const footerHeight = 40;
      const newHeight = Math.max(300, windowHeight - tablePosition - footerHeight);
      setTableHeight(`${newHeight}px`);
    };

    updateTableHeight();
    window.addEventListener("resize", updateTableHeight);
    return () => window.removeEventListener("resize", updateTableHeight);
  }, []);

  const filteredClients = clients.filter((client) => {
    const type = (client.follow_up_type || "").toLowerCase().trim();
    const status = (client.clientLeadStatus || "").toLowerCase().trim();

    if (status !== "follow-up") return false;

    if (filter === "Interested" && type !== "interested") return false;
    if (filter === "Not Interested" && type !== "not interested") return false;

    // 🔍 Apply search filter only on follow-up page
    if (location.pathname.includes("follow-up") && searchQuery.trim()) {
      const search = searchQuery.toLowerCase();
      const name = client.freshLead?.name?.toLowerCase() || "";
      const phone = client.freshLead?.phone?.toString() || "";
      const email = client.freshLead?.email?.toLowerCase() || "";

      return name.includes(search) || phone.includes(search) || email.includes(search);
    }

    return true;
  });

  const handleEdit = (client) => {
    const freshLeadId = client.freshLead?.id || client.fresh_lead_id;
    if (!freshLeadId) {
      console.error("Fresh Lead ID is missing or incorrect");
      return;
    }
    const leadData = {
      ...client.freshLead,
      fresh_lead_id: freshLeadId,
      followUpId: client.id,
    };
    navigate(`/clients/${encodeURIComponent(client.id)}/details`, {
      state: { client: leadData, createFollowUp: false, from: "followup" },
    });
  };

  const getStatusColorClass = (status) => {
    switch ((status || "").toLowerCase()) {
      case "follow-up":
        return "status-followup";
      case "converted":
        return "status-converted";
      case "not interested":
        return "status-notinterested";
      default:
        return "status-default";
    }
  };
  const getRatingColorClass = (rating) => {
    switch ((rating || "").toLowerCase()) {
      case "hot":
        return "rating-hot";
      case "warm":
        return "rating-warm";
      case "cold":
        return "rating-cold";
      default:
        return "rating-default";
    }
  };
  
  return (
    <div className="table-container responsive-table-wrapper" style={{ maxHeight: tableHeight }}>
      <table className="client-table">
        <thead>
          <tr className="sticky-header">
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Add follow up</th>
            <th>Status</th>
            <th>Call</th>
          </tr>
        </thead>
        <tbody>
          {followUpLoading ? (
            <tr>
              <td colSpan="6" className="loading-row">Loading...</td>
            </tr>
          ) : (
            filteredClients.map((client, index) => (
              <tr key={index}>
                <td onClick={() => onSelectClient?.(client)}>
                  <div className="client-name">
                    <div className="client-info">
                      <strong>{client.freshLead?.name || "No Name"}</strong>
                    </div>
                  </div>
                </td>
                <td>{client.freshLead?.phone?.toString() || "No Phone"}</td>
                <td>{client.freshLead?.email || "N/A"}</td>
                <td>
                  {filter === "All Follow Ups" ? (
                    <button
                      className="followup-badge full-click"
                      onClick={() => handleEdit(client)}
                    >
                      Create <FontAwesomeIcon icon={faPenToSquare} className="icon" />
                    </button>
                  ) : (
                    <button
                      className="followup-badge full-click"
                      onClick={() => handleEdit(client)}
                    >
                      {(client.follow_up_type || "").toLowerCase()}
                    </button>
                  )}
                </td>
                <td>
                  {client.interaction_rating ? (
                    <span className={`rating-badge ${getRatingColorClass(client.interaction_rating)}`}>
                      {client.interaction_rating.charAt(0).toUpperCase() + client.interaction_rating.slice(1)}
                    </span>
                  ) : (
                    <span className={`status-badge ${getStatusColorClass(client.clientLeadStatus)}`}>
                      {client.clientLeadStatus || "N/A"}
                    </span>
                  )}
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
                                const cleaned = (client.freshLead?.phone || "").replace(/[^\d]/g, "");
                                window.open(`https://wa.me/91${cleaned}`, "_blank");
                                setActivePopoverIndex(null);
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faWhatsapp}
                                style={{
                                  color: "#25D366",
                                  marginRight: "6px",
                                  fontSize: "18px",
                                }}
                              />
                              WhatsApp
                            </button>
                            <button
                              className="popover-option"
                              onClick={() => {
                                const cleaned = (client.freshLead?.phone || "").replace(/[^\d]/g, "");
                                window.open(`tel:${cleaned}`);
                                setActivePopoverIndex(null);
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faPhone}
                                style={{
                                  color: "#4285F4",
                                  marginRight: "6px",
                                  fontSize: "16px",
                                }}
                              />
                              Normal Call
                            </button>
                          </div>
                        )}
                      </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ClientTable;