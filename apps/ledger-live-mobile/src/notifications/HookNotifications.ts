import { useEffect, useRef, useCallback, useState } from "react";
import { type UserId, userIdSelector, isDummyUserId } from "@domain/entity-client-identity";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { notificationsSelector, trackingEnabledSelector } from "../reducers/settings";
import { applyBrazeConsentTransition, start, updateUserPreferences } from "./braze";
import { useBrazeContentCards } from "LLM/features/DynamicContent/components/BrazeContentCardsProvider";

type SyncedBrazeIdentity = {
  userId: UserId;
  isTrackedUser: boolean;
  brazeOptOutIdentityCleanup: boolean;
};

const MAX_CONSENT_TRANSITION_RETRIES = 1;

const identitiesMatch = (
  left: SyncedBrazeIdentity | null,
  right: SyncedBrazeIdentity | null,
): boolean =>
  left != null &&
  right != null &&
  left.userId.equals(right.userId) &&
  left.isTrackedUser === right.isTrackedUser &&
  left.brazeOptOutIdentityCleanup === right.brazeOptOutIdentityCleanup;

const HookNotifications = () => {
  const notifications = useSelector(notificationsSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);
  const userId = useSelector(userIdSelector);
  const brazeOptOutIdentityCleanup = useFeature("brazeOptOutIdentityCleanup");
  const brazeOptOutIdentityCleanupEnabled = brazeOptOutIdentityCleanup?.enabled ?? false;
  const { prepareForIdentityTransition, refreshContentCards } = useBrazeContentCards();
  const lastSyncedIdentityRef = useRef<SyncedBrazeIdentity | null>(null);
  const pendingConsentTransitionRef = useRef<Promise<boolean> | null>(null);
  const targetIdentityRef = useRef<SyncedBrazeIdentity | null>(null);
  const retryCountRef = useRef(0);
  const syncBrazeIdentityRef = useRef<() => void>(() => {});
  const [syncedEpoch, setSyncedEpoch] = useState(0);

  const syncBrazeIdentity = useCallback(() => {
    if (isDummyUserId(userId)) {
      lastSyncedIdentityRef.current = null;
      targetIdentityRef.current = null;
      retryCountRef.current = 0;
      return;
    }

    const currentIdentity: SyncedBrazeIdentity = {
      userId,
      isTrackedUser,
      brazeOptOutIdentityCleanup: brazeOptOutIdentityCleanupEnabled,
    };

    if (!identitiesMatch(targetIdentityRef.current, currentIdentity)) {
      targetIdentityRef.current = currentIdentity;
      retryCountRef.current = 0;
    }

    if (identitiesMatch(lastSyncedIdentityRef.current, currentIdentity)) {
      retryCountRef.current = 0;
      return;
    }

    if (pendingConsentTransitionRef.current) {
      return;
    }

    const lastSyncedIdentity = lastSyncedIdentityRef.current;
    const isConsentTransition =
      brazeOptOutIdentityCleanupEnabled &&
      lastSyncedIdentity != null &&
      lastSyncedIdentity.isTrackedUser !== currentIdentity.isTrackedUser;

    if (isConsentTransition) {
      const transition = Promise.resolve(
        applyBrazeConsentTransition(
          { isTrackedUser, userId },
          { prepareForIdentityTransition, refreshContentCards },
        ),
      )
        .then(() => true)
        .catch(error => {
          console.warn("Braze consent transition failed", error);
          return false;
        });

      pendingConsentTransitionRef.current = transition;
      void transition.then(didTransitionSucceed => {
        if (pendingConsentTransitionRef.current === transition) {
          pendingConsentTransitionRef.current = null;
        }

        if (didTransitionSucceed) {
          lastSyncedIdentityRef.current = currentIdentity;
          retryCountRef.current = 0;
          if (!identitiesMatch(currentIdentity, targetIdentityRef.current)) {
            syncBrazeIdentityRef.current();
            return;
          }
          setSyncedEpoch(epoch => epoch + 1);
          return;
        }

        if (retryCountRef.current >= MAX_CONSENT_TRANSITION_RETRIES) {
          return;
        }

        retryCountRef.current += 1;
        syncBrazeIdentityRef.current();
      });
      return;
    }

    start(isTrackedUser, userId, {
      brazeOptOutIdentityCleanup: brazeOptOutIdentityCleanupEnabled,
    });
    lastSyncedIdentityRef.current = currentIdentity;
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
    const currentIdentity: SyncedBrazeIdentity | null = isDummyUserId(userId)
      ? null
      : {
          userId,
          isTrackedUser,
          brazeOptOutIdentityCleanup: brazeOptOutIdentityCleanupEnabled,
        };

    if (!identitiesMatch(lastSyncedIdentityRef.current, currentIdentity)) {
      return;
    }

    updateUserPreferences(notifications, isTrackedUser, {
      brazeOptOutIdentityCleanup: brazeOptOutIdentityCleanupEnabled,
    });
  }, [brazeOptOutIdentityCleanupEnabled, isTrackedUser, notifications, syncedEpoch, userId]);

  return null;
};

export default HookNotifications;
