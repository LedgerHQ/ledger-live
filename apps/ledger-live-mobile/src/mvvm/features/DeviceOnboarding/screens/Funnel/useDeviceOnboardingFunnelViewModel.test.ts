import { track, trackPage } from "@shared/analytics";
import { renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import type { State } from "~/reducers/types";
import { resetSeededOnboardingAnalytics } from "../../analytics/seededTracking";
import { useDeviceOnboarding, type DeviceOnboardingSession } from "../../hooks/useDeviceOnboarding";
import { useDeviceOnboardingFunnelViewModel } from "./useDeviceOnboardingFunnelViewModel";

jest.mock("@shared/analytics", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
  getCurrentTrackingPage: jest.fn(() => ""),
  getPreviousTrackingPage: jest.fn(() => "Page Pairing"),
}));

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
    context: { onboardedOnEntry: true } as DeviceOnboardingSession["context"],
    machineContext: null,
    log: [],
    exit: null,
    sendableEvents: [],
    nextStates: [],
    error: null,
    connect: jest.fn(),
    send,
    reset: jest.fn(),
    closeFirmwareHandover: jest.fn(),
    abortFirmwareReconnect: jest.fn(),
    ...overrides,
  };
}

function checksOf(model: ReturnType<typeof useDeviceOnboardingFunnelViewModel>) {
  if (model.status !== "checks") throw new Error(model.status);
  return model.checks;
}

describe("useDeviceOnboardingFunnelViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSeededOnboardingAnalytics();
    listeners.clear();
    mockRouteParams = { wasReadOnlyAtEntry: true };
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

    const input = useSession.mock.calls[0][0];
    expect(input.knownDevices.map(known => known.id)).toEqual(expectedIds);
    expect(input.wasReadOnlyAtEntry).toBe(false);
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

  it.each(["readingState", "legacyFallback", "done", "syncOffer"])(
    "should keep Checks unmounted while the machine is in %s",
    state => {
      useSession.mockReturnValue(session({ state }));

      const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

      expect(result.current.status).toBe("connecting");
    },
  );

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

    expect(connect).toHaveBeenCalledTimes(2);
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

    useSession.mock.calls[0][0].onLeave?.();
    back();
    expect(preventDefault).toHaveBeenCalledTimes(2);
  });

  it("should close the firmware handover when Android back happens while it opens", () => {
    const closeFirmwareHandover = jest.fn();
    useSession.mockReturnValue(
      session({ state: "checks.firmwareUpdateDelegated", closeFirmwareHandover }),
    );
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

    useSession.mock.calls[0][0].onLeave?.();
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

    useSession.mock.calls[0][0].onLeave?.();
    back();
    expect(preventDefault).toHaveBeenCalledTimes(2);
  });

  it("should wait for the device on the connecting screen after a completed update", () => {
    const abortFirmwareReconnect = jest.fn();
    const closeFirmwareHandover = jest.fn();
    useSession.mockReturnValue(
      session({
        state: "awaitingSessionAfterFirmwareUpdate",
        abortFirmwareReconnect,
        closeFirmwareHandover,
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    if (result.current.status !== "connecting") throw new Error(result.current.status);

    result.current.onQuit();

    expect(abortFirmwareReconnect).toHaveBeenCalledTimes(1);
    expect(goBack).not.toHaveBeenCalled();
    expect(closeFirmwareHandover).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "close" }),
      expect.anything(),
    );
  });

  it("should track close when leaving the failed reconnect after an update", () => {
    const abortFirmwareReconnect = jest.fn();
    useSession.mockReturnValue(
      session({
        state: "awaitingSessionAfterFirmwareUpdate",
        error: "Unable to connect to the device",
        abortFirmwareReconnect,
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    if (result.current.status !== "failed") throw new Error(result.current.status);
    result.current.onQuit();

    expect(abortFirmwareReconnect).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "close" }),
      expect.anything(),
    );
  });

  it("should quit the machine when closing a lost session while it reconnects", () => {
    const reset = jest.fn();
    useSession.mockReturnValue(
      session({
        status: "connecting",
        state: "awaitingSession",
        liveDevice: null,
        reset,
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    if (result.current.status !== "failed") throw new Error(result.current.status);
    result.current.onQuit();

    expect(send).toHaveBeenCalledWith({ type: "QUIT" });
    expect(reset).not.toHaveBeenCalled();
    expect(goBack).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "close" }),
      expect.anything(),
    );
    expect(track).not.toHaveBeenCalledWith(
      "onboarding_aborted",
      expect.anything(),
      expect.anything(),
    );
  });

  it("should retry without closing the handover when reconnecting after the update fails", () => {
    const connect = jest.fn();
    const closeFirmwareHandover = jest.fn();
    useSession.mockReturnValue(
      session({
        state: "awaitingSessionAfterFirmwareUpdate",
        error: "Unable to connect to the device",
        connect,
        closeFirmwareHandover,
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
    const closeFirmwareHandover = jest.fn();
    useSession.mockReturnValue(
      session({
        state: "awaitingSessionAfterFirmwareUpdate",
        abortFirmwareReconnect,
        closeFirmwareHandover,
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
    const closeFirmwareHandover = jest.fn();
    useSession.mockReturnValue(
      session({ state: "checks.firmwareUpdateDelegated", closeFirmwareHandover }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const checks = checksOf(result.current);

    expect(checks.state).toBe("checking");
    checks.onQuit?.();

    expect(closeFirmwareHandover).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
  });

  it("should quit the machine when closing while the device is locked", () => {
    const reset = jest.fn();
    useSession.mockReturnValue(session({ state: "deviceLocked", reset }));

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    if (result.current.status !== "connecting") throw new Error(result.current.status);

    result.current.onQuit();

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
    expect(connect).toHaveBeenCalledTimes(2);

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
    expect(useSession).toHaveBeenCalledWith(
      expect.objectContaining({ navigateOnExit: true, wasReadOnlyAtEntry: true }),
    );
  });

  it("should leave the success screen when the user continues", () => {
    useSession.mockReturnValue(session({ state: "checks.checksSucceeded" }));

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    checksOf(result.current).onContinue?.();

    expect(send).toHaveBeenCalledWith({ type: "CONTINUE" });
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "Continue",
        page: "Genuine Check & OS success",
      }),
      expect.anything(),
    );
  });

  it("should withhold continue while the device is still leaving its check screen", () => {
    useSession.mockReturnValue(session({ state: "checks.leavingEarlyCheckScreen" }));

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const checks = checksOf(result.current);

    expect(checks.state).toBe("succeeded");
    expect(checks.onContinue).toBeUndefined();
  });

  it("should track the idle genuine check and its start", () => {
    useSession.mockReturnValue(
      session({
        state: "awaitingStart",
        context: {
          onboardedOnEntry: true,
          firmwareChecked: true,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({ category: "Genuine Check" }),
      expect.objectContaining({ updateRoutes: true, refreshSource: true }),
    );
    expect(track).toHaveBeenCalledWith(
      "onboarding_started",
      expect.objectContaining({ firmware_update_availability: "no" }),
      expect.anything(),
    );

    checksOf(result.current).onStart();

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "Initiate Genuine Check",
        page: "Genuine Check",
        source: "Page Pairing",
      }),
      expect.anything(),
    );
    expect(send).toHaveBeenCalledWith({ type: "CONTINUE" });
  });

  it("should track a refusal and the retry", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.genuineFailed",
        context: {
          onboardedOnEntry: true,
          genuineFailureKind: "GENUINE_CHECK_REFUSED",
          checksPaused: false,
          firmwareChecked: true,
        } as DeviceOnboardingSession["context"],
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({ category: "Genuine Check refused on device" }),
      expect.anything(),
    );

    checksOf(result.current).onRetry();

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "Retry genuine check" }),
      expect.anything(),
    );
  });

  it("should track the OS update sheet actions", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.firmwareUpdateOffered",
        context: {
          onboardedOnEntry: true,
          firmwareVersion: "1.0.0",
          availableFirmwareVersion: "1.1.0",
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const checks = checksOf(result.current);

    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({ category: "OS update required" }),
      expect.anything(),
    );
    expect(track).toHaveBeenCalledWith(
      "onboarding_started",
      expect.objectContaining({ firmware_update_availability: "yes" }),
      expect.anything(),
    );

    checks.onAcceptUpdate();
    checks.onDeclineUpdate();

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "Continue", page: "OS update required" }),
      expect.anything(),
    );
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "close", page: "OS update required" }),
      expect.anything(),
    );
  });

  it("should leave an unseeded device untracked", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.checksSucceeded",
        context: { onboardedOnEntry: false } as DeviceOnboardingSession["context"],
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(trackPage).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
    checksOf(result.current).onContinue?.();
    expect(send).toHaveBeenCalledWith({ type: "CONTINUE" });
  });

  it("should track the success page without a continue click", () => {
    useSession.mockReturnValue(session({ state: "checks.checksSucceeded" }));

    renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({ category: "Genuine Check & OS success" }),
      expect.anything(),
    );
    expect(track).not.toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "Continue" }),
      expect.anything(),
    );
  });

  it("should start again when the funnel is opened after an abort", () => {
    useSession.mockReturnValue(session({ status: "connecting", state: null, liveDevice: null }));
    const first = renderHook(() => useDeviceOnboardingFunnelViewModel());
    if (first.result.current.status !== "connecting") throw new Error(first.result.current.status);

    first.result.current.onQuit();
    first.unmount();
    jest.mocked(track).mockClear();

    useSession.mockReturnValue(
      session({
        state: "awaitingStart",
        context: {
          onboardedOnEntry: true,
          firmwareChecked: true,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
      }),
    );
    renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(track).toHaveBeenCalledWith(
      "onboarding_started",
      expect.objectContaining({ firmware_update_availability: "no" }),
      expect.anything(),
    );
  });

  it("should leave before the device read without seeded analytics", () => {
    useSession.mockReturnValue(
      session({ status: "connecting", state: null, liveDevice: null, context: null }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    if (result.current.status !== "connecting") throw new Error(result.current.status);

    result.current.onQuit();

    expect(track).not.toHaveBeenCalled();
    expect(trackPage).not.toHaveBeenCalled();
  });
});
