import React, { useEffect, useState,useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/freshlead.css";
import { useApi } from "../../context/ApiContext";
import { useExecutiveActivity } from "../../context/ExecutiveActivityContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import useCopyNotification from "../../hooks/useCopyNotification";
import { SearchContext } from "../../context/SearchContext";
function FreshLead() {
  const {
    fetchFreshLeadsAPI,
    executiveInfo,
    fetchExecutiveData,
    executiveLoading,
    createFollowUp,
    verifyNumberAPI,
    verificationResults,
    verificationLoading,
    fetchNotifications,
    createCopyNotification
  } = useApi();

  useCopyNotification(createCopyNotification, fetchNotifications);
  const { leadtrack } = useExecutiveActivity();
  const {searchQuery,setActivepage}=useContext(SearchContext);
  const [leadsData, setLeadsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activePopoverIndex, setActivePopoverIndex] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [verifyingIndex, setVerifyingIndex] = useState(null);

  const itemsPerPage = 9;
  const navigate = useNavigate();

  const handleVerify = async (index, number) => {
    setVerifyingIndex(index);
    await verifyNumberAPI(index, number);
    setVerifyingIndex(null);
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    const executiveId = userData?.id;
    if (executiveId) {
      leadtrack(executiveId);
    }
  }, []);

  
  useEffect(() => {
    const loadLeads = async () => {
      if (hasLoaded) return;
      try {
        setLoading(true);

        if (!executiveInfo && !executiveLoading) {
          await fetchExecutiveData();
        }

        const data = await fetchFreshLeadsAPI();

        let leads = [];
        if (Array.isArray(data)) {
          leads = data;
        } else if (data && Array.isArray(data.data)) {
          leads = data.data;
        } else {
          setError("Invalid leads data format.");
          return;
        }

        const filteredLeads = leads
          .filter(
            (lead) =>
              lead.clientLead?.status === "New" ||
              lead.clientLead?.status === "Assigned"
          )
          .sort((a, b) => {
            const dateA = new Date(
              a.assignDate ||
                a.lead?.assignmentDate ||
                a.clientLead?.assignDate ||
                0
            );
            const dateB = new Date(
              b.assignDate ||
                b.lead?.assignmentDate ||
                b.clientLead?.assignDate ||
                0
            );
            return dateB - dateA;
          });

        setLeadsData(filteredLeads);
        setCurrentPage(1);
        setHasLoaded(true);
      } catch (err) {
        setError("Failed to load leads. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadLeads();
  }, [executiveInfo, executiveLoading, hasLoaded]);
  const filteredLeadsData = leadsData.filter((lead) => {
    const query = searchQuery.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(query) ||
      lead.phone?.toString().includes(query) ||
      lead.email?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredLeadsData.length / itemsPerPage);
  const currentLeads = filteredLeadsData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
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
      state: {
        client: clientData,
        createFollowUp: true,
        clientId: clientData.id,
      },
    });
  };

  if (executiveLoading) return <p>Loading executive data...</p>;

  return (
    <div className="fresh-leads-main-content">
      <div className="fresh-leads-header">
        <h2 className="fresh-leads-title">Fresh leads list</h2>
        <h4 className="fresh-leads-subtitle">Click on Add followup to view details</h4>
      </div>

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
                          Add Follow Up
                          <FontAwesomeIcon
                            icon={faPenToSquare}
                            className="icon"
                          />
                        </button>
                      </td>
                      <td>
                        <div className="status-cell">
                          <button
                            onClick={() => handleVerify(index, lead.phone)}
                            className="verify-btn"
                            disabled={
                              verifyingIndex === index || verificationLoading
                            }
                          >
                            {verifyingIndex === index
                              ? "Verifying..."
                              : "Get Verified"}
                          </button>
                          {verificationResults[index] && (
                            <div className="verify-result">
                              {verificationResults[index].error ? (
                                <span className="text-red-600">
                                  ❌ {verificationResults[index].error}
                                </span>
                              ) : (
                                <span className="text-green-600">
                                  ✅{" "}
                                  {verificationResults[index].name ||
                                    verificationResults[index].location}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
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
                                localStorage.setItem("activeClient", JSON.stringify({
                                 name: lead.name,
                                 phone: lead.phone
                                }));
                                const cleaned = lead.phone.replace(/[^\d]/g, "");
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
                                const cleaned = lead.phone.replace(/[^\d]/g, "");
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

          {totalPages > 1 && (
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
          )}
        </>
      )}
    </div>
  );
}

export default FreshLead;