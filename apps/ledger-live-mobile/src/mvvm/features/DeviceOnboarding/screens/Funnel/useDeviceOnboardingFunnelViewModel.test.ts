import { act, renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import type { State } from "~/reducers/types";
import type { DeviceOnboardingSession } from "LLM/features/DeviceOnboarding/hooks/useDeviceOnboarding";
import type { DeviceOnboardingHost } from "LLM/features/DeviceOnboarding/hooks/DeviceOnboardingProvider";
import { useDeviceOnboardingSession } from "LLM/features/DeviceOnboarding/hooks/DeviceOnboardingProvider";
import { useDeviceOnboardingFunnelViewModel } from "./useDeviceOnboardingFunnelViewModel";

const goBack = jest.fn();
type RemovalEvent = {
  preventDefault: () => void;
  data: { action: { type: string } };
};
const listeners = new Map<string, (event: RemovalEvent) => void>();
let mockRouteParams: { pairedDeviceId?: string; wasReadOnlyAtEntry: boolean } = {
  wasReadOnlyAtEntry: true,
};

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual<typeof import("@react-navigation/native")>("@react-navigation/native"),
  useNavigation: () => ({
    goBack,
    addListener: (event: string, handler: (event: RemovalEvent) => void) => {
      listeners.set(event, handler);
      return jest.fn();
    },
  }),
  useRoute: () => ({ params: mockRouteParams }),
}));

jest.mock("../../hooks/DeviceOnboardingProvider", () => {
  const recorded = {
    host: null as DeviceOnboardingHost | null,
  };
  return {
    recorded,
    useDeviceOnboardingSession: jest.fn(),
    useDeviceOnboardingHost: (host: DeviceOnboardingHost) => {
      recorded.host = host;
    },
  };
});

const { recorded } = jest.requireMock("../../hooks/DeviceOnboardingProvider") as {
  recorded: { host: DeviceOnboardingHost | null };
};
jest.mock("../../hooks/useFirmwareUpdateHandover", () => {
  const actual = jest.requireActual("../../hooks/useFirmwareUpdateHandover");
  return {
    ...actual,
    useFirmwareUpdateHandover: () => ({ close: closeFirmwareHandover }),
  };
});

const closeFirmwareHandover = jest.fn();
const useSession = jest.mocked(useDeviceOnboardingSession);
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
    snapshot: null,
    exit: null,
    sendableEvents: [],
    error: null,
    connect: jest.fn(),
    adopt: jest.fn(),
    discard: jest.fn(),
    send,
    reset: jest.fn(),
    reconnectAfterUpdate: jest.fn(),
    abortFirmwareReconnect: jest.fn(),
    actorRef: { current: null },
    portsRef: { current: null },
    ...overrides,
  };
}

function checksModel(model: ReturnType<typeof useDeviceOnboardingFunnelViewModel>) {
  if (model.status !== "checks") throw new Error(model.status);
  return model;
}

function checksOf(model: ReturnType<typeof useDeviceOnboardingFunnelViewModel>) {
  return checksModel(model).checks;
}

describe("useDeviceOnboardingFunnelViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listeners.clear();
    mockRouteParams = { wasReadOnlyAtEntry: true };
    recorded.host = null;
  });

  it.each([
    ["the paired device", "paired-id", ["paired-id"]],
    ["the USB device stored without its compatibility prefix", "usb|paired-id", ["paired-id"]],
    ["every known device when the paired one is unknown", "other-id", ["paired-id", "nearby-id"]],
  ])("should connect to %s", (_, pairedDeviceId, expectedIds) => {
    mockRouteParams = { pairedDeviceId, wasReadOnlyAtEntry: false };
    useSession.mockReturnValue(session());

    renderHook(() => useDeviceOnboardingFunnelViewModel(), {
      overrideInitialState: (state: State) => ({
        ...state,
        knownDevices: {
          knownDevices: [
            { id: "paired-id", name: "Paired Stax" },
            { id: "nearby-id", name: "Nearby Stax" },
          ] as KnownDevice[],
        },
      }),
    });

    const input = recorded.host;
    expect(input?.knownDevices.map(known => known.id)).toEqual(expectedIds);
    expect(input?.wasReadOnlyAtEntry).toBe(false);
  });

  it.each([
    ["checks.genuineFailed", "GENUINE_CHECK_FAILED", { kind: "unknown" }],
    ["checks.notGenuineSupport", "DEVICE_NOT_GENUINE", { kind: "notGenuine" }],
    ["checks.firmwareCheckFailed", null, { kind: "unknown" }],
  ])("should surface the stopped check in %s", (state, genuineFailureKind, error) => {
    useSession.mockReturnValue(
      session({
        state,
        context: { genuineFailureKind, checksPaused: false } as DeviceOnboardingSession["context"],
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(checksOf(result.current).error).toEqual(error);
  });

  it.each([
    "readingState",
    "legacyFallback",
    "done",
    "syncOffer",
    "deviceLocked",
    "deviceSetup.pin",
  ])("should show synchronizing instead of connecting while the machine is in %s", state => {
    useSession.mockReturnValue(session({ state }));

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(checksOf(result.current).state).toBe("synchronizing");
  });

  it("should show the screen the machine already chose without connecting again", () => {
    const connect = jest.fn();
    useSession.mockReturnValue(session({ state: "awaitingStart", connect }));

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(connect).not.toHaveBeenCalled();
    expect(checksOf(result.current).state).toBe("idle");
  });

  it("should keep Checks unmounted until a device is connected", () => {
    useSession.mockReturnValue(session({ liveDevice: null, state: "checks.checksIdle" }));

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(result.current.status).toBe("connecting");
  });

  it("should reconnect a lost session without restarting onboarding", () => {
    const connect = jest.fn();
    const reset = jest.fn();
    useSession.mockReturnValue(
      session({ state: "awaitingSession", liveDevice: null, connect, reset }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    if (result.current.status !== "failed") throw new Error(result.current.status);

    result.current.onRetry();

    expect(connect).toHaveBeenCalledTimes(1);
    expect(reset).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("should quit the machine when Android back leaves a running check", () => {
    useSession.mockReturnValue(session({ state: "checks.firmwareCheck" }));
    renderHook(() => useDeviceOnboardingFunnelViewModel());
    const preventDefault = jest.fn();

    listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: "QUIT" });
    expect(goBack).not.toHaveBeenCalled();
  });

  it("should quit the machine when Android back leaves the firmware offer", () => {
    useSession.mockReturnValue(session({ state: "checks.firmwareUpdateOffered" }));
    renderHook(() => useDeviceOnboardingFunnelViewModel());
    const preventDefault = jest.fn();
    const back = () =>
      listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });

    back();

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: "QUIT" });
    expect(goBack).not.toHaveBeenCalled();

    recorded.host?.onLeave?.();
    back();
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it("should close the firmware handover when Android back happens while it opens", () => {
    useSession.mockReturnValue(session({ state: "checks.firmwareUpdateDelegated" }));
    renderHook(() => useDeviceOnboardingFunnelViewModel());
    const preventDefault = jest.fn();
    const back = () =>
      listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });

    back();
    back();

    expect(preventDefault).toHaveBeenCalledTimes(2);
    expect(closeFirmwareHandover).toHaveBeenCalledTimes(2);
    expect(send).not.toHaveBeenCalled();
    expect(goBack).not.toHaveBeenCalled();

    recorded.host?.onLeave?.();
    back();
    expect(preventDefault).toHaveBeenCalledTimes(2);
  });

  it("should keep blocking Android back until the machine leaves", () => {
    useSession.mockReturnValue(session({ state: "checks.firmwareCheck" }));
    renderHook(() => useDeviceOnboardingFunnelViewModel());
    const preventDefault = jest.fn();
    const back = () =>
      listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });

    back();
    back();
    expect(preventDefault).toHaveBeenCalledTimes(2);

    recorded.host?.onLeave?.();
    back();
    expect(preventDefault).toHaveBeenCalledTimes(2);
  });

  it("should wait for the device on the connecting screen after a completed update", () => {
    const abortFirmwareReconnect = jest.fn();
    useSession.mockReturnValue(
      session({
        state: "awaitingSessionAfterFirmwareUpdate",
        abortFirmwareReconnect,
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    if (result.current.status !== "connecting") throw new Error(result.current.status);

    result.current.onQuit();

    expect(abortFirmwareReconnect).toHaveBeenCalledTimes(1);
    expect(goBack).not.toHaveBeenCalled();
    expect(closeFirmwareHandover).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("should retry without closing the handover when reconnecting after the update fails", () => {
    const connect = jest.fn();
    useSession.mockReturnValue(
      session({
        state: "awaitingSessionAfterFirmwareUpdate",
        error: "Unable to connect to the device",
        connect,
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    if (result.current.status !== "failed") throw new Error(result.current.status);

    connect.mockClear();
    result.current.onRetry();

    expect(connect).toHaveBeenCalledTimes(1);
    expect(closeFirmwareHandover).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("should abort the reconnect when back is pressed while the device is connecting", () => {
    const abortFirmwareReconnect = jest.fn();
    const reset = jest.fn();
    useSession.mockReturnValue(
      session({
        status: "connecting",
        state: "awaitingSessionAfterFirmwareUpdate",
        abortFirmwareReconnect,
        reset,
      }),
    );
    renderHook(() => useDeviceOnboardingFunnelViewModel());
    const preventDefault = jest.fn();

    listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });

    expect(abortFirmwareReconnect).toHaveBeenCalledTimes(1);
    expect(reset).not.toHaveBeenCalled();
    expect(goBack).not.toHaveBeenCalled();
  });

  it("should leave instead of closing the handover when back is pressed while reconnecting", () => {
    const abortFirmwareReconnect = jest.fn();
    useSession.mockReturnValue(
      session({
        state: "awaitingSessionAfterFirmwareUpdate",
        abortFirmwareReconnect,
      }),
    );
    renderHook(() => useDeviceOnboardingFunnelViewModel());
    const preventDefault = jest.fn();

    listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(abortFirmwareReconnect).toHaveBeenCalledTimes(1);
    expect(goBack).not.toHaveBeenCalled();
    expect(closeFirmwareHandover).not.toHaveBeenCalled();
  });

  it("should close the firmware handover from the waiting screen", () => {
    useSession.mockReturnValue(session({ state: "checks.firmwareUpdateDelegated" }));

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const checks = checksOf(result.current);

    expect(checks.state).toBe("checking");
    checks.onQuit?.();

    expect(closeFirmwareHandover).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
  });

  it("should keep the screen under the unlock sheet when the device locks", () => {
    const firmware = {
      firmwareVersion: "1.0.0",
      availableFirmwareVersion: "1.1.0",
      checksPaused: false,
    } as DeviceOnboardingSession["context"];
    useSession.mockReturnValue(
      session({ state: "checks.firmwareUpdateOffered", context: firmware }),
    );
    const { result, rerender } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(checksOf(result.current).state).toBe("updating");
    expect(checksModel(result.current).unlockSheet).toBeNull();

    useSession.mockReturnValue(session({ state: "deviceLocked", context: firmware }));
    rerender(undefined as never);

    const locked = checksModel(result.current);
    expect(locked.checks.state).toBe("updating");
    expect(locked.checks.update).toEqual({ current: "1.0.0", available: "1.1.0" });
    expect(locked.checks.suspendSheets).toBe(true);
    expect(locked.unlockSheet).toEqual({
      deviceModelId: DeviceModelId.stax,
      deviceName: "Ledger Stax",
    });

    useSession.mockReturnValue(session({ state: "readingState", context: firmware }));
    rerender(undefined as never);

    const reading = checksModel(result.current);
    expect(reading.checks.state).toBe("updating");
    expect(reading.checks.suspendSheets).toBe(true);
    expect(reading.unlockSheet).toBeNull();

    useSession.mockReturnValue(session({ state: "checks.checksSucceeded", context: firmware }));
    rerender(undefined as never);

    expect(checksOf(result.current).state).toBe("succeeded");
    expect(checksModel(result.current).unlockSheet).toBeNull();
  });

  it("should drop the locked screen when the connection is lost", () => {
    const firmware = {
      firmwareVersion: "1.0.0",
      availableFirmwareVersion: "1.1.0",
      checksPaused: false,
    } as DeviceOnboardingSession["context"];
    useSession.mockReturnValue(
      session({ state: "checks.firmwareUpdateOffered", context: firmware }),
    );
    const { result, rerender } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    useSession.mockReturnValue(session({ state: "deviceLocked", context: firmware }));
    rerender(undefined as never);
    useSession.mockReturnValue(session({ state: "awaitingSession", liveDevice: null }));
    rerender(undefined as never);

    expect(result.current.status).toBe("failed");

    useSession.mockReturnValue(session({ state: "deviceLocked", context: null }));
    rerender(undefined as never);

    const locked = checksModel(result.current);
    expect(locked.checks.state).toBe("synchronizing");
    expect(locked.checks.update).toBeNull();
    expect(locked.unlockSheet).toEqual({
      deviceModelId: DeviceModelId.stax,
      deviceName: "Ledger Stax",
    });
  });

  it("should show the reconnected device when it locks before its session is ready", () => {
    const firmware = {
      firmwareVersion: "1.0.0",
      availableFirmwareVersion: "1.1.0",
      checksPaused: false,
    } as DeviceOnboardingSession["context"];
    useSession.mockReturnValue(
      session({ state: "checks.firmwareUpdateOffered", context: firmware }),
    );
    const { result, rerender } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    useSession.mockReturnValue(session({ state: "deviceLocked", context: firmware }));
    rerender(undefined as never);
    useSession.mockReturnValue(session({ state: "awaitingSession", liveDevice: null }));
    rerender(undefined as never);

    const reconnected = {
      deviceId: "other-device",
      deviceName: "Nano X",
      modelId: DeviceModelId.nanoX,
      wired: false,
    };
    useSession.mockReturnValue(session({ state: "deviceLocked", liveDevice: reconnected }));
    rerender(undefined as never);

    const locked = checksModel(result.current);
    expect(locked.checks.device.deviceId).toBe("other-device");
    expect(locked.checks.state).toBe("synchronizing");
    expect(locked.unlockSheet).toEqual({
      deviceModelId: DeviceModelId.nanoX,
      deviceName: "Nano X",
    });
  });

  it("should keep the locked screen's close when the device locks during a check", () => {
    useSession.mockReturnValue(session({ state: "checks.firmwareUpdateDelegated" }));
    const { result, rerender } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    useSession.mockReturnValue(session({ state: "deviceLocked" }));
    rerender(undefined as never);

    checksOf(result.current).onQuit?.();

    expect(closeFirmwareHandover).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
  });

  it("should hide the firmware offer while the device is locked", () => {
    useSession.mockReturnValue(
      session({
        state: "deviceLocked",
        context: {
          firmwareVersion: "1.0.0",
          availableFirmwareVersion: "1.1.0",
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const checks = checksOf(result.current);

    expect(checks.state).toBe("synchronizing");
    expect(checks.update).toBeNull();
    expect(checks.suspendSheets).toBe(true);
    expect(checksModel(result.current).unlockSheet).toEqual({
      deviceModelId: DeviceModelId.stax,
      deviceName: "Ledger Stax",
    });
  });

  it("should quit the machine when closing while the device is locked", () => {
    const reset = jest.fn();
    useSession.mockReturnValue(session({ state: "deviceLocked", reset }));

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    checksOf(result.current).onQuit?.();

    expect(send).toHaveBeenCalledWith({ type: "QUIT" });
    expect(reset).not.toHaveBeenCalled();
    expect(goBack).not.toHaveBeenCalled();
  });

  it("should leave the funnel when closing before the machine has a state", () => {
    const reset = jest.fn();
    useSession.mockReturnValue(
      session({ status: "connecting", state: null, liveDevice: null, reset }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    if (result.current.status !== "connecting") throw new Error(result.current.status);

    result.current.onQuit();

    expect(reset).toHaveBeenCalledTimes(1);
    expect(goBack).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
  });

  it("should leave the funnel when Android back happens before the machine starts", () => {
    const reset = jest.fn();
    useSession.mockReturnValue(
      session({ status: "connecting", state: null, liveDevice: null, reset }),
    );
    renderHook(() => useDeviceOnboardingFunnelViewModel());
    const preventDefault = jest.fn();

    listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "POP" } } });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(goBack).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
  });

  it("should let the machine reset the navigation when onboarding completes", () => {
    useSession.mockReturnValue(session({ state: "checks.firmwareCheck" }));
    renderHook(() => useDeviceOnboardingFunnelViewModel());
    const preventDefault = jest.fn();

    listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "RESET" } } });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("should offer a way out when the connection fails", () => {
    const reset = jest.fn();
    const connect = jest.fn();
    useSession.mockReturnValue(
      session({ liveDevice: null, state: null, error: "no-known-device", reset, connect }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    if (result.current.status !== "failed") throw new Error(result.current.status);

    result.current.onRetry();
    expect(reset).toHaveBeenCalledTimes(1);
    expect(connect).toHaveBeenCalledTimes(1);

    result.current.onQuit();
    expect(goBack).toHaveBeenCalledTimes(1);
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
      const checks = checksOf(result.current);

      checks.onQuit?.();

      expect(send).toHaveBeenCalledWith({ type: "QUIT" });
      expect(checks.update).toEqual({ current: "1.0.0", available: "1.1.0" });
    },
  );

  it("should resume the machine when the lost session is ready again", () => {
    useSession.mockReturnValue(
      session({
        state: "awaitingSession",
        liveDevice: null,
        sendableEvents: [
          { event: { type: "SESSION_READY" } },
        ] as DeviceOnboardingSession["sendableEvents"],
      }),
    );

    renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(send).toHaveBeenCalledWith({ type: "SESSION_READY" });
  });

  it("should resume a paused check with RETRY", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.checksIdle",
        context: { checksPaused: true } as DeviceOnboardingSession["context"],
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    checksOf(result.current).onStart();

    expect(send).toHaveBeenCalledWith({ type: "RETRY" });
  });

  it("should close a failed check with CLOSE", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.genuineFailed",
        context: {
          genuineFailureKind: "GENUINE_CHECK_REFUSED",
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    checksOf(result.current).onCloseSheet();

    expect(send).toHaveBeenCalledWith({ type: "CLOSE" });
  });

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
    const checks = checksOf(result.current);

    checks.onStart();
    checks.onRetry();
    checks.onAcceptUpdate();
    checks.onDeclineUpdate();

    expect(send.mock.calls).toEqual([
      [{ type: "CONTINUE" }],
      [{ type: "RETRY" }],
      [{ type: "USER_ACCEPT" }],
      [{ type: "USER_DECLINE" }],
    ]);
    expect(checks.state).toBe("awaitingAllow");
    expect(checks.error).toBeNull();
    expect(recorded.host?.wasReadOnlyAtEntry).toBe(true);
  });

  it("should keep the success screen up while a seeded device leaves for Ledger Sync", () => {
    useSession.mockReturnValue(
      session({
        state: "syncOffer",
        status: "exited",
        context: {
          onboardedOnEntry: true,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const checks = checksOf(result.current);

    expect(checks.state).toBe("succeeded");
    expect(checks.onContinue).toBeUndefined();
  });

  it("should show synchronizing when an unseeded device leaves for Ledger Sync", () => {
    useSession.mockReturnValue(
      session({
        state: "syncOffer",
        status: "exited",
        context: {
          onboardedOnEntry: false,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(checksOf(result.current).state).toBe("synchronizing");
  });

  it.each([
    [true, true],
    [false, false],
    [undefined, false],
  ] as const)(
    "should tell the success screen the firmware is current only when the machine says so (%s)",
    (firmwareUpToDate, expected) => {
      useSession.mockReturnValue(
        session({
          state: "checks.checksSucceeded",
          context: { firmwareUpToDate, checksPaused: false } as DeviceOnboardingSession["context"],
        }),
      );

      const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

      expect(checksOf(result.current).firmwareUpToDate).toBe(expected);
    },
  );

  it("should leave the success screen when the user continues", () => {
    useSession.mockReturnValue(session({ state: "checks.checksSucceeded" }));

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    checksOf(result.current).onContinue?.();

    expect(send).toHaveBeenCalledWith({ type: "CONTINUE" });
  });

  it("should withhold continue while the device is still leaving its check screen", () => {
    useSession.mockReturnValue(session({ state: "checks.leavingEarlyCheckScreen" }));

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const checks = checksOf(result.current);

    expect(checks.state).toBe("succeeded");
    expect(checks.onContinue).toBeUndefined();
  });

  it("should show the karaoke close when an unseeded device is waiting to start", () => {
    useSession.mockReturnValue(
      session({
        state: "awaitingStart",
        context: {
          onboardedOnEntry: false,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const screen = result.current;
    if (screen.status !== "unseededIntroKaraoke") throw new Error(screen.status);

    act(() => screen.unseededIntroKaraoke.onClose());

    expect(send).not.toHaveBeenCalled();
    expect(result.current.quitConfirmation?.isOpen).toBe(true);
  });

  it("should send one CONTINUE when the karaoke finishes", () => {
    useSession.mockReturnValue(
      session({
        state: "awaitingStart",
        context: {
          onboardedOnEntry: false,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const screen = result.current;
    if (screen.status !== "unseededIntroKaraoke") throw new Error(screen.status);

    act(() => screen.unseededIntroKaraoke.onFinish());

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: "CONTINUE" });
  });

  it("should keep the intro under the unlock sheet when the device locks", () => {
    const unseededContext = {
      onboardedOnEntry: false,
      checksPaused: false,
    } as DeviceOnboardingSession["context"];
    useSession.mockReturnValue(session({ state: "awaitingStart", context: unseededContext }));
    const { result, rerender } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    useSession.mockReturnValue(session({ state: "deviceLocked", context: unseededContext }));
    rerender(undefined as never);

    const locked = result.current;
    if (locked.status !== "unseededIntroKaraoke") throw new Error(locked.status);
    expect(locked.unseededIntroKaraoke.suspendSheets).toBe(true);
    expect(locked.unlockSheet).toEqual({
      deviceModelId: DeviceModelId.stax,
      deviceName: "Ledger Stax",
    });
    act(() => locked.unseededIntroKaraoke.onFinish());
    expect(send).not.toHaveBeenCalled();

    useSession.mockReturnValue(session({ state: "readingState", context: unseededContext }));
    rerender(undefined as never);

    expect(result.current.status).toBe("unseededIntroKaraoke");

    useSession.mockReturnValue(session({ state: "awaitingStart", context: unseededContext }));
    rerender(undefined as never);

    const unlocked = result.current;
    if (unlocked.status !== "unseededIntroKaraoke") throw new Error(unlocked.status);
    expect(unlocked.unlockSheet).toBeNull();
    act(() => unlocked.unseededIntroKaraoke.onFinish());
    expect(send).toHaveBeenCalledWith({ type: "CONTINUE" });
  });

  it("should suspend the intro sheets while the quit confirmation is open", () => {
    useSession.mockReturnValue(
      session({
        state: "awaitingStart",
        context: {
          onboardedOnEntry: false,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );
    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const screen = result.current;
    if (screen.status !== "unseededIntroKaraoke") throw new Error(screen.status);
    expect(screen.unseededIntroKaraoke.suspendSheets).toBe(false);

    act(() => screen.unseededIntroKaraoke.onClose());

    const confirming = result.current;
    if (confirming.status !== "unseededIntroKaraoke") throw new Error(confirming.status);
    expect(confirming.quitConfirmation?.isOpen).toBe(true);
    expect(confirming.unseededIntroKaraoke.suspendSheets).toBe(true);
    expect(send).not.toHaveBeenCalled();
  });

  it("should keep the checks screen when a seeded device is waiting to start", () => {
    useSession.mockReturnValue(
      session({
        state: "awaitingStart",
        context: {
          onboardedOnEntry: true,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(checksOf(result.current).state).toBe("idle");
    expect(result.current.quitConfirmation?.isOpen).toBe(false);
  });

  it("should ask before the header close leaves a seeded device's checks", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.firmwareCheck",
        context: {
          onboardedOnEntry: true,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );
    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    act(() => checksOf(result.current).onQuit?.());

    expect(send).not.toHaveBeenCalled();
    expect(result.current.quitConfirmation?.isOpen).toBe(true);
  });

  it("should ask before Android back leaves a seeded device's checks", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.firmwareCheck",
        context: {
          onboardedOnEntry: true,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );
    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const preventDefault = jest.fn();

    act(() => {
      listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
    expect(result.current.quitConfirmation?.isOpen).toBe(true);
  });

  it("should release the error sheet while Android back asks to leave a seeded device", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.genuineFailed",
        context: {
          onboardedOnEntry: true,
          genuineFailureKind: "GENUINE_CHECK_REFUSED",
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );
    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const preventDefault = jest.fn();
    expect(checksOf(result.current).suspendSheets).toBeFalsy();

    act(() => {
      listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });
    });

    expect(result.current.quitConfirmation?.isOpen).toBe(true);
    expect(checksOf(result.current).suspendSheets).toBe(true);
    expect(send).not.toHaveBeenCalled();

    act(() => result.current.quitConfirmation?.onContinue());

    expect(result.current.quitConfirmation?.isOpen).toBe(false);
    expect(checksOf(result.current).suspendSheets).toBeFalsy();
    expect(send).not.toHaveBeenCalled();
  });

  it("should ask before leaving when an unseeded device's not genuine sheet is closed", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.notGenuineSupport",
        context: {
          onboardedOnEntry: false,
          genuineFailureKind: "DEVICE_NOT_GENUINE",
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );
    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    act(() => checksOf(result.current).onQuit?.());

    expect(send).not.toHaveBeenCalled();
    expect(result.current.quitConfirmation?.isOpen).toBe(true);
    expect(checksOf(result.current).suspendSheets).toBe(true);
  });

  it("should leave without asking once a seeded device's genuine check has a verdict", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.notGenuineSupport",
        context: {
          onboardedOnEntry: true,
          isGenuine: false,
          verdictMatchesSession: true,
          genuineFailureKind: "DEVICE_NOT_GENUINE",
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );
    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(result.current.quitConfirmation).toBeNull();

    act(() => checksOf(result.current).onQuit?.());

    expect(send).toHaveBeenCalledWith({ type: "QUIT" });
  });

  it("should still ask when a seeded device's verdict belongs to an older session", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.firmwareCheck",
        context: {
          onboardedOnEntry: true,
          isGenuine: true,
          verdictMatchesSession: false,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );
    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    act(() => checksOf(result.current).onQuit?.());

    expect(send).not.toHaveBeenCalled();
    expect(result.current.quitConfirmation?.isOpen).toBe(true);
  });

  it("should name the genuine and OS check when a seeded device asks before leaving", () => {
    useSession.mockReturnValue(
      session({
        state: "awaitingStart",
        context: {
          onboardedOnEntry: true,
          currentSetupStep: null,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );
    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(result.current.quitConfirmation?.stepName).toBe("Genuine & OS check");
  });

  it("should drop an open confirmation when a seeded device's genuine check completes", () => {
    const context = { onboardedOnEntry: true, verdictMatchesSession: null, checksPaused: false };
    useSession.mockReturnValue(
      session({
        state: "checks.genuineCheck",
        context: context as DeviceOnboardingSession["context"],
      }),
    );
    const { result, rerender } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    act(() => checksOf(result.current).onQuit?.());
    expect(result.current.quitConfirmation?.isOpen).toBe(true);

    useSession.mockReturnValue(
      session({
        state: "checks.firmwareCheck",
        context: {
          ...context,
          isGenuine: true,
          verdictMatchesSession: true,
        } as DeviceOnboardingSession["context"],
      }),
    );
    rerender(undefined as never);

    expect(result.current.quitConfirmation).toBeNull();
    expect(checksOf(result.current).suspendSheets).toBeFalsy();
  });

  it("should send one QUIT when a seeded device confirms leaving", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.firmwareCheck",
        context: {
          onboardedOnEntry: true,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );
    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    act(() => checksOf(result.current).onQuit?.());
    act(() => {
      result.current.quitConfirmation?.onLeave();
      result.current.quitConfirmation?.onLeave();
    });

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: "QUIT" });
  });

  it("should ask before Android back leaves an unseeded setup", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.firmwareCheck",
        context: {
          onboardedOnEntry: false,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );
    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const preventDefault = jest.fn();

    act(() => {
      listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
    expect(result.current.quitConfirmation?.isOpen).toBe(true);
  });

  it("should hide the quit confirmation while an unseeded device is locked", () => {
    const context = {
      onboardedOnEntry: false,
      checksPaused: false,
    } as DeviceOnboardingSession["context"];
    useSession.mockReturnValue(session({ state: "checks.firmwareCheck", context }));
    const { result, rerender } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const preventDefault = jest.fn();

    act(() => {
      listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });
    });
    expect(result.current.quitConfirmation?.isOpen).toBe(true);

    useSession.mockReturnValue(session({ state: "deviceLocked", context }));
    rerender(undefined as never);

    const locked = result.current;
    if (locked.status !== "checks") throw new Error(locked.status);
    expect(locked.unlockSheet).toEqual({
      deviceModelId: DeviceModelId.stax,
      deviceName: "Ledger Stax",
    });
    expect(locked.quitConfirmation?.isOpen).toBe(false);
    act(() => locked.quitConfirmation?.onContinue());
    expect(result.current.quitConfirmation?.isOpen).toBe(false);
    expect(send).not.toHaveBeenCalled();

    useSession.mockReturnValue(session({ state: "readingState", context }));
    rerender(undefined as never);
    expect(result.current.quitConfirmation?.isOpen).toBe(false);

    useSession.mockReturnValue(session({ state: "checks.firmwareCheck", context }));
    rerender(undefined as never);
    expect(result.current.quitConfirmation?.isOpen).toBe(true);
  });

  it("should ask before the allow prompt close leaves an unseeded setup", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.genuineCheck.awaitingApproval",
        context: {
          onboardedOnEntry: false,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );
    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    act(() => checksOf(result.current).onQuit?.());

    expect(send).not.toHaveBeenCalled();
    expect(result.current.quitConfirmation?.isOpen).toBe(true);
  });

  it("should close the confirmation without sending anything", () => {
    useSession.mockReturnValue(
      session({
        state: "awaitingStart",
        context: {
          onboardedOnEntry: false,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );
    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const screen = result.current;
    if (screen.status !== "unseededIntroKaraoke") throw new Error(screen.status);

    act(() => screen.unseededIntroKaraoke.onClose());
    act(() => result.current.quitConfirmation?.onContinue());

    expect(send).not.toHaveBeenCalled();
    expect(result.current.quitConfirmation?.isOpen).toBe(false);
  });

  it("should send one QUIT when an unseeded device leaves without saving", () => {
    useSession.mockReturnValue(
      session({
        state: "awaitingStart",
        context: {
          onboardedOnEntry: false,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );
    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const screen = result.current;
    if (screen.status !== "unseededIntroKaraoke") throw new Error(screen.status);

    act(() => screen.unseededIntroKaraoke.onClose());
    act(() => {
      result.current.quitConfirmation?.onLeave();
      result.current.quitConfirmation?.onLeave();
    });

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: "QUIT" });
  });

  it("should keep the success screen when an unseeded device reaches done", () => {
    useSession.mockReturnValue(
      session({
        state: "done",
        context: {
          onboardedOnEntry: false,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(checksOf(result.current).state).toBe("succeeded");
    expect(result.current.status).not.toBe("connecting");
  });
});
