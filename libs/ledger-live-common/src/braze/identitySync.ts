import { type UserId, isDummyUserId } from "@domain/entity-client-identity";

export type SyncedBrazeIdentity = {
  userId: UserId;
  isTrackedUser: boolean;
  brazeOptOutIdentityCleanup: boolean;
};

export const identitiesMatch = (
  left: SyncedBrazeIdentity | null,
  right: SyncedBrazeIdentity | null,
): boolean =>
  left != null &&
  right != null &&
  left.userId.equals(right.userId) &&
  left.isTrackedUser === right.isTrackedUser &&
  left.brazeOptOutIdentityCleanup === right.brazeOptOutIdentityCleanup;

export type BrazeIdentitySyncAction =
  | { type: "reset" }
  | { type: "skip" }
  | { type: "consentTransition"; identity: SyncedBrazeIdentity }
  | { type: "directSync"; identity: SyncedBrazeIdentity };

export type BrazeIdentitySyncState = {
  targetIdentity: SyncedBrazeIdentity | null;
  lastSyncedIdentity: SyncedBrazeIdentity | null;
  hasPendingConsentTransition: boolean;
};

export type BrazeIdentitySyncPlan = {
  action: BrazeIdentitySyncAction;
  nextTargetIdentity: SyncedBrazeIdentity | null;
  shouldResetRetryCount: boolean;
};

/**
 * Pure decision function for the consent/identity sync state machine shared by the
 * desktop and mobile Braze providers. Kept side-effect free so callers own the refs.
 */
export function planBrazeIdentitySync(
  params: {
    userId: UserId;
    isTrackedUser: boolean;
    brazeOptOutIdentityCleanupEnabled: boolean;
  },
  state: BrazeIdentitySyncState,
): BrazeIdentitySyncPlan {
  const { userId, isTrackedUser, brazeOptOutIdentityCleanupEnabled } = params;
  const { targetIdentity, lastSyncedIdentity, hasPendingConsentTransition } = state;

  if (isDummyUserId(userId)) {
    return {
      action: { type: "reset" },
      nextTargetIdentity: null,
      shouldResetRetryCount: true,
    };
  }

  const currentIdentity: SyncedBrazeIdentity = {
    userId,
    isTrackedUser,
    brazeOptOutIdentityCleanup: brazeOptOutIdentityCleanupEnabled,
  };

  const targetChanged = !identitiesMatch(targetIdentity, currentIdentity);
  const nextTargetIdentity = targetChanged ? currentIdentity : targetIdentity;

  if (identitiesMatch(lastSyncedIdentity, currentIdentity)) {
    return {
      action: { type: "skip" },
      nextTargetIdentity,
      shouldResetRetryCount: true,
    };
  }

  if (hasPendingConsentTransition) {
    return {
      action: { type: "skip" },
      nextTargetIdentity,
      shouldResetRetryCount: targetChanged,
    };
  }

  const isConsentTransition =
    brazeOptOutIdentityCleanupEnabled &&
    lastSyncedIdentity != null &&
    lastSyncedIdentity.isTrackedUser !== currentIdentity.isTrackedUser;

  return {
    action: isConsentTransition
      ? { type: "consentTransition", identity: currentIdentity }
      : { type: "directSync", identity: currentIdentity },
    nextTargetIdentity,
    shouldResetRetryCount: targetChanged,
  };
}
