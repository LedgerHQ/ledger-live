import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SessionRefresherManager } from "./SessionRefresherManager";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";

const createMockDMK = (tracker: { called: boolean }) => ({
  disableDeviceSessionRefresher: vi.fn(() => {
    return () => {
      tracker.called = true;
    };
  }),
});

describe("SessionRefresherManager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    SessionRefresherManager.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should disable refresher on disableIfNeeded when currently enabled", () => {
    // given
    const tracker = { called: false };
    //@ts-expect-error partial mock
    const mockedSDK: DeviceManagementKit = createMockDMK(tracker);
    const sessionId = "session1";

    // when
    SessionRefresherManager.disableIfNeeded(mockedSDK, sessionId);

    // then
    const state = SessionRefresherManager.getState();
    expect(state.enabled).toBe(false);
    expect(state.sessionId).toBe(sessionId);
    expect(state.pending).toBe(1);
    expect(typeof state.blockerId).toBe("string");
    expect(state.enableFn).not.toBeNull();
  });

  it("should update pending and session when already disabled", () => {
    // given
    const tracker = { called: false };
    //@ts-expect-error partial mock
    const mockedSDK: DeviceManagementKit = createMockDMK(tracker);
    const sessionId = "session1";
    SessionRefresherManager.disableIfNeeded(mockedSDK, sessionId);
    const initialState = SessionRefresherManager.getState();
    const initialPending = initialState.pending;

    // when
    SessionRefresherManager.disableIfNeeded(mockedSDK, sessionId);

    // then
    const state = SessionRefresherManager.getState();
    expect(state.pending).toBe(initialPending + 1);
    expect(state.sessionId).toBe(sessionId);
  });

  it("should force enable previous session when disabling with a new sessionId", () => {
    // given
    const tracker1 = { called: false };
    //@ts-expect-error partial mock
    const mockedSDK1: DeviceManagementKit = createMockDMK(tracker1);
    SessionRefresherManager.disableIfNeeded(mockedSDK1, "session1");
    const stateAfterFirstDisable = SessionRefresherManager.getState();
    expect(stateAfterFirstDisable.sessionId).toBe("session1");

    // when
    const tracker2 = { called: false };
    //@ts-expect-error partial mock
    const mockedSDK2: DeviceManagementKit = createMockDMK(tracker2);
    SessionRefresherManager.disableIfNeeded(mockedSDK2, "session2");

    // then
    expect(tracker1.called).toBe(true);
    const state = SessionRefresherManager.getState();
    expect(state.enabled).toBe(false);
    expect(state.sessionId).toBe("session2");
    expect(state.pending).toBe(1);
    expect(typeof state.blockerId).toBe("string");
  });

  it("should schedule a timer on maybeEnable when pending becomes 0", () => {
    // given
    const tracker = { called: false };
    //@ts-expect-error partial mock
    const mockedSDK: DeviceManagementKit = createMockDMK(tracker);
    const sessionId = "session1";
    SessionRefresherManager.disableIfNeeded(mockedSDK, sessionId);

    // when
    SessionRefresherManager.maybeEnable();

    // then
    let state = SessionRefresherManager.getState();
    expect(state.pending).toBe(0);
    expect(state.timer).not.toBeNull();

    // when
    vi.runAllTimers();

    // then
    state = SessionRefresherManager.getState();
    expect(tracker.called).toBe(true);
    expect(state.enabled).toBe(true);
    expect(state.sessionId).toBeNull();
    expect(state.pending).toBe(0);
    expect(state.timer).toBeNull();
  });

  it("should not schedule timer if pending is not 0 on maybeEnable", () => {
    // given
    const tracker = { called: false };
    //@ts-expect-error partial mock
    const mockedSDK: DeviceManagementKit = createMockDMK(tracker);
    const sessionId = "session1";
    SessionRefresherManager.disableIfNeeded(mockedSDK, sessionId);
    SessionRefresherManager.disableIfNeeded(mockedSDK, sessionId); // pending now 2

    // when
    SessionRefresherManager.maybeEnable();

    // then
    const state = SessionRefresherManager.getState();
    expect(state.pending).toBe(1);
    expect(state.timer).toBeNull();
  });

  it("should force enable immediately when forceEnable is called", () => {
    // given
    const tracker = { called: false };
    //@ts-expect-error partial mock
    const mockedSDK: DeviceManagementKit = createMockDMK(tracker);
    const sessionId = "session1";
    SessionRefresherManager.disableIfNeeded(mockedSDK, sessionId);

    // when
    SessionRefresherManager.forceEnable();

    // then
    const state = SessionRefresherManager.getState();
    expect(tracker.called).toBe(true);
    expect(state.enabled).toBe(true);
    expect(state.sessionId).toBeNull();
    expect(state.pending).toBe(0);
    expect(state.timer).toBeNull();
  });

  it("should reset the manager on reset", () => {
    // given
    const tracker = { called: false };
    //@ts-expect-error partial mock
    const mockedSDK: DeviceManagementKit = createMockDMK(tracker);
    const sessionId = "session1";
    SessionRefresherManager.disableIfNeeded(mockedSDK, sessionId);
    SessionRefresherManager.maybeEnable(); // schedule timer

    // when
    SessionRefresherManager.reset();

    // then
    const state = SessionRefresherManager.getState();
    expect(state).toEqual({
      enabled: true,
      sessionId: null,
      blockerId: null,
      pending: 0,
      enableFn: null,
      timer: null,
    });
  });

  it("should handle TIMER_EXPIRED without changing state if pending > 0", () => {
    // given
    const tracker = { called: false };
    //@ts-expect-error partial mock
    const mockedSDK: DeviceManagementKit = createMockDMK(tracker);
    const sessionId = "session1";
    SessionRefresherManager.disableIfNeeded(mockedSDK, sessionId);
    SessionRefresherManager.disableIfNeeded(mockedSDK, sessionId); // pending becomes 2

    // when
    SessionRefresherManager.dispatch({ type: "TIMER_EXPIRED" });

    // then
    const state = SessionRefresherManager.getState();
    expect(state.pending).toBe(2);
    expect(tracker.called).toBe(false);
  });
});
