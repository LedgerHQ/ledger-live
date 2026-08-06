import { useEffect, useRef, useCallback } from "react";
import { userIdSelector, isDummyUserId } from "@domain/entity-client-identity";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { notificationsSelector, trackingEnabledSelector } from "../reducers/settings";
import { start, updateUserPreferences } from "./braze";

type SyncedBrazeIdentity = {
  userId: string;
  isTrackedUser: boolean;
};

const HookNotifications = () => {
  const notifications = useSelector(notificationsSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);
  const userId = useSelector(userIdSelector);
  const brazeOptOutIdentityCleanup = useFeature("brazeOptOutIdentityCleanup");
  const lastSyncedIdentityRef = useRef<SyncedBrazeIdentity | null>(null);

  const syncBrazeIdentity = useCallback(() => {
    if (isDummyUserId(userId)) {
      lastSyncedIdentityRef.current = null;
      return;
    }

    const currentIdentity: SyncedBrazeIdentity = {
      userId: userId.exportUserIdForPersistence(),
      isTrackedUser,
    };
    const lastSyncedIdentity = lastSyncedIdentityRef.current;
    if (
      lastSyncedIdentity?.userId === currentIdentity.userId &&
      lastSyncedIdentity.isTrackedUser === currentIdentity.isTrackedUser
    ) {
      return;
    }

    lastSyncedIdentityRef.current = currentIdentity;
    start(isTrackedUser, userId, {
      brazeOptOutIdentityCleanup: brazeOptOutIdentityCleanup?.enabled ?? false,
    });
  }, [brazeOptOutIdentityCleanup?.enabled, isTrackedUser, userId]);

  useEffect(() => {
    syncBrazeIdentity();
  }, [syncBrazeIdentity]);

  useEffect(() => {
    updateUserPreferences(notifications);
  }, [notifications]);

  return null;
};

export default HookNotifications;
