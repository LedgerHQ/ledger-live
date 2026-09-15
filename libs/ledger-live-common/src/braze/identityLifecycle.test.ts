import {
  armBrazePendingRefreshTimeout,
  BRAZE_CONTENT_CARDS_REFRESH_TIMEOUT_MS,
  brazeIdentitiesMatch,
  createBrazePendingRefresh,
  prepareBrazeIdentitySync,
  runBrazeOptInTransition,
  runBrazeOptOutTransition,
  trackBrazeConsentTransition,
  type BrazeIdentityLifecycleSdk,
  type BrazePendingRefresh,
  type SyncedBrazeIdentity,
} from "./identityLifecycle";

const USER_ID = "11111111-1111-1111-1111-111111111111";

function createSdk(
  overrides: Partial<jest.Mocked<BrazeIdentityLifecycleSdk>> = {},
): jest.Mocked<BrazeIdentityLifecycleSdk> {
  return {
    wipeData: jest.fn(),
    enableSDK: jest.fn(),
    changeUser: jest.fn(),
    refreshContentCards: jest.fn(),
    ...overrides,
  };
}

type TestIdentity = SyncedBrazeIdentity<string>;

const createIdentity = (
  userId: string,
  isTrackedUser = true,
  brazeOptOutIdentityCleanup = true,
): TestIdentity => ({
  userId,
  isTrackedUser,
  brazeOptOutIdentityCleanup,
});

const userIdsMatch = (left: string, right: string) => left === right;

const createIdentitySyncRefs = (
  lastSyncedIdentity: TestIdentity | null = null,
  targetIdentity: TestIdentity | null = null,
) => {
  const pendingConsentTransitionRef: { current: Promise<boolean> | null } = { current: null };

  return {
    lastSyncedIdentityRef: { current: lastSyncedIdentity },
    targetIdentityRef: { current: targetIdentity },
    pendingConsentTransitionRef,
    retryCountRef: { current: 0 },
    identityUntrustedRef: { current: false },
  };
};

describe("createBrazePendingRefresh", () => {
  it("should expose controls for resolving the pending refresh", async () => {
    const pendingRefresh = createBrazePendingRefresh();

    pendingRefresh.resolve();

    await expect(pendingRefresh.promise).resolves.toBeUndefined();
  });

  it("should expose controls for rejecting the pending refresh", async () => {
    const pendingRefresh = createBrazePendingRefresh();
    const error = new Error("refresh failed");

    pendingRefresh.reject(error);

    await expect(pendingRefresh.promise).rejects.toBe(error);
  });
});

describe("armBrazePendingRefreshTimeout", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should reject a current refresh after the shared timeout", async () => {
    const pendingRefresh = createBrazePendingRefresh();
    const pendingRefreshRef: { current: BrazePendingRefresh | null } = { current: null };
    const onTimeout = jest.fn();
    pendingRefreshRef.current = armBrazePendingRefreshTimeout(pendingRefresh, pendingRefreshRef, {
      onTimeout,
    });
    void pendingRefresh.promise.catch(() => {});

    jest.advanceTimersByTime(BRAZE_CONTENT_CARDS_REFRESH_TIMEOUT_MS);

    await expect(pendingRefresh.promise).rejects.toThrow(
      "Timed out waiting for Braze content cards refresh",
    );
    expect(pendingRefreshRef.current).toBeNull();
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("should cancel the timeout when the refresh settles", async () => {
    const pendingRefresh = createBrazePendingRefresh();
    const pendingRefreshRef: { current: BrazePendingRefresh | null } = { current: null };
    pendingRefreshRef.current = armBrazePendingRefreshTimeout(pendingRefresh, pendingRefreshRef);

    pendingRefreshRef.current.resolve();

    await expect(pendingRefresh.promise).resolves.toBeUndefined();
    expect(jest.getTimerCount()).toBe(0);
  });

  it("should ignore a timeout for a refresh that is no longer current", () => {
    const pendingRefresh: BrazePendingRefresh = {
      promise: Promise.resolve(),
      resolve: jest.fn(),
      reject: jest.fn(),
    };
    const pendingRefreshRef: { current: BrazePendingRefresh | null } = {
      current: createBrazePendingRefresh(),
    };
    const onTimeout = jest.fn();
    armBrazePendingRefreshTimeout(pendingRefresh, pendingRefreshRef, { onTimeout });

    jest.advanceTimersByTime(BRAZE_CONTENT_CARDS_REFRESH_TIMEOUT_MS);

    expect(pendingRefresh.reject).not.toHaveBeenCalled();
    expect(onTimeout).not.toHaveBeenCalled();
  });
});

