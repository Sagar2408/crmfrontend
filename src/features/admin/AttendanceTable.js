import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import "../../styles/attendancetable.css";
import SidebarToggle from "./SidebarToggle";
import { useExecutiveActivity } from "../../context/ExecutiveActivityContext";

const AttendanceTable = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [dates, setDates] = useState([]);
  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));
  const isSidebarExpanded =
  localStorage.getItem("adminSidebarExpanded") === "true";
const [weekStart, setWeekStart] = useState(
  dayjs().startOf("week").add(1, "day")
);

  const { handleGetAttendance } = useExecutiveActivity();

  const fetchFromContext = async () => {
    const data = await handleGetAttendance(
      startDate.format("YYYY-MM-DD"),
      endDate.format("YYYY-MM-DD")
    );
    setAttendanceData(data);
    if (data.length > 0) {
      const start = dayjs(startDate);
      const newDates = Array.from({ length: 7 }, (_, i) =>
        start.add(i, "day").format("YYYY-MM-DD")
      );
      setDates(newDates);
          }
  };

  useEffect(() => {
    fetchFromContext();
  }, [startDate, endDate]);

  const isFutureDate = (date) => {
    return dayjs(date).isAfter(dayjs(), "day");
  };
  useEffect(() => {
    // When startDate changes, auto-set endDate to 6 days after
    setEndDate(startDate.add(6, "day"));
  }, [startDate]);
  

  return (
    <div
    className={`create-executive-container ${
      isSidebarExpanded ? "sidebar-expanded" : "sidebar-collapsed"
    }`}    
  >
    <SidebarToggle />
    <div className="attendance-container">
      <h2 className="attendance-title">Attendance Report</h2>

      <div className="select-wrapper">
        <label className="select-label">From: </label>
        <input
          type="date"
          value={startDate.format("YYYY-MM-DD")}
          onChange={(e) => setStartDate(dayjs(e.target.value))}
          className="select-date"
        />

<label className="select-label">To: </label>
<input
  type="date"
  value={endDate.format("YYYY-MM-DD")}
  disabled
  className="select-date"
/>

      </div>

      <div className="table-scroll-wrapper">
        <table className="attendance-table">
          <thead>
            <tr>
              <th className="sticky-col">Executive</th>
              {dates.map((date) => (
  <th key={date}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span style={{ fontWeight: 500 }}>{dayjs(date).format("ddd")}</span>  {/* Day name (Mon, Tue...) */}
      <span>{dayjs(date).format("DD/MM/YYYY")}</span>                        {/* Date */}
    </div>
  </th>
))}

            </tr>
          </thead>
          <tbody>
            {attendanceData.map((exec) => (
              <tr key={exec.executiveId}>
                <td className="sticky-col">
                  {exec.executiveId} {exec.executiveName}
                </td>
                {dates.map((date) => {
                  const status = isFutureDate(date)
                    ? ""
                    : exec.attendance[date];
                  return (
                    <td key={date}>
                      {status && (
                        <span
                          className={`status-badge ${
                            status === "Present" ? "present" : "absent"
                          }`}
                        >
                          {status}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
};

export default AttendanceTable;