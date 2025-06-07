import React, { useState, useEffect } from "react";
import AdminSidebar from "../layouts/AdminSidebar";
import TaskManagement from "../features/LeadAssign/TaskManagement";
import "../styles/leadassign.css";

function LeadAssignRoutes() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem("adminSidebarExpanded") === "false"
  );

  useEffect(() => {
    const updateSidebarState = () => {
      const isExpanded = localStorage.getItem("adminSidebarExpanded") === "true";
      setSidebarCollapsed(!isExpanded);
    };

    window.addEventListener("sidebarToggle", updateSidebarState);
    updateSidebarState();

    return () => window.removeEventListener("sidebarToggle", updateSidebarState);
  }, []);

  return (
    <div className="lead-assign-cont">
      <div className="lead-sidebar-admin">
        <AdminSidebar />
      </div>
      <div className="lead-content-wrapper">
        <TaskManagement />
      </div>
    </div>
  );
}

export default LeadAssignRoutes;