describe("prepareBrazeIdentitySync", () => {
  it("should clear identity synchronization state for a dummy user", () => {
    const identity = createIdentity(USER_ID);
    const refs = createIdentitySyncRefs(identity, identity);
    refs.retryCountRef.current = 1;
    refs.identityUntrustedRef.current = true;

    const result = prepareBrazeIdentitySync({
      currentIdentity: identity,
      isDummyUser: true,
      userIdsMatch,
      ...refs,
    });

    expect(result).toBeNull();
    expect(refs.lastSyncedIdentityRef.current).toBeNull();
    expect(refs.targetIdentityRef.current).toBeNull();
    expect(refs.retryCountRef.current).toBe(0);
    expect(refs.identityUntrustedRef.current).toBe(false);
  });

  it("should skip synchronization when the identity is already synchronized", () => {
    const identity = createIdentity(USER_ID);
    const refs = createIdentitySyncRefs(identity, identity);
    refs.retryCountRef.current = 1;

    const result = prepareBrazeIdentitySync({
      currentIdentity: identity,
      isDummyUser: false,
      userIdsMatch,
      ...refs,
    });

    expect(result).toBeNull();
    expect(refs.retryCountRef.current).toBe(0);
  });

  it("should skip synchronization while a consent transition is pending", () => {
    const previousIdentity = createIdentity("previous-user");
    const currentIdentity = createIdentity(USER_ID);
    const refs = createIdentitySyncRefs(previousIdentity, previousIdentity);
    refs.pendingConsentTransitionRef.current = Promise.resolve(true);

    const result = prepareBrazeIdentitySync({
      currentIdentity,
      isDummyUser: false,
      userIdsMatch,
      ...refs,
    });

    expect(result).toBeNull();
    expect(refs.targetIdentityRef.current).toBe(currentIdentity);
  });

  it("should request a consent transition when tracking consent changes", () => {
    const previousIdentity = createIdentity(USER_ID, false);
    const currentIdentity = createIdentity(USER_ID, true);
    const refs = createIdentitySyncRefs(previousIdentity, previousIdentity);

    const result = prepareBrazeIdentitySync({
      currentIdentity,
      isDummyUser: false,
      userIdsMatch,
      ...refs,
    });

    expect(result).toEqual({ isConsentTransition: true });
    expect(refs.targetIdentityRef.current).toBe(currentIdentity);
  });

  it("should request a regular synchronization when cleanup is disabled", () => {
    const previousIdentity = createIdentity(USER_ID, false, false);
    const currentIdentity = createIdentity(USER_ID, true, false);
    const refs = createIdentitySyncRefs(previousIdentity, previousIdentity);

    const result = prepareBrazeIdentitySync({
      currentIdentity,
      isDummyUser: false,
      userIdsMatch,
      ...refs,
    });

    expect(result).toEqual({ isConsentTransition: false });
  });

  it("should request a regular synchronization on first boot", () => {
    const currentIdentity = createIdentity(USER_ID);
    const refs = createIdentitySyncRefs();

    const result = prepareBrazeIdentitySync({
      currentIdentity,
      isDummyUser: false,
      userIdsMatch,
      ...refs,
    });

    expect(result).toEqual({ isConsentTransition: false });
    expect(refs.identityUntrustedRef.current).toBe(false);
  });

  it("should request a consent transition when the SDK identity is untrusted", () => {
    const identity = createIdentity(USER_ID);
    const refs = createIdentitySyncRefs(identity, identity);
    refs.identityUntrustedRef.current = true;

    const result = prepareBrazeIdentitySync({
      currentIdentity: identity,
      isDummyUser: false,
      userIdsMatch,
      ...refs,
    });

    expect(result).toEqual({ isConsentTransition: true });
  });
});

