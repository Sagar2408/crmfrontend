import { useEffect } from "react";

const useCopyNotification = (createCopyNotification, fetchNotifications) => {
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id || !user.role) return;

    const userId = user.id;
    const userRole = user.role; // 'admin' or 'executive'

    const handleCopy = () => {
      const copiedText = window.getSelection().toString().trim();
      if (!copiedText) return;

      const message = `Copied: "${copiedText.slice(0, 100)}"`;

      createCopyNotification(userId, userRole, message);
      console.log(`userId: ${userId}, role: ${userRole}, message: ${message}`);
    };

    document.addEventListener("copy", handleCopy);

    return () => {
      document.removeEventListener("copy", handleCopy);
    };
  }, [createCopyNotification, fetchNotifications]);
};

export default useCopyNotification;
