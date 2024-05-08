import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { notificationsSelector, trackingEnabledSelector } from "../reducers/settings";
import { start, updateUserPreferences } from "./braze";

const HookNotifications = () => {
  const [notificationsStarted, setNotificationsStarted] = useState(false);
  const notifications = useSelector(notificationsSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);

  const sync = useCallback(() => {
    if (notificationsStarted) return;
    setNotificationsStarted(true);
    start(isTrackedUser);
    updateUserPreferences(notifications);
  }, [notificationsStarted, notifications, isTrackedUser]);

  useEffect(sync, [sync]);

  return null;
};

export default HookNotifications;
