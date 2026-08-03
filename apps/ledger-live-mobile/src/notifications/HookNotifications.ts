import { useEffect, useState, useCallback } from "react";
import { userIdSelector } from "@domain/entity-client-identity";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { notificationsSelector, trackingEnabledSelector } from "../reducers/settings";
import { start, updateUserPreferences } from "./braze";

const HookNotifications = () => {
  const [notificationsStarted, setNotificationsStarted] = useState(false);
  const notifications = useSelector(notificationsSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);
  const userId = useSelector(userIdSelector);
  const brazeOptOutIdentityCleanup = useFeature("brazeOptOutIdentityCleanup");

  const sync = useCallback(() => {
    if (notificationsStarted) return;
    setNotificationsStarted(true);
    start(isTrackedUser, userId, {
      brazeOptOutIdentityCleanup: brazeOptOutIdentityCleanup?.enabled ?? false,
    });
    updateUserPreferences(notifications);
  }, [
    notificationsStarted,
    notifications,
    isTrackedUser,
    userId,
    brazeOptOutIdentityCleanup?.enabled,
  ]);

  useEffect(sync, [sync]);

  return null;
};

export default HookNotifications;
