import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { notificationsSelector } from "../reducers/settings";
import { start, updateUserPreferences } from "./braze";

const HookNotifications = () => {
  const [notificationsStarted, setNotificationsStarted] = useState(false);
  const notifications = useSelector(notificationsSelector);

  const sync = useCallback(() => {
    if (notificationsStarted) return;
    setNotificationsStarted(true);
    start();
    updateUserPreferences(notifications);
  }, [notificationsStarted, notifications]);

  useEffect(sync, [sync]);

  return null;
};

export default HookNotifications;
