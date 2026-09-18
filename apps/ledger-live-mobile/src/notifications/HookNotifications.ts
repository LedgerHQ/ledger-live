import { useEffect, useRef, useCallback, useState } from "react";
import { type UserId, userIdSelector, isDummyUserId } from "@domain/entity-client-identity";
import { useFeature } from "@features/platform-feature-flags";
import {
  brazeIdentitiesMatch,
  prepareBrazeIdentitySync,
  trackBrazeConsentTransition,
  type SyncedBrazeIdentity,
} from "@ledgerhq/live-common/braze/identityLifecycle";
import { useSelector } from "~/context/hooks";
import { notificationsSelector, trackingEnabledSelector } from "../reducers/settings";
import { applyBrazeConsentTransition, start, updateUserPreferences } from "./braze";
import { useBrazeContentCards } from "LLM/features/DynamicContent/components/BrazeContentCardsProvider";

const userIdsMatch = (left: UserId, right: UserId): boolean => left.equals(right);

const HookNotifications = () => {
  const notifications = useSelector(notificationsSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);
  const userId = useSelector(userIdSelector);
  const brazeOptOutIdentityCleanup = useFeature("brazeOptOutIdentityCleanup");
  const brazeOptOutIdentityCleanupEnabled = brazeOptOutIdentityCleanup?.enabled ?? false;
  const { prepareForIdentityTransition, refreshContentCards } = useBrazeContentCards();
  const lastSyncedIdentityRef = useRef<SyncedBrazeIdentity<UserId> | null>(null);
  const pendingConsentTransitionRef = useRef<Promise<boolean> | null>(null);
  const targetIdentityRef = useRef<SyncedBrazeIdentity<UserId> | null>(null);
  const retryCountRef = useRef(0);
  const identityUntrustedRef = useRef(false);
  const syncBrazeIdentityRef = useRef<() => void>(() => {});
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const [syncedEpoch, setSyncedEpoch] = useState(0);

  const syncBrazeIdentity = useCallback(() => {
    const currentIdentity: SyncedBrazeIdentity<UserId> = {
      userId,
      isTrackedUser,
      brazeOptOutIdentityCleanup: brazeOptOutIdentityCleanupEnabled,
    };
    const identitySync = prepareBrazeIdentitySync({
      currentIdentity,
      isDummyUser: isDummyUserId(userId),
      userIdsMatch,
      lastSyncedIdentityRef,
      targetIdentityRef,
      pendingConsentTransitionRef,
      retryCountRef,
      identityUntrustedRef,
    });
    if (!identitySync) return;

    if (identitySync.isConsentTransition) {
      const shouldAbort = () => isDummyUserId(userIdRef.current);
      trackBrazeConsentTransition({
        transition: applyBrazeConsentTransition(
          { isTrackedUser, userId },
          { prepareForIdentityTransition, refreshContentCards, shouldAbort },
        ),
        currentIdentity,
        userIdsMatch,
        lastSyncedIdentityRef,
        targetIdentityRef,
        pendingConsentTransitionRef,
        retryCountRef,
        identityUntrustedRef,
        syncBrazeIdentity: () => syncBrazeIdentityRef.current(),
        onIdentitySynced: () => setSyncedEpoch(epoch => epoch + 1),
        isCurrent: () => !shouldAbort(),
      });
      return;
    }

    start(isTrackedUser, userId, {
      brazeOptOutIdentityCleanup: brazeOptOutIdentityCleanupEnabled,
    });
    lastSyncedIdentityRef.current = currentIdentity;
    identityUntrustedRef.current = false;
  }, [
    brazeOptOutIdentityCleanupEnabled,
    isTrackedUser,
    prepareForIdentityTransition,
    refreshContentCards,
    userId,
  ]);

  useEffect(() => {
    syncBrazeIdentityRef.current = syncBrazeIdentity;
  }, [syncBrazeIdentity]);

  useEffect(() => {
    syncBrazeIdentity();
  }, [syncBrazeIdentity]);

  useEffect(() => {
    const currentIdentity: SyncedBrazeIdentity<UserId> | null = isDummyUserId(userId)
      ? null
      : {
          userId,
          isTrackedUser,
          brazeOptOutIdentityCleanup: brazeOptOutIdentityCleanupEnabled,
        };

    if (!brazeIdentitiesMatch(lastSyncedIdentityRef.current, currentIdentity, userIdsMatch)) {
      return;
    }

    updateUserPreferences(notifications, isTrackedUser, {
      brazeOptOutIdentityCleanup: brazeOptOutIdentityCleanupEnabled,
    });
  }, [brazeOptOutIdentityCleanupEnabled, isTrackedUser, notifications, syncedEpoch, userId]);

  return null;
};

export default HookNotifications;
