import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SessionRefresherManager } from "./SessionRefresherManager";

// A helper to create a mock DeviceManagementKit with the disable method.
const createSdkMock = () => {
  const enableMock = vi.fn();
  return {
    disableDeviceSessionRefresher: vi.fn(() => enableMock),
    get enableMock() {
      return enableMock;
    },
  };
};

describe("SessionRefresherManager comprehensive tests", () => {
  let sdk: ReturnType<typeof createSdkMock>;
  let manager: SessionRefresherManager;

  beforeEach(() => {
    sdk = createSdkMock();
    manager = SessionRefresherManager.getInstance();
    manager.reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("should clear any scheduled timer when reset() is called", () => {
    // given
    manager.disableIfNeeded(sdk as any, "session1");
    manager.maybeEnable();
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    // when
    manager.reset();

    // then
    expect(clearTimeoutSpy).toHaveBeenCalled();
    vi.advanceTimersByTime(3000);
    expect(sdk.enableMock).not.toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it("should cancel any scheduled enable timer when disableIfNeeded is called", () => {
    // given
    manager.disableIfNeeded(sdk as any, "session1");
    manager.maybeEnable();
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    // when
    manager.disableIfNeeded(sdk as any, "session1");

    // then
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it("should call disableDeviceSessionRefresher on first disableIfNeeded call", () => {
    // given
    manager.disableIfNeeded(sdk as any, "session1");

    // then
    const calls = sdk.disableDeviceSessionRefresher.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    if (calls.length > 0 && calls[0].length > 0) {
      if (calls[0]) {
        //@ts-expect-error calls[0] is an array
        const callArg = calls[0][0];
        expect(callArg).toHaveProperty("sessionId", "session1");
        expect(callArg).toHaveProperty("blockerId");
        //@ts-expect-error blockerId is a string
        expect(typeof callArg.blockerId).toBe("string");
      }
    }

    // given
    manager.disableIfNeeded(sdk as any, "session1");

    // then
    expect(sdk.disableDeviceSessionRefresher).toHaveBeenCalledTimes(1);
  });

  it("should force-enable the previous refresher when session changes", () => {
    // given
    manager.disableIfNeeded(sdk as any, "session1");

    // when
    manager.disableIfNeeded(sdk as any, "session2");

    // then
    expect(sdk.enableMock).toHaveBeenCalledTimes(1);
    expect(sdk.disableDeviceSessionRefresher).toHaveBeenCalledTimes(2);
  });

  it("should schedule enabling when maybeEnable is called and pending count is zero", () => {
    // given
    manager.disableIfNeeded(sdk as any, "session1");

    // when
    manager.maybeEnable();

    // then
    expect(sdk.enableMock).not.toHaveBeenCalled();
    // when 3000ms pass.
    vi.advanceTimersByTime(3000);
    // then
    expect(sdk.enableMock).toHaveBeenCalledTimes(1);
  });

  it("should not schedule timer if pendingCount is not zero", () => {
    // given
    manager.disableIfNeeded(sdk as any, "session1");
    manager.disableIfNeeded(sdk as any, "session1");

    // when
    manager.maybeEnable();

    // then
    vi.advanceTimersByTime(3000);
    expect(sdk.enableMock).not.toHaveBeenCalled();
  });

  it("should cancel any scheduled timer when forceEnable() is called", () => {
    // given
    manager.disableIfNeeded(sdk as any, "session1");
    manager.maybeEnable();
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    // when
    manager.forceEnable();

    // then
    expect(sdk.enableMock).toHaveBeenCalledTimes(1);
    expect(clearTimeoutSpy).toHaveBeenCalled();
    vi.advanceTimersByTime(3000);
    expect(sdk.enableMock).toHaveBeenCalledTimes(1);

    clearTimeoutSpy.mockRestore();
  });

  it("should do nothing in forceEnable() if refresher is already enabled", () => {
    // given
    manager.forceEnable();

    // then
    expect(sdk.enableMock).not.toHaveBeenCalled();
  });
});
