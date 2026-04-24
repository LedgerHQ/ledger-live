import { useEffect, useState, useCallback } from "react";
import { userIdSelector } from "@ledgerhq/client-ids/store";
import { useSelector } from "~/context/hooks";
import { notificationsSelector, trackingEnabledSelector } from "../reducers/settings";
import { start, updateUserPreferences } from "./braze";

const HookNotifications = () => {
  const [notificationsStarted, setNotificationsStarted] = useState(false);
  const notifications = useSelector(notificationsSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);
  const userId = useSelector(userIdSelector);

  const sync = useCallback(() => {
    if (notificationsStarted) return;
    setNotificationsStarted(true);
    start(isTrackedUser, userId);
    updateUserPreferences(notifications);
  }, [notificationsStarted, notifications, isTrackedUser, userId]);

  useEffect(sync, [sync]);

  return null;
};

export default HookNotifications;
