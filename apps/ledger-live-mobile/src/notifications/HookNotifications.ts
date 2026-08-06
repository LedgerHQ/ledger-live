import { useEffect, useRef, useCallback } from "react";
import { type UserId, userIdSelector, isDummyUserId } from "@domain/entity-client-identity";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { notificationsSelector, trackingEnabledSelector } from "../reducers/settings";
import { start, updateUserPreferences } from "./braze";

type SyncedBrazeIdentity = {
  userId: UserId;
  isTrackedUser: boolean;
  brazeOptOutIdentityCleanup: boolean;
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

    const brazeOptOutIdentityCleanupEnabled = brazeOptOutIdentityCleanup?.enabled ?? false;
    const currentIdentity: SyncedBrazeIdentity = {
      userId,
      isTrackedUser,
      brazeOptOutIdentityCleanup: brazeOptOutIdentityCleanupEnabled,
    };
    const lastSyncedIdentity = lastSyncedIdentityRef.current;
    if (
      lastSyncedIdentity &&
      lastSyncedIdentity.userId.equals(currentIdentity.userId) &&
      lastSyncedIdentity.isTrackedUser === currentIdentity.isTrackedUser &&
      lastSyncedIdentity.brazeOptOutIdentityCleanup === currentIdentity.brazeOptOutIdentityCleanup
    ) {
      return;
    }

    lastSyncedIdentityRef.current = currentIdentity;
    start(isTrackedUser, userId, {
      brazeOptOutIdentityCleanup: brazeOptOutIdentityCleanupEnabled,
    });
  }, [brazeOptOutIdentityCleanup?.enabled, isTrackedUser, userId]);

  useEffect(() => {
    syncBrazeIdentity();
  }, [syncBrazeIdentity]);

  useEffect(() => {
    updateUserPreferences(notifications, isTrackedUser);
  }, [notifications, isTrackedUser]);

  return null;
};

export default HookNotifications;
