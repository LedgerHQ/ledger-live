import { UserId, DUMMY_USER_ID } from "@domain/entity-client-identity";
import { planBrazeIdentitySync, identitiesMatch, type SyncedBrazeIdentity } from "./identitySync";

const USER_A = UserId.fromString("11111111-1111-1111-1111-111111111111");
const USER_B = UserId.fromString("22222222-2222-2222-2222-222222222222");

const identity = (overrides: Partial<SyncedBrazeIdentity> = {}): SyncedBrazeIdentity => ({
  userId: USER_A,
  isTrackedUser: true,
  brazeOptOutIdentityCleanup: true,
  ...overrides,
});

describe("identitiesMatch", () => {
  it("returns false when either identity is null", () => {
    expect(identitiesMatch(null, identity())).toBe(false);
    expect(identitiesMatch(identity(), null)).toBe(false);
  });

  it("returns true only when every field matches", () => {
    expect(identitiesMatch(identity(), identity())).toBe(true);
    expect(identitiesMatch(identity(), identity({ userId: USER_B }))).toBe(false);
    expect(identitiesMatch(identity(), identity({ isTrackedUser: false }))).toBe(false);
    expect(identitiesMatch(identity(), identity({ brazeOptOutIdentityCleanup: false }))).toBe(
      false,
    );
  });
});

describe("planBrazeIdentitySync", () => {
  const baseParams = {
    userId: USER_A,
    isTrackedUser: true,
    brazeOptOutIdentityCleanupEnabled: true,
  };

  it("resets when the user id is a dummy placeholder", () => {
    const plan = planBrazeIdentitySync(
      { ...baseParams, userId: DUMMY_USER_ID },
      {
        targetIdentity: identity(),
        lastSyncedIdentity: identity(),
        hasPendingConsentTransition: false,
      },
    );

    expect(plan).toEqual({
      action: { type: "reset" },
      nextTargetIdentity: null,
      shouldResetRetryCount: true,
    });
  });

  it("skips and resets retry count when already synced to the current identity", () => {
    const plan = planBrazeIdentitySync(baseParams, {
      targetIdentity: identity(),
      lastSyncedIdentity: identity(),
      hasPendingConsentTransition: false,
    });

    expect(plan.action).toEqual({ type: "skip" });
    expect(plan.shouldResetRetryCount).toBe(true);
  });

  it("skips without committing while a consent transition is already pending", () => {
    const plan = planBrazeIdentitySync(baseParams, {
      targetIdentity: identity(),
      lastSyncedIdentity: identity({ isTrackedUser: false }),
      hasPendingConsentTransition: true,
    });

    expect(plan.action).toEqual({ type: "skip" });
    expect(plan.nextTargetIdentity).toEqual(identity());
  });

  it("requests a consent transition when tracking flips and the feature is enabled", () => {
    const plan = planBrazeIdentitySync(baseParams, {
      targetIdentity: null,
      lastSyncedIdentity: identity({ isTrackedUser: false }),
      hasPendingConsentTransition: false,
    });

    expect(plan.action).toEqual({
      type: "consentTransition",
      identity: identity(),
    });
    expect(plan.nextTargetIdentity).toEqual(identity());
    expect(plan.shouldResetRetryCount).toBe(true);
  });

  it("requests a direct sync when the feature flag is disabled", () => {
    const plan = planBrazeIdentitySync(
      { ...baseParams, brazeOptOutIdentityCleanupEnabled: false },
      {
        targetIdentity: null,
        lastSyncedIdentity: identity({
          isTrackedUser: false,
          brazeOptOutIdentityCleanup: false,
        }),
        hasPendingConsentTransition: false,
      },
    );

    expect(plan.action).toEqual({
      type: "directSync",
      identity: identity({ brazeOptOutIdentityCleanup: false }),
    });
  });

  it("requests a direct sync on the first identification (no prior lastSyncedIdentity)", () => {
    const plan = planBrazeIdentitySync(baseParams, {
      targetIdentity: null,
      lastSyncedIdentity: null,
      hasPendingConsentTransition: false,
    });

    expect(plan.action).toEqual({ type: "directSync", identity: identity() });
    expect(plan.shouldResetRetryCount).toBe(true);
  });

  it("does not reset the retry count when the target identity is unchanged", () => {
    const plan = planBrazeIdentitySync(baseParams, {
      targetIdentity: identity(),
      lastSyncedIdentity: identity({ isTrackedUser: false }),
      hasPendingConsentTransition: false,
    });

    expect(plan.shouldResetRetryCount).toBe(false);
  });
});
