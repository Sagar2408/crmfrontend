import React, { createContext, useContext, useState } from "react";

// Create the context
const CallContext = createContext();

// Provider component
export const CallProvider = ({ children }) => {
  const [dialingPhone, setDialingPhone] = useState(null);

  const startCall = (phone) => {
    setDialingPhone(phone);
  };

  const stopCall = () => {
    setDialingPhone(null);
  };

  return (
    <CallContext.Provider value={{ dialingPhone, startCall, stopCall }}>
      {children}
    </CallContext.Provider>
  );
};

// Custom hook for easier access
export const useCall = () => useContext(CallContext);
