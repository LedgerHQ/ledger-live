import { useEffect, useState, useCallback } from "react";
import { useSelector, useStore } from "~/context/hooks";
import { notificationsSelector, trackingEnabledSelector } from "../reducers/settings";
import { start, updateUserPreferences } from "./braze";

const HookNotifications = () => {
  const [notificationsStarted, setNotificationsStarted] = useState(false);
  const notifications = useSelector(notificationsSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);
  const store = useStore();

  const sync = useCallback(() => {
    if (notificationsStarted) return;
    setNotificationsStarted(true);
    start(isTrackedUser, store);
    updateUserPreferences(notifications);
  }, [notificationsStarted, notifications, isTrackedUser, store]);

  useEffect(sync, [sync]);

  return null;
};

export default HookNotifications;
