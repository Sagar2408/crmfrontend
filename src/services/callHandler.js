export const initiateCall = async (type, phone) => {
  const command = type === "whatsapp" ? `whatsapp:${phone}` : `phonelink:${phone}`;

  try {
    const response = await fetch("http://localhost:9099", {
      method: "POST",
      body: command,
    });

    const result = await response.text();
    console.log("Agent says:", result);
  } catch (err) {
    console.error("❌ Call agent not responding:", err);
  }
};