describe("trackBrazeConsentTransition", () => {
  const flushMicrotasks = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };

  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should mark the identity as synchronized when the transition succeeds", async () => {
    const previousIdentity = createIdentity(USER_ID, false);
    const currentIdentity = createIdentity(USER_ID, true);
    const refs = createIdentitySyncRefs(previousIdentity, currentIdentity);
    const syncBrazeIdentity = jest.fn();
    const onIdentitySynced = jest.fn();

    trackBrazeConsentTransition({
      transition: Promise.resolve(),
      currentIdentity,
      userIdsMatch,
      ...refs,
      syncBrazeIdentity,
      onIdentitySynced,
    });

    await flushMicrotasks();

    expect(refs.lastSyncedIdentityRef.current).toBe(currentIdentity);
    expect(refs.identityUntrustedRef.current).toBe(false);
    expect(refs.pendingConsentTransitionRef.current).toBeNull();
    expect(syncBrazeIdentity).not.toHaveBeenCalled();
    expect(onIdentitySynced).toHaveBeenCalledTimes(1);
  });

  it("should re-sync when the target identity changes during the transition", async () => {
    const previousIdentity = createIdentity(USER_ID, false);
    const currentIdentity = createIdentity(USER_ID, true);
    const latestIdentity = createIdentity(USER_ID, false);
    const refs = createIdentitySyncRefs(previousIdentity, currentIdentity);
    const syncBrazeIdentity = jest.fn();
    const onIdentitySynced = jest.fn();

    trackBrazeConsentTransition({
      transition: Promise.resolve(),
      currentIdentity,
      userIdsMatch,
      ...refs,
      syncBrazeIdentity,
      onIdentitySynced,
    });
    refs.targetIdentityRef.current = latestIdentity;

    await flushMicrotasks();

    expect(refs.lastSyncedIdentityRef.current).toBe(currentIdentity);
    expect(syncBrazeIdentity).toHaveBeenCalledTimes(1);
    expect(onIdentitySynced).not.toHaveBeenCalled();
  });

  it("should retry a failed transition once", async () => {
    const previousIdentity = createIdentity(USER_ID, false);
    const currentIdentity = createIdentity(USER_ID, true);
    const refs = createIdentitySyncRefs(previousIdentity, currentIdentity);
    const syncBrazeIdentity = jest.fn();

    trackBrazeConsentTransition({
      transition: Promise.reject(new Error("transition failed")),
      currentIdentity,
      userIdsMatch,
      ...refs,
      syncBrazeIdentity,
    });

    await flushMicrotasks();

    expect(refs.lastSyncedIdentityRef.current).toBeNull();
    expect(refs.identityUntrustedRef.current).toBe(true);
    expect(refs.retryCountRef.current).toBe(1);
    expect(syncBrazeIdentity).toHaveBeenCalledTimes(1);
  });

  it("should stop retrying after the maximum number of failed transitions", async () => {
    const previousIdentity = createIdentity(USER_ID, false);
    const currentIdentity = createIdentity(USER_ID, true);
    const refs = createIdentitySyncRefs(previousIdentity, currentIdentity);
    refs.retryCountRef.current = 1;
    const syncBrazeIdentity = jest.fn();

    trackBrazeConsentTransition({
      transition: Promise.reject(new Error("transition failed")),
      currentIdentity,
      userIdsMatch,
      ...refs,
      syncBrazeIdentity,
    });

    await flushMicrotasks();

    expect(syncBrazeIdentity).not.toHaveBeenCalled();
    expect(refs.lastSyncedIdentityRef.current).toBeNull();
    expect(refs.identityUntrustedRef.current).toBe(true);
  });

  it("should re-apply the flipped-back identity after a failed transition", async () => {
    const optedIn = createIdentity(USER_ID, true);
    const optedOut = createIdentity(USER_ID, false);
    const refs = createIdentitySyncRefs(optedIn, optedOut);
    const syncBrazeIdentity = jest.fn();

    trackBrazeConsentTransition({
      transition: Promise.reject(new Error("wipe failed")),
      currentIdentity: optedOut,
      userIdsMatch,
      ...refs,
      syncBrazeIdentity,
    });
    refs.targetIdentityRef.current = optedIn;

    await flushMicrotasks();

    expect(refs.lastSyncedIdentityRef.current).toBeNull();
    expect(refs.identityUntrustedRef.current).toBe(true);
    expect(syncBrazeIdentity).toHaveBeenCalledTimes(1);

    const result = prepareBrazeIdentitySync({
      currentIdentity: optedIn,
      isDummyUser: false,
      userIdsMatch,
      ...refs,
    });

    expect(result).toEqual({ isConsentTransition: true });
  });

  it("should not mark the captured identity synced when the transition is no longer current", async () => {
    const previousIdentity = createIdentity(USER_ID, false);
    const currentIdentity = createIdentity(USER_ID, true);
    const refs = createIdentitySyncRefs(previousIdentity, currentIdentity);
    const syncBrazeIdentity = jest.fn();
    const onIdentitySynced = jest.fn();

    trackBrazeConsentTransition({
      transition: Promise.resolve(),
      currentIdentity,
      userIdsMatch,
      ...refs,
      syncBrazeIdentity,
      onIdentitySynced,
      isCurrent: () => false,
    });

    await flushMicrotasks();

    expect(refs.lastSyncedIdentityRef.current).toBe(previousIdentity);
    expect(onIdentitySynced).not.toHaveBeenCalled();
    expect(syncBrazeIdentity).toHaveBeenCalledTimes(1);
  });
});

describe("brazeIdentitiesMatch", () => {
  it("should compare user id, tracking consent, and cleanup configuration", () => {
    const identity = createIdentity(USER_ID);

    expect(brazeIdentitiesMatch(identity, { ...identity }, (left, right) => left === right)).toBe(
      true,
    );
    expect(
      brazeIdentitiesMatch(
        identity,
        { ...identity, isTrackedUser: false },
        (left, right) => left === right,
      ),
    ).toBe(false);
  });
});

