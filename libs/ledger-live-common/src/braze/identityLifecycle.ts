/**
 * Client-side Braze identity transitions for consent changes.
 *
 * `wipeData()` only clears **local** SDK state on the device and disables the SDK
 * until `enableSDK()`. It does **not** delete the Braze server profile
 * (`/users/delete`). See https://www.braze.com/docs/developer_guide/analytics/managing_data_collection/
 */

export type BrazeIdentityLifecycleSdk = {
  wipeData: () => void | Promise<void>;
  enableSDK: () => void | Promise<void>;
  changeUser: (userId: string) => void | Promise<void>;
  refreshContentCards: () => void | Promise<void>;
};

export type BrazeOptInIdentity = {
  userId: string;
};

export type BrazePendingRefresh = {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: unknown) => void;
};

export type SyncedBrazeIdentity<TUserId> = {
  userId: TUserId;
  isTrackedUser: boolean;
  brazeOptOutIdentityCleanup: boolean;
};

type MutableRef<T> = {
  current: T;
};

type PrepareBrazeIdentitySyncOptions<TUserId> = {
  currentIdentity: SyncedBrazeIdentity<TUserId>;
  isDummyUser: boolean;
  userIdsMatch: (left: TUserId, right: TUserId) => boolean;
  lastSyncedIdentityRef: MutableRef<SyncedBrazeIdentity<TUserId> | null>;
  targetIdentityRef: MutableRef<SyncedBrazeIdentity<TUserId> | null>;
  pendingConsentTransitionRef: MutableRef<Promise<boolean> | null>;
  retryCountRef: MutableRef<number>;
};

export type BrazeIdentitySync = {
  isConsentTransition: boolean;
};

const MAX_BRAZE_CONSENT_TRANSITION_RETRIES = 1;

type TrackBrazeConsentTransitionOptions<TUserId> = {
  transition: Promise<unknown>;
  currentIdentity: SyncedBrazeIdentity<TUserId>;
  userIdsMatch: (left: TUserId, right: TUserId) => boolean;
  lastSyncedIdentityRef: MutableRef<SyncedBrazeIdentity<TUserId> | null>;
  targetIdentityRef: MutableRef<SyncedBrazeIdentity<TUserId> | null>;
  pendingConsentTransitionRef: MutableRef<Promise<boolean> | null>;
  retryCountRef: MutableRef<number>;
  syncBrazeIdentity: () => void;
  onIdentitySynced?: () => void;
};

const noop = () => {};
const noopReject = (_error: unknown) => {};

export function createBrazePendingRefresh(): BrazePendingRefresh {
  let resolveRefresh: () => void = noop;
  let rejectRefresh: (error: unknown) => void = noopReject;
  const promise = new Promise<void>((resolve, reject) => {
    resolveRefresh = resolve;
    rejectRefresh = reject;
  });

  return {
    promise,
    resolve: resolveRefresh,
    reject: rejectRefresh,
  };
}

export function brazeIdentitiesMatch<TUserId>(
  left: SyncedBrazeIdentity<TUserId> | null,
  right: SyncedBrazeIdentity<TUserId> | null,
  userIdsMatch: (left: TUserId, right: TUserId) => boolean,
): boolean {
  return (
    left != null &&
    right != null &&
    userIdsMatch(left.userId, right.userId) &&
    left.isTrackedUser === right.isTrackedUser &&
    left.brazeOptOutIdentityCleanup === right.brazeOptOutIdentityCleanup
  );
}

export function prepareBrazeIdentitySync<TUserId>({
  currentIdentity,
  isDummyUser,
  userIdsMatch,
  lastSyncedIdentityRef,
  targetIdentityRef,
  pendingConsentTransitionRef,
  retryCountRef,
}: PrepareBrazeIdentitySyncOptions<TUserId>): BrazeIdentitySync | null {
  if (isDummyUser) {
    lastSyncedIdentityRef.current = null;
    targetIdentityRef.current = null;
    retryCountRef.current = 0;
    return null;
  }

  if (!brazeIdentitiesMatch(targetIdentityRef.current, currentIdentity, userIdsMatch)) {
    targetIdentityRef.current = currentIdentity;
    retryCountRef.current = 0;
  }

  if (brazeIdentitiesMatch(lastSyncedIdentityRef.current, currentIdentity, userIdsMatch)) {
    retryCountRef.current = 0;
    return null;
  }

  if (pendingConsentTransitionRef.current) {
    return null;
  }

  return {
    isConsentTransition:
      currentIdentity.brazeOptOutIdentityCleanup &&
      lastSyncedIdentityRef.current != null &&
      lastSyncedIdentityRef.current.isTrackedUser !== currentIdentity.isTrackedUser,
  };
}

export function trackBrazeConsentTransition<TUserId>({
  transition,
  currentIdentity,
  userIdsMatch,
  lastSyncedIdentityRef,
  targetIdentityRef,
  pendingConsentTransitionRef,
  retryCountRef,
  syncBrazeIdentity,
  onIdentitySynced,
}: TrackBrazeConsentTransitionOptions<TUserId>): void {
  const trackedTransition = Promise.resolve(transition)
    .then(() => true)
    .catch(error => {
      console.warn("Braze consent transition failed", error);
      return false;
    });

  pendingConsentTransitionRef.current = trackedTransition;
  void trackedTransition.then(didTransitionSucceed => {
    if (pendingConsentTransitionRef.current === trackedTransition) {
      pendingConsentTransitionRef.current = null;
    }

    if (didTransitionSucceed) {
      lastSyncedIdentityRef.current = currentIdentity;
      retryCountRef.current = 0;
      if (!brazeIdentitiesMatch(currentIdentity, targetIdentityRef.current, userIdsMatch)) {
        syncBrazeIdentity();
        return;
      }
      onIdentitySynced?.();
      return;
    }

    if (retryCountRef.current >= MAX_BRAZE_CONSENT_TRANSITION_RETRIES) {
      return;
    }

    retryCountRef.current += 1;
    syncBrazeIdentity();
  });
}

/**
 * Opt-in → opt-out: reset the local SDK session and refetch broad Content Cards.
 * Does not assign an `external_id`.
 */
export async function runBrazeOptOutTransition(sdk: BrazeIdentityLifecycleSdk): Promise<void> {
  await sdk.wipeData();
  await sdk.enableSDK();
  await sdk.refreshContentCards();
}

/**
 * Opt-out → opt-in: reset the local SDK session, identify with the real user id,
 * then refetch Content Cards.
 */
export async function runBrazeOptInTransition(
  sdk: BrazeIdentityLifecycleSdk,
  identity: BrazeOptInIdentity,
): Promise<void> {
  if (!identity.userId) {
    throw new Error("Braze opt-in transition requires a user id");
  }

  await sdk.wipeData();
  await sdk.enableSDK();
  await sdk.changeUser(identity.userId);
  await sdk.refreshContentCards();
}
