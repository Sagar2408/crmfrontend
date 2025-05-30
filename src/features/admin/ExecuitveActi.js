import React, { useEffect, useState } from "react";
import { FaCoffee, FaBriefcase, FaPhone } from "react-icons/fa";
import { useApi } from "../../context/ApiContext";
import axios from "axios";

const ExecutiveActi = ({ selectedExecutiveId, executiveName }) => {
  const [activityData, setActivityData] = useState({
    workTime: 0,
    breakTime: 0,
    callTime: 0,
  });
  const [selectedDate, setSelectedDate] = useState(new Date());

  const FULL_DAY_SECONDS = 8 * 3600;

  const convertTime = (seconds) => {
    if (seconds > 0) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
    return "0h 0m";
  };

  useEffect(() => {
    const fetchActivity = async () => {
      if (!selectedExecutiveId || !selectedDate) return;
      const formattedDate = selectedDate.toISOString().split("T")[0];
      try {
        const res = await axios.get(
          `/api/executiveActivity/activity-by-date?ExecutiveId=${selectedExecutiveId}&date=${formattedDate}`
        );
        const data = res.data.activity || {};
        setActivityData({
          workTime: data.workTime || 0,
          breakTime: data.breakTime || 0,
          callTime: data.dailyCallTime || 0,
        });
      } catch (error) {
        console.error("Error fetching executive activity:", error);
        setActivityData({ workTime: 0, breakTime: 0, callTime: 0 });
      }
    };

    fetchActivity();
  }, [selectedExecutiveId, selectedDate]);

  const activitiesRaw = [
    { name: "Break Time", value: activityData.breakTime, icon: <FaCoffee />, color: "#8b5cf6" },
    { name: "Work Time", value: activityData.workTime, icon: <FaBriefcase />, color: "#6d28d9" },
    { name: "Daily Call Time", value: activityData.callTime, icon: <FaPhone />, color: "#a78bfa" },
  ];

  const activities = activitiesRaw.map((activity) => ({
    ...activity,
    formattedValue: convertTime(activity.value),
    percentage: Math.min(Math.round((activity.value / FULL_DAY_SECONDS) * 100), 100),
  }));

  return (
    <div className="exec-activity">
      <h2
        className="exec-section-title"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span>Executive Activity</span>
          <span className="executive-name">{executiveName || "Loading..."}</span>
        </div>
        <input
          type="date"
          className="activity-calendar-input"
          value={selectedDate.toISOString().split("T")[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          style={{
            fontSize: "14px",
            padding: "4px 8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        />
      </h2>

      {activities.map((activity, index) => (
        <div key={index} className="activity-item">
          <div className="activity-label">
            <span className="activity-icon">{activity.icon}</span>
            <span className="activity-name">{activity.name}</span>
            <span className="activity-percentage">{activity.formattedValue}</span>
          </div>
          <div className="activity-progress">
            <div
              className="progress-fill"
              style={{
                width: `${activity.percentage}%`,
                backgroundColor: activity.color,
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExecutiveActi;
