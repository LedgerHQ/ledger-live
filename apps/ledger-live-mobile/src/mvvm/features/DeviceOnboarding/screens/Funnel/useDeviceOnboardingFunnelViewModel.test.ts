import { renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useDeviceOnboarding, type DeviceOnboardingSession } from "../../hooks/useDeviceOnboarding";
import { useDeviceOnboardingFunnelViewModel } from "./useDeviceOnboardingFunnelViewModel";

jest.mock("../../hooks/useDeviceOnboarding", () => ({
  useDeviceOnboarding: jest.fn(),
}));

const useSession = jest.mocked(useDeviceOnboarding);
const send = jest.fn();

const device = {
  deviceId: "device-id",
  deviceName: "Ledger Stax",
  modelId: DeviceModelId.stax,
  wired: false,
};

function session(overrides: Partial<DeviceOnboardingSession> = {}): DeviceOnboardingSession {
  return {
    status: "running",
    device: null,
    liveDevice: device,
    state: "checks.firmwareCheck",
    context: null,
    events: [],
    exit: null,
    sendableEvents: [],
    error: null,
    connect: jest.fn(),
    send,
    reset: jest.fn(),
    ...overrides,
  };
}

describe("useDeviceOnboardingFunnelViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(["readingState", "legacyFallback", "done", "syncOffer"])(
    "should keep Checks unmounted while the machine is in %s",
    state => {
      useSession.mockReturnValue(session({ state }));

      const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

      expect(result.current).toBeNull();
    },
  );

  it("should keep Checks unmounted until a device is connected", () => {
    useSession.mockReturnValue(session({ liveDevice: null, state: "checks.checksIdle" }));

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(result.current).toBeNull();
  });

  it.each(["checks.firmwareCheck", "checks.firmwareUpdateOffered", "checks.checksSucceeded"])(
    "should quit from %s by sending QUIT",
    state => {
      useSession.mockReturnValue(
        session({
          state,
          context: {
            firmwareVersion: "1.0.0",
            availableFirmwareVersion: "1.1.0",
            checksPaused: false,
          } as DeviceOnboardingSession["context"],
        }),
      );

      const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

      result.current?.onQuit();

      expect(send).toHaveBeenCalledWith({ type: "QUIT" });
      expect(result.current?.update).toEqual({ current: "1.0.0", available: "1.1.0" });
    },
  );

  it("should forward each checks action as the event the machine already understands", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.genuineCheck.awaitingApproval",
        context: {
          genuineFailureKind: "GENUINE_CHECK_REFUSED",
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    result.current?.onStart();
    result.current?.onContinue();
    result.current?.onRetry();
    result.current?.onCloseSheet();
    result.current?.onAcceptUpdate();
    result.current?.onDeclineUpdate();

    expect(send.mock.calls).toEqual([
      [{ type: "CONTINUE" }],
      [{ type: "CONTINUE" }],
      [{ type: "RETRY" }],
      [{ type: "CLOSE" }],
      [{ type: "USER_ACCEPT" }],
      [{ type: "USER_DECLINE" }],
    ]);
    expect(result.current?.state).toBe("awaitingAllow");
    expect(result.current?.error).toEqual({ kind: "declined" });
    expect(useSession).toHaveBeenCalledWith(
      expect.objectContaining({ navigateOnExit: true, wasReadOnlyAtEntry: true }),
    );
  });
});
