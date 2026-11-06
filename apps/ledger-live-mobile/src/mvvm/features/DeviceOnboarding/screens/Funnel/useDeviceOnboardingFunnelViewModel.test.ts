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

function checksOf(model: ReturnType<typeof useDeviceOnboardingFunnelViewModel>) {
  if (model.status !== "checks") throw new Error(model.status);
  return model.checks;
}

function setupOf(model: ReturnType<typeof useDeviceOnboardingFunnelViewModel>) {
  if (model.status !== "setup") throw new Error(model.status);
  return model.setup;
}

function useFunnelViewModel(props: void) {
  void props;
  return useDeviceOnboardingFunnelViewModel();
}

function renderFunnel() {
  return renderHook(useFunnelViewModel);
}

function unseededContext(
  overrides: Partial<NonNullable<DeviceOnboardingSession["context"]>> = {},
): DeviceOnboardingSession["context"] {
  return {
    onboardedOnEntry: false,
    checksPaused: false,
    ...overrides,
  } as DeviceOnboardingSession["context"];
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

  it("should block Android back without quitting while the update is offered", () => {
    useSession.mockReturnValue(session({ state: "checks.firmwareUpdateOffered" }));
    renderHook(() => useDeviceOnboardingFunnelViewModel());
    const preventDefault = jest.fn();
    const back = () =>
      listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });

    back();
    back();

    expect(preventDefault).toHaveBeenCalledTimes(2);
    expect(send).not.toHaveBeenCalled();
    expect(goBack).not.toHaveBeenCalled();

    recorded.host?.onLeave?.();
    back();
    expect(preventDefault).toHaveBeenCalledTimes(2);
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
    if (screen.status !== "karaoke") throw new Error(screen.status);

    act(() => screen.onClose());

    expect(send).not.toHaveBeenCalled();
    expect(result.current.quitConfirmation?.isOpen).toBe(true);
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
    expect(result.current.quitConfirmation).toBeNull();
  });

  it("should ask with the setup sheet each time Android back leaves setup", () => {
    useSession.mockReturnValue(
      session({
        state: "deviceSetup.pin",
        context: unseededContext({ currentOnboardingStep: "pin" }),
      }),
    );
    const { result } = renderFunnel();
    const preventDefault = jest.fn();
    const back = () =>
      listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });

    act(() => {
      back();
      back();
    });

    expect(preventDefault).toHaveBeenCalledTimes(2);
    expect(send).not.toHaveBeenCalled();
    expect(result.current.status).toBe("setup");
    expect(result.current.quitConfirmation).toBeNull();
    expect(setupOf(result.current).leaveRequest).toBe(2);
  });

  it("should show the setup screen while an unseeded device waits for approval", () => {
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

    expect(result.current.status).toBe("setup");
    expect(send).not.toHaveBeenCalled();
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
    if (screen.status !== "karaoke") throw new Error(screen.status);

    act(() => screen.onClose());
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
    if (screen.status !== "karaoke") throw new Error(screen.status);

    act(() => screen.onClose());
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

  it("should close a not genuine sheet with CLOSE on an unseeded device", () => {
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

    setupOf(result.current).checks?.onCloseSheet();

    expect(send).toHaveBeenCalledWith({ type: "CLOSE" });
  });

  it("should close a firmware offer with CLOSE on an unseeded device", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.firmwareUpdateOffered",
        context: {
          onboardedOnEntry: false,
          firmwareVersion: "1.0.0",
          availableFirmwareVersion: "1.1.0",
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    setupOf(result.current).checks?.onCloseFirmwareOffer?.();

    expect(send).toHaveBeenCalledWith({ type: "CLOSE" });
    expect(send).not.toHaveBeenCalledWith({ type: "USER_DECLINE" });
  });

  it("should keep a seeded device on the checks screen", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.firmwareCheck",
        context: unseededContext({ onboardedOnEntry: true }),
      }),
    );

    const { result } = renderFunnel();

    expect(result.current.status).toBe("checks");
    expect(send).not.toHaveBeenCalled();
  });

  it("should show the setup screen while an unseeded device is checked", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.firmwareCheck",
        context: unseededContext(),
      }),
    );

    const { result } = renderFunnel();

    expect(setupOf(result.current).stage).toEqual({
      index: 0,
      total: 5,
      kind: "checks",
      indicator: "loading",
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("should continue once each time an unseeded device reaches the end of the checks", () => {
    const unseeded = unseededContext();
    useSession.mockReturnValue(session({ state: "checks.checksSucceeded", context: unseeded }));

    const { result, rerender } = renderFunnel();

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: "CONTINUE" });
    expect(setupOf(result.current).stage.indicator).toBe("success");

    rerender(undefined);
    expect(send).toHaveBeenCalledTimes(1);

    useSession.mockReturnValue(session({ state: "deviceSetup.waiting", context: unseeded }));
    rerender(undefined);
    expect(setupOf(result.current).stage.indicator).toBe("success");

    useSession.mockReturnValue(session({ state: "checks.checksSucceeded", context: unseeded }));
    rerender(undefined);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("should count one fewer stage on a Nano, which has no device name", () => {
    useSession.mockReturnValue(
      session({
        state: "deviceSetup.pin",
        liveDevice: { ...device, modelId: DeviceModelId.nanoX },
        context: unseededContext({ currentOnboardingStep: "pin" }),
      }),
    );

    const { result } = renderFunnel();

    expect(setupOf(result.current).stage).toEqual({
      index: 1,
      total: 4,
      kind: "pin",
      indicator: "none",
    });
  });

  it("should keep the setup stage while the device locks and unlocks during the safety warning", () => {
    const warning = unseededContext({ currentOnboardingStep: "safety-warning" });
    useSession.mockReturnValue(
      session({
        state: "deviceSetup.pin",
        context: unseededContext({ currentOnboardingStep: "pin" }),
      }),
    );

    const { result, rerender } = renderFunnel();

    for (const state of ["deviceLocked", "readingState", "deviceSetup.waiting"]) {
      useSession.mockReturnValue(session({ state, context: warning }));
      rerender(undefined);
      expect(setupOf(result.current).stage.kind).toBe("pin");
    }
  });

  it("should keep the PIN stage up during the safety warning", () => {
    const unseeded = unseededContext({ currentOnboardingStep: "pin" });
    useSession.mockReturnValue(session({ state: "deviceSetup.pin", context: unseeded }));

    const { result, rerender } = renderFunnel();

    useSession.mockReturnValue(
      session({
        state: "deviceSetup.pin",
        context: {
          ...unseeded,
          currentOnboardingStep: "safety-warning",
        } as DeviceOnboardingSession["context"],
      }),
    );
    rerender(undefined);

    expect(setupOf(result.current).stage.kind).toBe("pin");
  });

  it("should close the firmware handover before quitting an unseeded update", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.firmwareUpdateDelegated",
        context: unseededContext(),
      }),
    );

    const { result } = renderFunnel();

    setupOf(result.current).onLeave();

    expect(closeFirmwareHandover).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: "QUIT" });
    expect(closeFirmwareHandover.mock.invocationCallOrder[0]).toBeLessThan(
      send.mock.invocationCallOrder[0],
    );
  });

  it("should send one QUIT when setup leave is pressed twice during an update", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.firmwareUpdateDelegated",
        context: unseededContext(),
      }),
    );

    const { result } = renderFunnel();

    setupOf(result.current).onLeave();
    setupOf(result.current).onLeave();

    expect(closeFirmwareHandover).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: "QUIT" });
  });

  it("should show the restore stage while Recover restore is on the device", () => {
    useSession.mockReturnValue(
      session({
        state: "deviceSetup.restoreRecover",
        context: unseededContext({ currentOnboardingStep: "restore-recover-backup" }),
      }),
    );

    const { result } = renderFunnel();

    expect(result.current.status).toBe("setup");
    expect(setupOf(result.current).stage).toEqual({
      index: 4,
      total: 5,
      kind: "restore",
      indicator: "none",
    });
    expect(result.current.quitConfirmation).toBeNull();
  });

  it("should restore the genuine check after reconnecting during the safety warning", () => {
    const unseeded = unseededContext({ currentOnboardingStep: "safety-warning" });
    useSession.mockReturnValue(session({ state: "awaitingSession", context: unseeded }));

    const { result, rerender } = renderFunnel();

    expect(result.current.status).toBe("failed");

    useSession.mockReturnValue(session({ state: "checks.firmwareCheck", context: unseeded }));
    rerender(undefined);

    expect(setupOf(result.current).stage).toEqual({
      index: 0,
      total: 5,
      kind: "checks",
      indicator: "loading",
    });

    useSession.mockReturnValue(session({ state: "deviceSetup.waiting", context: unseeded }));
    rerender(undefined);

    expect(setupOf(result.current).stage.kind).toBe("checks");
  });

  it("should offer retry when the device disconnects during the safety warning", () => {
    useSession.mockReturnValue(
      session({
        state: "awaitingSession",
        context: unseededContext({ currentOnboardingStep: "safety-warning" }),
      }),
    );

    const { result } = renderFunnel();

    expect(result.current.status).toBe("failed");
  });

  it("should let a cancelled genuine check be started again", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.checksIdle",
        context: unseededContext({ checksPaused: true, firmwareUpToDate: false }),
      }),
    );

    const { result } = renderFunnel();

    expect(setupOf(result.current).checks?.state).toBe("idle");
    expect(setupOf(result.current).firmwareUpToDate).toBe(false);
    setupOf(result.current).checks?.onStart();
    expect(send).toHaveBeenCalledWith({ type: "RETRY" });
  });
});