describe("runBrazeOptOutTransition", () => {
  it("should reset the SDK and refresh cards without identifying when opting out", async () => {
    const sdk = createSdk();

    await runBrazeOptOutTransition(sdk);

    expect(sdk.wipeData).toHaveBeenCalledTimes(1);
    expect(sdk.enableSDK).toHaveBeenCalledTimes(1);
    expect(sdk.refreshContentCards).toHaveBeenCalledTimes(1);
    expect(sdk.changeUser).not.toHaveBeenCalled();
    expect(sdk.wipeData.mock.invocationCallOrder[0]).toBeLessThan(
      sdk.enableSDK.mock.invocationCallOrder[0],
    );
    expect(sdk.enableSDK.mock.invocationCallOrder[0]).toBeLessThan(
      sdk.refreshContentCards.mock.invocationCallOrder[0],
    );
  });

  it("should not enable the SDK when wipeData fails", async () => {
    const sdk = createSdk({
      wipeData: jest.fn(async () => {
        throw new Error("wipe failed");
      }),
    });

    await expect(runBrazeOptOutTransition(sdk)).rejects.toThrow("wipe failed");
    expect(sdk.enableSDK).not.toHaveBeenCalled();
    expect(sdk.refreshContentCards).not.toHaveBeenCalled();
    expect(sdk.changeUser).not.toHaveBeenCalled();
  });

  it("should not refresh cards when enableSDK fails", async () => {
    const sdk = createSdk({
      enableSDK: jest.fn(async () => {
        throw new Error("enable failed");
      }),
    });

    await expect(runBrazeOptOutTransition(sdk)).rejects.toThrow("enable failed");
    expect(sdk.wipeData).toHaveBeenCalledTimes(1);
    expect(sdk.refreshContentCards).not.toHaveBeenCalled();
    expect(sdk.changeUser).not.toHaveBeenCalled();
  });
});

describe("runBrazeOptInTransition", () => {
  it("should identify after resetting the SDK when opting in", async () => {
    const sdk = createSdk();

    await runBrazeOptInTransition(sdk, { userId: USER_ID });

    expect(sdk.wipeData).toHaveBeenCalledTimes(1);
    expect(sdk.enableSDK).toHaveBeenCalledTimes(1);
    expect(sdk.changeUser).toHaveBeenCalledTimes(1);
    expect(sdk.changeUser).toHaveBeenCalledWith(USER_ID);
    expect(sdk.refreshContentCards).toHaveBeenCalledTimes(1);
    expect(sdk.wipeData.mock.invocationCallOrder[0]).toBeLessThan(
      sdk.enableSDK.mock.invocationCallOrder[0],
    );
    expect(sdk.enableSDK.mock.invocationCallOrder[0]).toBeLessThan(
      sdk.changeUser.mock.invocationCallOrder[0],
    );
    expect(sdk.changeUser.mock.invocationCallOrder[0]).toBeLessThan(
      sdk.refreshContentCards.mock.invocationCallOrder[0],
    );
  });

  it("should not call the SDK when the user id is missing", async () => {
    const sdk = createSdk();

    await expect(runBrazeOptInTransition(sdk, { userId: "" })).rejects.toThrow(
      "Braze opt-in transition requires a user id",
    );
    expect(sdk.wipeData).not.toHaveBeenCalled();
    expect(sdk.enableSDK).not.toHaveBeenCalled();
    expect(sdk.changeUser).not.toHaveBeenCalled();
    expect(sdk.refreshContentCards).not.toHaveBeenCalled();
  });

  it("should not identify when wipeData fails", async () => {
    const sdk = createSdk({
      wipeData: jest.fn(async () => {
        throw new Error("wipe failed");
      }),
    });

    await expect(runBrazeOptInTransition(sdk, { userId: USER_ID })).rejects.toThrow("wipe failed");
    expect(sdk.enableSDK).not.toHaveBeenCalled();
    expect(sdk.changeUser).not.toHaveBeenCalled();
    expect(sdk.refreshContentCards).not.toHaveBeenCalled();
  });

  it("should not refresh cards when changeUser fails", async () => {
    const sdk = createSdk({
      changeUser: jest.fn(async (_userId: string) => {
        throw new Error("changeUser failed");
      }),
    });

    await expect(runBrazeOptInTransition(sdk, { userId: USER_ID })).rejects.toThrow(
      "changeUser failed",
    );
    expect(sdk.wipeData).toHaveBeenCalledTimes(1);
    expect(sdk.enableSDK).toHaveBeenCalledTimes(1);
    expect(sdk.refreshContentCards).not.toHaveBeenCalled();
  });
});
