import { useEffect, useState, useCallback } from "react";
import { start } from "./braze";

const HookNotifications = () => {
    console.log("Hook Notifications");
  const [notificationsStarted, setNotificationsStarted] = useState(false);
  const sync = useCallback(() => {
    if (notificationsStarted) return;
    setNotificationsStarted(true);
    start();
  }, [notificationsStarted]);
  useEffect(sync, [sync]);
  return null;
};

export default HookNotifications;
