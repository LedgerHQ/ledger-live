import {
  canAttemptSync,
  shouldSync,
  RATE_LIMIT_MS,
  clearLastFailureTime,
  setLastFailureTime,
  type SyncMiddlewareConfig,
} from "./middleware";
import { initialIdentitiesState, type IdentitiesState } from "@domain/entity-client-identity";

type State = { identities: IdentitiesState };

beforeEach(() => clearLastFailureTime());

const mockDeviceId = {} as any;

function makeState(overrides: Partial<IdentitiesState> = {}): State {
  return { identities: { ...initialIdentitiesState, ...overrides } };
}

const baseConfig: SyncMiddlewareConfig<State> = {
  pushDevicesServiceUrl: "https://push.test",
  getIdentitiesState: state => state.identities,
  getAnalyticsConsent: () => true,
  getUserId: async () => "user-1",
};

const readyState = makeState({
  deviceIds: [mockDeviceId],
  pushDevicesSyncState: "unsynced",
  pushDevicesServiceUrl: null,
});

describe("canAttemptSync", () => {
  it("returns true when no failure has occurred", () => {
    expect(canAttemptSync()).toBe(true);
  });

  it("returns false when a failure occurred recently", () => {
    setLastFailureTime(Date.now());
    expect(canAttemptSync()).toBe(false);
  });

  it("returns true when the failure is older than the rate limit", () => {
    setLastFailureTime(Date.now() - RATE_LIMIT_MS - 1);
    expect(canAttemptSync()).toBe(true);
  });
});

describe("shouldSync", () => {
  it("returns false when pushDevicesServiceUrl is empty", () => {
    expect(shouldSync(readyState, { ...baseConfig, pushDevicesServiceUrl: "" })).toBe(false);
  });

  it("returns false when rate-limited", () => {
    setLastFailureTime(Date.now());
    expect(shouldSync(readyState, baseConfig)).toBe(false);
  });

  it("returns false when analyticsConsent is false", () => {
    expect(shouldSync(readyState, { ...baseConfig, getAnalyticsConsent: () => false })).toBe(false);
  });

  it("returns false when userId is dummy and getUserId is not provided", () => {
    const config: SyncMiddlewareConfig<State> = { ...baseConfig, getUserId: undefined };
    expect(shouldSync(readyState, config)).toBe(false);
  });

  it("returns false when deviceIds is empty", () => {
    expect(shouldSync(makeState({ pushDevicesSyncState: "unsynced" }), baseConfig)).toBe(false);
  });

  it("returns false when already synced with the same URL", () => {
    const state = makeState({
      deviceIds: [mockDeviceId],
      pushDevicesSyncState: "synced",
      pushDevicesServiceUrl: "https://push.test",
    });
    expect(shouldSync(state, baseConfig)).toBe(false);
  });

  it("returns true when URL changed (stale persisted URL)", () => {
    const state = makeState({
      deviceIds: [mockDeviceId],
      pushDevicesSyncState: "synced",
      pushDevicesServiceUrl: "https://old-push.test",
    });
    expect(shouldSync(state, baseConfig)).toBe(true);
  });

  it("returns true when unsynced and all conditions are met", () => {
    expect(shouldSync(readyState, baseConfig)).toBe(true);
  });
});
