import { renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { setTrackingSource } from "@shared/analytics";
import type { DeviceOnboardingContext } from "@features/platform-device-onboarding";
import type { State } from "~/reducers/types";
import { useDeviceOnboarding, type DeviceOnboardingSession } from "../../hooks/useDeviceOnboarding";
import { recordAnalytics } from "../../analytics/recordAnalytics.testUtils";
import { useDeviceOnboardingFunnelViewModel } from "./useDeviceOnboardingFunnelViewModel";

const events = recordAnalytics();
const pageNames = async () =>
  (await events()).flatMap(([event]) => (event.startsWith("Page ") ? [event.slice(5)] : []));
const trackedNames = async () =>
  (await events()).flatMap(([event]) => (event.startsWith("Page ") ? [] : [event]));

const goBack = jest.fn();
const unseededExit = { onboardedOnEntry: false } as DeviceOnboardingContext;
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
      useSession.mockReturnValue(session({ state, context: null }));

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

    useSession.mock.calls[0][0].onLeave?.("userQuit", unseededExit);
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

    useSession.mock.calls[0][0].onLeave?.("userQuit", unseededExit);
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

    useSession.mock.calls[0][0].onLeave?.("userQuit", unseededExit);
    back();
    expect(preventDefault).toHaveBeenCalledTimes(2);
  });

  it("should wait for the device on the connecting screen after a completed update", async () => {
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
    expect(await events()).toContainEqual([
      "button_clicked",
      expect.objectContaining({ button: "close" }),
    ]);
  });

  it("should track close when leaving the failed reconnect after an update", async () => {
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
    expect(await events()).toContainEqual([
      "button_clicked",
      expect.objectContaining({ button: "close" }),
    ]);
  });

  it("should quit the machine when closing a lost session while it reconnects", async () => {
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
    expect(await events()).toContainEqual([
      "button_clicked",
      expect.objectContaining({ button: "close" }),
    ]);
    expect(await events()).not.toContainEqual(["onboarding_aborted", expect.anything()]);
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

  it("should show connecting when an unseeded device leaves for Ledger Sync", () => {
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

    expect(result.current.status).toBe("connecting");
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

  it("should leave the success screen when the user continues", async () => {
    useSession.mockReturnValue(session({ state: "checks.checksSucceeded" }));

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    checksOf(result.current).onContinue?.();

    expect(send).toHaveBeenCalledWith({ type: "CONTINUE" });
    expect(await events()).toContainEqual([
      "button_clicked",
      expect.objectContaining({
        button: "Continue",
      }),
    ]);
  });

  it("should withhold continue while the device is still leaving its check screen", () => {
    useSession.mockReturnValue(session({ state: "checks.leavingEarlyCheckScreen" }));

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const checks = checksOf(result.current);

    expect(checks.state).toBe("succeeded");
    expect(checks.onContinue).toBeUndefined();
  });

  it("should track the idle genuine check and its start", async () => {
    setTrackingSource("Pairing");
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

    expect(await pageNames()).toContain("Genuine Check");
    expect(await events()).toContainEqual([
      "onboarding_started",
      expect.objectContaining({ firmware_update_availability: "no" }),
    ]);

    checksOf(result.current).onStart();

    expect(await events()).toContainEqual([
      "button_clicked",
      expect.objectContaining({
        button: "Initiate Genuine Check",
        page: "Genuine Check",
        source: "Pairing",
      }),
    ]);
    expect(send).toHaveBeenCalledWith({ type: "CONTINUE" });
  });

  it("should track a refusal and the retry", async () => {
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

    expect(await pageNames()).toContain("Genuine Check refused on device");

    checksOf(result.current).onRetry();

    expect(await events()).toContainEqual([
      "button_clicked",
      expect.objectContaining({ button: "Retry genuine check" }),
    ]);
  });

  it("should track the OS update sheet actions", async () => {
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

    expect(await pageNames()).toEqual(["Genuine Check success", "OS update required"]);
    expect(await events()).toContainEqual([
      "onboarding_started",
      expect.objectContaining({ firmware_update_availability: "yes" }),
    ]);

    checks.onAcceptUpdate();
    checks.onDeclineUpdate();

    expect(await events()).toContainEqual([
      "button_clicked",
      expect.objectContaining({ button: "Continue" }),
    ]);
    expect(await events()).toContainEqual([
      "button_clicked",
      expect.objectContaining({ button: "close" }),
    ]);
  });

  it("should leave an unseeded device untracked", async () => {
    useSession.mockReturnValue(
      session({
        state: "checks.checksSucceeded",
        context: { onboardedOnEntry: false } as DeviceOnboardingSession["context"],
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(await events()).toEqual([]);
    checksOf(result.current).onContinue?.();
    expect(send).toHaveBeenCalledWith({ type: "CONTINUE" });
  });

  it("should track the success page without a continue click", async () => {
    useSession.mockReturnValue(session({ state: "checks.checksSucceeded" }));

    renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(await pageNames()).toContain("Genuine Check & OS success");
    expect(await events()).not.toContainEqual([
      "button_clicked",
      expect.objectContaining({ button: "Continue" }),
    ]);
  });

  it("should start again when the funnel is opened after an abort", async () => {
    useSession.mockReturnValue(session({ status: "connecting", state: null, liveDevice: null }));
    const first = renderHook(() => useDeviceOnboardingFunnelViewModel());
    if (first.result.current.status !== "connecting") throw new Error(first.result.current.status);

    first.result.current.onQuit();
    first.unmount();
    events.clear();

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

    expect(await events()).toContainEqual([
      "onboarding_started",
      expect.objectContaining({ firmware_update_availability: "no" }),
    ]);
  });

  it("should leave before the device read without seeded analytics", async () => {
    useSession.mockReturnValue(
      session({ status: "connecting", state: null, liveDevice: null, context: null }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    if (result.current.status !== "connecting") throw new Error(result.current.status);

    result.current.onQuit();

    expect(await events()).toEqual([]);
  });

  it("should start with an unknown update availability when leaving before the OS check", async () => {
    useSession.mockReturnValue(
      session({
        status: "connecting",
        state: null,
        liveDevice: null,
        context: { onboardedOnEntry: true } as DeviceOnboardingSession["context"],
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    if (result.current.status !== "connecting") throw new Error(result.current.status);
    result.current.onQuit();

    expect(await trackedNames()).toEqual([
      "button_clicked",
      "onboarding_started",
      "onboarding_aborted",
    ]);
    expect(await events()).toContainEqual([
      "onboarding_started",
      expect.objectContaining({ firmware_update_availability: "unknown" }),
    ]);
  });

  it.each([
    ["skip the start on a handoff to the legacy checks", null, false],
    [
      "send the start when the legacy fallback completes the funnel",
      { sessionId: "s1", isGenuine: true },
      true,
    ],
  ])("should %s", async (_case, verdict, started) => {
    useSession.mockReturnValue(
      session({
        state: "checks.genuineCheck.running",
        context: {
          onboardedOnEntry: true,
          deviceModelId: "stax",
        } as DeviceOnboardingSession["context"],
      }),
    );
    renderHook(() => useDeviceOnboardingFunnelViewModel());

    useSession.mock.calls[0][0].onLeave?.("legacyFallback", {
      onboardedOnEntry: true,
      isOnboarded: true,
      deviceModelId: "stax",
      firmwareVersion: null,
      sessionId: "s1",
      genuineVerdict: verdict,
      offerSync: false,
      firmware: null,
    } as unknown as DeviceOnboardingContext);

    expect((await trackedNames()).includes("onboarding_started")).toBe(started);
  });

  it("should track the drawer that explains why the update cannot run here", async () => {
    useSession.mockReturnValue(
      session({
        state: "checks.firmwareUpdateOffered",
        context: {
          onboardedOnEntry: true,
          deviceModelId: "stax",
          firmwareVersion: "1.0.0",
          availableFirmwareVersion: "1.1.0",
        } as DeviceOnboardingSession["context"],
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const checks = checksOf(result.current);
    checks.onUnsupportedUpdate?.(true);
    checks.onUnsupportedUpdateClosed?.();
    checks.onDeclineUpdate();

    const sent = await events();
    expect(sent).toContainEqual([
      "Page Drawer : OS update unsupported",
      expect.objectContaining({ deviceType: "stax", reason: "usb_required" }),
    ]);
    expect(sent.at(-1)).toEqual([
      "button_clicked",
      expect.objectContaining({ button: "close", page: "OS update required" }),
    ]);
  });
});
