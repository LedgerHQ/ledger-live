import { track, trackPage } from "@shared/analytics";
import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useIsFocused } from "@react-navigation/native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceModelId as DmkDeviceModelId } from "@ledgerhq/device-management-kit";
import {
  deviceOnboardingMachine,
  SeedPath,
  type AvailableFirmwareUpdate,
  type DeviceOnboardingContext,
  type FirmwareCheck,
} from "@features/platform-device-onboarding";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import type { State } from "~/reducers/types";
import { NavigatorName, ScreenName } from "~/const";
import type { DeviceOnboardingSession } from "LLM/features/DeviceOnboarding/hooks/useDeviceOnboarding";
import type { ChecksScreenProps, UpdateStep } from "LLM/features/DeviceOnboarding/types";
import type { DeviceOnboardingHost } from "LLM/features/DeviceOnboarding/hooks/DeviceOnboardingProvider";
import { useDeviceOnboardingSession } from "LLM/features/DeviceOnboarding/hooks/DeviceOnboardingProvider";
import {
  giveUpAfterPowerOnMs,
  powerOnAfterUpdateDelayMs,
} from "LLM/features/DeviceOnboarding/utils/deviceOff";
import { useDeviceOnboardingFunnelViewModel } from "./useDeviceOnboardingFunnelViewModel";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
  trackPage: jest.fn(),
  getPreviousTrackingPage: jest.fn(() => "Page Pairing"),
}));

const events = () => jest.mocked(track).mock.calls.map(([event]) => event);
const pages = () => jest.mocked(trackPage).mock.calls.map(([page]) => page.category);
const clicks = () =>
  jest
    .mocked(track)
    .mock.calls.filter(([event]) => event === "button_clicked")
    .map(([, props]) => (props && "button" in props ? props.button : undefined));

const screensOf = (checks: Pick<ChecksScreenProps, "screensFor">, step: UpdateStep | null = null) =>
  checks.screensFor?.(step).map(({ tracking }) => tracking.category) ?? [];

const unseededExit = { onboardedOnEntry: false } as DeviceOnboardingContext;

const goBack = jest.fn();
const resetNavigation = jest.fn();
const navigate = jest.fn();
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
    navigate,
    reset: resetNavigation,
    getParent: () => undefined,
    addListener: (event: string, handler: (event: RemovalEvent) => void) => {
      listeners.set(event, handler);
      return jest.fn();
    },
  }),
  useRoute: () => ({ params: mockRouteParams }),
  useIsFocused: jest.fn(() => true),
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
    useFirmwareUpdateHandover: (input: unknown) => {
      firmwareUpdateHandover(input);
      return { close: closeFirmwareHandover, returnsWithoutUpdate: mockReturnsWithoutUpdate };
    },
  };
});

let mockReturnsWithoutUpdate = 0;
const closeFirmwareHandover = jest.fn();
const firmwareUpdateHandover = jest.fn();
const useSession = jest.mocked(useDeviceOnboardingSession);
const send = jest.fn();

const device = {
  deviceId: "device-id",
  deviceName: "Ledger Stax",
  modelId: DeviceModelId.stax,
  wired: false,
};

function doneWithSeed(seedPath: string): DeviceOnboardingSession {
  return session({
    state: "done",
    context: {
      onboardedOnEntry: false,
      checksPaused: false,
    } as DeviceOnboardingSession["context"],
    snapshot: { context: { seedPath } } as DeviceOnboardingSession["snapshot"],
  });
}

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

function setupOf(model: ReturnType<typeof useDeviceOnboardingFunnelViewModel>) {
  if (model.status !== "setup") throw new Error(model.status);
  return model.setup;
}

const nanoX = { ...device, deviceName: "Ledger Nano X", modelId: DeviceModelId.nanoX };

/** The OS check after setup shows on the setup screen; any other check on the checks screen. */
function skipFirmwareCheckOf(model: ReturnType<typeof useDeviceOnboardingFunnelViewModel>) {
  if (model.status === "setup") return model.setup.checks?.onSkipFirmwareCheck;
  return checksOf(model).onSkipFirmwareCheck;
}

function quitOf(model: ReturnType<typeof useDeviceOnboardingFunnelViewModel>) {
  if (model.status === "setup") return model.setup.onQuit;
  return checksOf(model).onQuit;
}

function recoverOf(model: ReturnType<typeof useDeviceOnboardingFunnelViewModel>) {
  if (model.status !== "recoverNewSeed") throw new Error(model.status);
  return model.recoverNewSeed;
}

function restoreOf(model: ReturnType<typeof useDeviceOnboardingFunnelViewModel>) {
  if (model.status !== "recoverRestore") throw new Error(model.status);
  return model.recoverRestore;
}

function successOf(model: ReturnType<typeof useDeviceOnboardingFunnelViewModel>) {
  if (model.status !== "success") throw new Error(model.status);
  return model.success;
}

const recoverEnabled = { protectServicesMobile: { enabled: true } };

function renderRecoverFunnel() {
  return renderHook(() => useDeviceOnboardingFunnelViewModel(), {
    overrideInitialState: withFlagOverrides(recoverEnabled),
  });
}

function renderFunnelWithSyncOffer(flags: Parameters<typeof withFlagOverrides>[0] = {}) {
  return renderHook(() => useDeviceOnboardingFunnelViewModel(), {
    overrideInitialState: withFlagOverrides({
      deviceOnboarding: { enabled: true, params: { offerLedgerSync: true } },
      ...flags,
    }),
  });
}

const syncOfferParams = { device, wasReadOnlyAtEntry: true, unseeded: true, seededResult: null };

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

function seededContext(
  overrides: Partial<NonNullable<DeviceOnboardingSession["context"]>> = {},
): DeviceOnboardingSession["context"] {
  return {
    onboardedOnEntry: true,
    deviceModelId: "stax",
    checksPaused: false,
    ...overrides,
  } as DeviceOnboardingSession["context"];
}

function seededMachineContext(
  overrides: Partial<DeviceOnboardingContext> = {},
): DeviceOnboardingContext {
  return {
    sessionId: "s1",
    onboardedOnEntry: true,
    isOnboarded: true,
    deviceModelId: "stax",
    firmwareVersion: "2.4.0",
    offerSync: false,
    checksPaused: false,
    firmware: null,
    genuineVerdict: null,
    lastGenuineFailure: null,
    ...overrides,
  } as DeviceOnboardingContext;
}

/** A snapshot the machine can really publish: an active actor holding this context. */
function activeSnapshot(context: DeviceOnboardingContext): DeviceOnboardingSession["snapshot"] {
  return deviceOnboardingMachine.resolveState({ value: "readingState", context });
}

/** A seeded session: the flat context drives the screens, the machine context the tracking. */
function seededSession(
  state: string,
  machine: Partial<DeviceOnboardingContext> = {},
  flat: Partial<NonNullable<DeviceOnboardingSession["context"]>> = {},
): DeviceOnboardingSession {
  return session({
    state,
    context: seededContext(flat),
    snapshot: activeSnapshot(seededMachineContext(machine)),
  });
}

const upToDate: FirmwareCheck = { kind: "upToDate" };
const declined: FirmwareCheck = { kind: "declined" };
const skipped: FirmwareCheck = { kind: "skipped" };
const availableUpdate = { finalFirmware: { version: "1.1.0" } } as AvailableFirmwareUpdate;

function offered(update: AvailableFirmwareUpdate): FirmwareCheck {
  return { kind: "offered", update };
}

function renderUpdateOffer() {
  useSession.mockReturnValue(
    seededSession(
      "checks.firmwareUpdateOffered",
      { firmware: offered(availableUpdate) },
      {
        firmwareVersion: "1.0.0",
        availableFirmwareVersion: "1.1.0",
      },
    ),
  );
  return checksOf(renderFunnel().result.current);
}

function dropDuringPin(afterDrop: Partial<DeviceOnboardingSession> = {}) {
  const connect = jest.fn();
  const unseeded = unseededContext({ currentOnboardingStep: "pin" });
  useSession.mockReturnValue(session({ state: "deviceSetup.pin", context: unseeded, connect }));
  const hook = renderFunnel();
  const update = (overrides: Partial<DeviceOnboardingSession>) => {
    useSession.mockReturnValue(session({ context: unseeded, connect, ...overrides }));
    hook.rerender(undefined);
  };
  update({ state: "awaitingSession", ...afterDrop });

  return { ...hook, connect, update };
}

const returningContext = {
  onboardedOnEntry: true,
  checksPaused: false,
  returningFromFirmwareUpdate: true,
} as DeviceOnboardingSession["context"];

function waitingSession(extra: Partial<DeviceOnboardingSession> = {}) {
  return session({
    state: "awaitingSessionAfterFirmwareUpdate",
    context: returningContext,
    ...extra,
  });
}

describe("useDeviceOnboardingFunnelViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listeners.clear();
    mockRouteParams = { wasReadOnlyAtEntry: true };
    recorded.host = null;
    mockReturnsWithoutUpdate = 0;
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

  function snapshotOf(updateAfterSetup: boolean, isGenuine = true) {
    return {
      context: {
        updateAfterSetup,
        isOnboarded: true,
        firmware: null,
        sessionId: "session",
        genuineVerdict: { sessionId: "session", isGenuine },
      },
    } as DeviceOnboardingSession["snapshot"];
  }

  /** An unseeded Nano set up in this run; without a held-back update, a seeded device. */
  function heldBackUpdateSession(state: string, updateAfterSetup: boolean) {
    return session({
      state,
      ...(updateAfterSetup ? { liveDevice: nanoX } : {}),
      context: {
        checksPaused: false,
        onboardedOnEntry: !updateAfterSetup,
        isOnboarded: true,
      } as DeviceOnboardingSession["context"],
      snapshot: snapshotOf(updateAfterSetup),
    });
  }

  it.each(["postSetupFirmware.firmwareUpdateOffered", "checks.firmwareUpdateOffered"])(
    "should offer the held-back update as the last setup stage in %s",
    state => {
      useSession.mockReturnValue(heldBackUpdateSession(state, true));

      const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

      const setup = setupOf(result.current);
      expect(setup.stage).toMatchObject({ kind: "osCheck", index: 4, total: 5 });
      expect(setup.checks?.state).toBe("updating");
    },
  );

  it.each(["postSetupFirmware.firmwareCheckFailed", "checks.firmwareCheckFailed"])(
    "should let the user skip the failed firmware check after setup in %s",
    state => {
      send.mockClear();
      useSession.mockReturnValue(heldBackUpdateSession(state, true));

      const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
      skipFirmwareCheckOf(result.current)?.();

      expect(send).toHaveBeenCalledWith({ type: "SKIP" });
    },
  );

  it.each([
    ["checks.firmwareCheckFailed", false],
    ["checks.genuineFailed", true],
  ])("should not offer to skip in %s when the update after setup is %s", (state, flag) => {
    useSession.mockReturnValue(heldBackUpdateSession(state, flag));

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(skipFirmwareCheckOf(result.current)).toBeUndefined();
  });

  function seededDuringSetupSession(updateAfterSetup: boolean, isGenuine = true) {
    return session({
      state: "postSetupFirmware.firmwareUpdateOffered",
      ...(updateAfterSetup ? { liveDevice: nanoX } : {}),
      context: {
        checksPaused: false,
        onboardedOnEntry: false,
        isOnboarded: true,
      } as DeviceOnboardingSession["context"],
      snapshot: snapshotOf(updateAfterSetup, isGenuine),
    });
  }

  it("should end the setup from the close button once only the held-back update is left", () => {
    send.mockClear();
    useSession.mockReturnValue(seededDuringSetupSession(true));

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    act(() => quitOf(result.current)?.());

    expect(send).toHaveBeenCalledWith({ type: "QUIT" });
    expect(result.current.quitConfirmation?.isOpen).not.toBe(true);
  });

  it("should end the setup from Android back once only the held-back update is left", () => {
    send.mockClear();
    useSession.mockReturnValue(seededDuringSetupSession(true));
    renderHook(() => useDeviceOnboardingFunnelViewModel());
    const preventDefault = jest.fn();

    listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: "QUIT" });
  });

  it("should still ask before leaving once the new session is not genuine", () => {
    send.mockClear();
    useSession.mockReturnValue(seededDuringSetupSession(true, false));

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    act(() => quitOf(result.current)?.());

    expect(send).not.toHaveBeenCalledWith({ type: "QUIT" });
    expect(result.current.quitConfirmation?.isOpen).toBe(true);
  });

  it("should close the update handover from Setup once only the held-back update is left", () => {
    send.mockClear();
    closeFirmwareHandover.mockClear();
    useSession.mockReturnValue({
      ...seededDuringSetupSession(true),
      state: "postSetupFirmware.firmwareUpdateDelegated",
    });

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    act(() => quitOf(result.current)?.());

    expect(closeFirmwareHandover).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalledWith({ type: "QUIT" });
  });

  it("should ask to power on over the last setup step, then offer a retry, when the device switches off", () => {
    const connect = jest.fn();
    useSession.mockReturnValue(heldBackUpdateSession("postSetupFirmware.firmwareCheck", true));
    const { result, rerender } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    useSession.mockReturnValue({
      ...heldBackUpdateSession("awaitingSession", true),
      status: "connecting",
      connect,
    });
    rerender(undefined);

    const poweredOff = result.current;
    if (poweredOff.status !== "setup") throw new Error(poweredOff.status);
    expect(poweredOff.setup.stage).toMatchObject({ kind: "osCheck", index: 4, total: 5 });
    expect(connect).toHaveBeenCalledTimes(1);
    expect(poweredOff.setup.connection).toBeNull();
    expect(poweredOff.setup.suspendSheets).toBe(true);
    expect(poweredOff.powerOnSheet).toMatchObject({ deviceModelId: DeviceModelId.nanoX });

    act(() => jest.advanceTimersByTime(giveUpAfterPowerOnMs));

    const gaveUp = result.current;
    if (gaveUp.status !== "setup") throw new Error(gaveUp.status);
    expect(gaveUp.powerOnSheet).toBeNull();
    expect(gaveUp.reconnectSheet?.connection?.state).toBe("failed");

    connect.mockClear();
    act(() => gaveUp.reconnectSheet?.connection?.retry());
    expect(connect).toHaveBeenCalledWith("device-id");
  });

  it("should stop waiting for the updated Nano from Setup's close button without asking", () => {
    const abortFirmwareReconnect = jest.fn();
    send.mockClear();
    useSession.mockReturnValue({
      ...seededDuringSetupSession(true),
      state: "postSetupFirmware.firmwareUpdateDelegated",
    });
    const { result, rerender } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    // The update reboots the device: the machine forgets this session's genuine verdict.
    useSession.mockReturnValue({
      ...seededDuringSetupSession(true),
      state: "awaitingSessionAfterFirmwareUpdate",
      abortFirmwareReconnect,
      snapshot: {
        context: {
          updateAfterSetup: true,
          isOnboarded: true,
          firmware: null,
          sessionId: "session",
          genuineVerdict: null,
          returningFromFirmwareUpdate: true,
        },
      } as DeviceOnboardingSession["snapshot"],
    });
    rerender(undefined);

    expect(setupOf(result.current).stage).toMatchObject({ kind: "osCheck", index: 4 });
    act(() => quitOf(result.current)?.());

    expect(abortFirmwareReconnect).toHaveBeenCalledTimes(1);
    expect(result.current.quitConfirmation?.isOpen).not.toBe(true);
  });

  it("should still ask before leaving an unseeded device without a held-back update", () => {
    send.mockClear();
    useSession.mockReturnValue(seededDuringSetupSession(false));

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    act(() => checksOf(result.current).onQuit?.());

    expect(send).not.toHaveBeenCalledWith({ type: "QUIT" });
    expect(checksModel(result.current).quitConfirmation?.isOpen).toBe(true);
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

    recorded.host?.onLeave?.("userQuit", unseededExit);
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

    recorded.host?.onLeave?.("userQuit", unseededExit);
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

    recorded.host?.onLeave?.("userQuit", unseededExit);
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

  it("should keep the checks screen up while returning from an OS update", () => {
    useSession.mockReturnValue(
      session({ state: "checks.firmwareUpdateDelegated", context: seededContext() }),
    );

    const { result, rerender } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(checksOf(result.current).state).toBe("checking");

    for (const state of ["awaitingSessionAfterFirmwareUpdate", "readingState", "routing"]) {
      useSession.mockReturnValue(session({ state, context: returningContext }));
      rerender(undefined);
      expect(result.current.status).toBe("checks");
      expect(checksOf(result.current).state).toBe("checking");
    }

    useSession.mockReturnValue(
      session({ state: "checks.checksSucceeded", context: seededContext() }),
    );
    rerender(undefined);

    expect(checksOf(result.current).state).toBe("succeeded");
  });

  it("should keep the checks screen up when the device locks and unlocks while returning from an OS update", () => {
    useSession.mockReturnValue(session({ state: "readingState", context: returningContext }));

    const { result, rerender } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    for (const state of ["deviceLocked", "readingState", "routing"]) {
      useSession.mockReturnValue(session({ state, context: returningContext }));
      rerender(undefined);
      expect(result.current.status).toBe("checks");
      expect(checksOf(result.current).state).toBe("checking");
      expect(checksModel(result.current).unlockSheet !== null).toBe(state === "deviceLocked");
    }
  });

  it("should not close the firmware handover from the checks screen once the device unlocks after an OS update", () => {
    useSession.mockReturnValue(session({ state: "readingState", context: returningContext }));

    const { result, rerender } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    for (const state of ["deviceLocked", "readingState", "routing"]) {
      useSession.mockReturnValue(session({ state, context: returningContext }));
      rerender(undefined);
    }
    act(() => checksOf(result.current).onQuit?.());

    expect(result.current.quitConfirmation?.isOpen).toBe(true);
    expect(closeFirmwareHandover).not.toHaveBeenCalled();
  });

  it("should abort the firmware reconnect from the checks screen", () => {
    const abortFirmwareReconnect = jest.fn();
    useSession.mockReturnValue(
      session({
        state: "awaitingSessionAfterFirmwareUpdate",
        context: returningContext,
        abortFirmwareReconnect,
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    checksOf(result.current).onQuit?.();

    expect(abortFirmwareReconnect).toHaveBeenCalledTimes(1);
    expect(closeFirmwareHandover).not.toHaveBeenCalled();
    expect(result.current.quitConfirmation?.isOpen).toBe(false);
  });

  it("should quit through the confirmation, not abort the reconnect, once a locked device is read again", () => {
    const abortFirmwareReconnect = jest.fn();
    useSession.mockReturnValue(waitingSession({ abortFirmwareReconnect }));
    const { result, rerender } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    for (const state of ["deviceLocked", "readingState"]) {
      useSession.mockReturnValue(
        session({ state, context: returningContext, abortFirmwareReconnect }),
      );
      rerender(undefined);
    }
    act(() => checksOf(result.current).onQuit?.());
    useSession.mockReturnValue(
      session({ state: "routing", context: returningContext, abortFirmwareReconnect }),
    );
    rerender(undefined);

    expect(abortFirmwareReconnect).not.toHaveBeenCalled();
    expect(result.current.quitConfirmation?.isOpen).toBe(true);
  });

  it("should abort the firmware reconnect when back is pressed on the checks screen", () => {
    const abortFirmwareReconnect = jest.fn();
    useSession.mockReturnValue(
      session({
        state: "awaitingSessionAfterFirmwareUpdate",
        context: returningContext,
        abortFirmwareReconnect,
      }),
    );

    renderHook(() => useDeviceOnboardingFunnelViewModel());
    const preventDefault = jest.fn();

    listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(abortFirmwareReconnect).toHaveBeenCalledTimes(1);
    expect(closeFirmwareHandover).not.toHaveBeenCalled();
  });

  it("should keep the checks and offer to try again when returning from an OS update fails", () => {
    const connect = jest.fn();
    useSession.mockReturnValue(
      session({
        state: "awaitingSessionAfterFirmwareUpdate",
        error: "Unable to connect to the device",
        context: returningContext,
        connect,
      }),
    );

    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const model = checksModel(result.current);

    expect(model.checks.state).toBe("checking");
    expect(model.powerOnSheet).toBeNull();
    expect(model.reconnectSheet?.connection?.state).toBe("failed");

    act(() => model.reconnectSheet?.connection?.retry());

    expect(connect).toHaveBeenCalledTimes(1);
  });

  it("should keep the checks, ask to power on and reconnect when the device switches off right after returning from an OS update", () => {
    const connect = jest.fn();
    useSession.mockReturnValue(session({ state: "readingState", context: returningContext }));
    const { result, rerender } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    for (const error of [null, "connection-error"]) {
      useSession.mockReturnValue(
        session({
          state: "awaitingSession",
          status: "connecting",
          error,
          connect,
          context: returningContext,
        }),
      );
      rerender(undefined);

      const switchedOff = checksModel(result.current);
      expect(switchedOff.checks.state).toBe("checking");
      expect(switchedOff.powerOnSheet).not.toBeNull();
    }
    expect(connect).toHaveBeenCalledTimes(1);
    expect(connect).toHaveBeenCalledWith("device-id");

    act(() => {
      jest.advanceTimersByTime(2_000);
    });

    expect(connect).toHaveBeenCalledTimes(2);
  });

  it("should keep the checks and offer to try again on an error that needs the user when the device switches off after returning from an OS update", () => {
    const connect = jest.fn();
    useSession.mockReturnValue(session({ state: "readingState", context: returningContext }));
    const { result, rerender } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    useSession.mockReturnValue(
      session({
        state: "awaitingSession",
        status: "connecting",
        error: "bluetooth-disabled-promptable",
        connect,
        context: returningContext,
      }),
    );
    rerender(undefined);
    const model = checksModel(result.current);

    expect(model.powerOnSheet).toBeNull();
    expect(model.reconnectSheet?.connection?.state).toBe("failed");
    expect(connect).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(10_000);
    });
    expect(connect).toHaveBeenCalledTimes(1);

    act(() => model.reconnectSheet?.connection?.retry());

    expect(connect).toHaveBeenCalledTimes(2);
    expect(connect).toHaveBeenLastCalledWith("device-id");
  });

  describe("when the updated device takes long to come back", () => {
    it("should keep the checks screen without a sheet during the first 20 seconds", () => {
      useSession.mockReturnValue(waitingSession());
      const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

      act(() => jest.advanceTimersByTime(powerOnAfterUpdateDelayMs - 1));

      expect(checksModel(result.current).powerOnSheet).toBeNull();
      expect(checksOf(result.current).state).toBe("checking");
    });

    it("should ask to power on and unlock over the checks after 20 seconds, and abort the reconnect on quit", () => {
      const abortFirmwareReconnect = jest.fn();
      useSession.mockReturnValue(waitingSession({ abortFirmwareReconnect }));
      const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

      act(() => jest.advanceTimersByTime(powerOnAfterUpdateDelayMs));

      const waiting = checksModel(result.current);
      expect(waiting.checks.state).toBe("checking");
      expect(waiting.checks.suspendSheets).toBe(true);
      expect(waiting.powerOnSheet).toEqual({
        deviceModelId: DeviceModelId.stax,
        deviceName: "Ledger Stax",
        onQuit: expect.any(Function),
      });

      act(() => waiting.powerOnSheet?.onQuit());

      expect(abortFirmwareReconnect).toHaveBeenCalledTimes(1);
    });

    it("should offer to try again 30 seconds after asking to power on, and wait again on retry", () => {
      const connect = jest.fn();
      useSession.mockReturnValue(waitingSession({ connect }));
      const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

      act(() => jest.advanceTimersByTime(powerOnAfterUpdateDelayMs));
      act(() => jest.advanceTimersByTime(giveUpAfterPowerOnMs - 1));
      expect(checksModel(result.current).reconnectSheet).toBeNull();
      expect(checksModel(result.current).powerOnSheet).not.toBeNull();

      act(() => jest.advanceTimersByTime(1));
      const gaveUp = checksModel(result.current);
      expect(gaveUp.reconnectSheet?.connection?.state).toBe("failed");
      expect(gaveUp.powerOnSheet).toBeNull();

      act(() => gaveUp.reconnectSheet?.connection?.retry());
      expect(connect).toHaveBeenCalledTimes(1);
      expect(connect).toHaveBeenLastCalledWith();
      expect(checksModel(result.current).reconnectSheet).toBeNull();
      expect(checksModel(result.current).powerOnSheet).not.toBeNull();

      act(() => jest.advanceTimersByTime(giveUpAfterPowerOnMs));
      expect(checksModel(result.current).reconnectSheet?.connection?.state).toBe("failed");
    });

    it("should abort the reconnect when quitting from the try again sheet", () => {
      const abortFirmwareReconnect = jest.fn();
      useSession.mockReturnValue(waitingSession({ abortFirmwareReconnect }));
      const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
      act(() => jest.advanceTimersByTime(powerOnAfterUpdateDelayMs));
      act(() => jest.advanceTimersByTime(giveUpAfterPowerOnMs));

      act(() => checksModel(result.current).reconnectSheet?.onQuit?.());

      expect(abortFirmwareReconnect).toHaveBeenCalledTimes(1);
    });

    it("should offer to try again 30 seconds after the device switched off right after returning", () => {
      useSession.mockReturnValue(session({ state: "readingState", context: returningContext }));
      const { result, rerender } = renderHook(() => useDeviceOnboardingFunnelViewModel());
      useSession.mockReturnValue(
        session({ state: "awaitingSession", status: "connecting", context: returningContext }),
      );
      rerender(undefined);
      expect(checksModel(result.current).powerOnSheet).not.toBeNull();

      act(() => jest.advanceTimersByTime(giveUpAfterPowerOnMs));

      expect(checksModel(result.current).reconnectSheet?.connection?.state).toBe("failed");
      expect(checksModel(result.current).powerOnSheet).toBeNull();
    });

    it("should drop the sheet once the device is read again", () => {
      useSession.mockReturnValue(waitingSession());
      const { result, rerender } = renderHook(() => useDeviceOnboardingFunnelViewModel());
      act(() => jest.advanceTimersByTime(powerOnAfterUpdateDelayMs));

      useSession.mockReturnValue(session({ state: "readingState", context: returningContext }));
      rerender(undefined);

      expect(checksModel(result.current).powerOnSheet).toBeNull();
    });

    it("should not ask to power on in the unseeded flow", () => {
      useSession.mockReturnValue(
        session({
          state: "awaitingSessionAfterFirmwareUpdate",
          context: unseededContext({ returningFromFirmwareUpdate: true }),
        }),
      );
      const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

      act(() => jest.advanceTimersByTime(powerOnAfterUpdateDelayMs));
      act(() => jest.advanceTimersByTime(giveUpAfterPowerOnMs));

      expect(result.current.status).toBe("connecting");
    });
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
    rerender(undefined);

    const locked = checksModel(result.current);
    expect(locked.checks.state).toBe("updating");
    expect(locked.checks.update).toEqual({ current: "1.0.0", available: "1.1.0" });
    expect(locked.checks.suspendSheets).toBe(true);
    expect(locked.unlockSheet).toEqual({
      deviceModelId: DeviceModelId.stax,
      deviceName: "Ledger Stax",
    });

    useSession.mockReturnValue(session({ state: "readingState", context: firmware }));
    rerender(undefined);

    const reading = checksModel(result.current);
    expect(reading.checks.state).toBe("updating");
    expect(reading.checks.suspendSheets).toBe(true);
    expect(reading.unlockSheet).toBeNull();

    useSession.mockReturnValue(session({ state: "checks.checksSucceeded", context: firmware }));
    rerender(undefined);

    expect(checksOf(result.current).state).toBe("succeeded");
    expect(checksModel(result.current).unlockSheet).toBeNull();
  });

  describe("when the device switches off during checks", () => {
    const confirmingContext = {
      onboardedOnEntry: true,
      verdictMatchesSession: false,
    } as DeviceOnboardingSession["context"];

    function switchOff(afterSwitchOff: Partial<DeviceOnboardingSession> = {}) {
      const connect = afterSwitchOff.connect ?? jest.fn();
      useSession.mockReturnValue(session({ state: "checks.genuineCheck.running" }));
      const hook = renderHook(() => useDeviceOnboardingFunnelViewModel());
      const poweredOff = (error: string | null = null) => {
        useSession.mockReturnValue(
          session({
            state: "awaitingSession",
            status: "connecting",
            connect,
            error,
            ...afterSwitchOff,
          }),
        );
        hook.rerender(undefined);
      };
      poweredOff();

      return { ...hook, connect, poweredOff };
    }

    it("should offer to try again 30 seconds after asking to power on, and wait again on retry", () => {
      const connect = jest.fn();
      const { result } = switchOff({ connect });

      act(() => jest.advanceTimersByTime(giveUpAfterPowerOnMs - 1));
      expect(checksModel(result.current).reconnectSheet).toBeNull();
      expect(checksModel(result.current).powerOnSheet).not.toBeNull();

      act(() => jest.advanceTimersByTime(1));
      const gaveUp = checksModel(result.current);
      expect(gaveUp.reconnectSheet?.connection?.state).toBe("failed");
      expect(gaveUp.powerOnSheet).toBeNull();

      connect.mockClear();
      act(() => gaveUp.reconnectSheet?.connection?.retry());
      expect(connect).toHaveBeenCalledWith("device-id");
      expect(checksModel(result.current).powerOnSheet).not.toBeNull();
    });

    it("should show power on and unlock over the checks and reconnect once to the same device", () => {
      const { result, rerender, connect } = switchOff();
      rerender(undefined);

      const poweredOff = checksModel(result.current);
      expect(poweredOff.powerOnSheet).toEqual({
        deviceModelId: DeviceModelId.stax,
        deviceName: "Ledger Stax",
        onQuit: expect.any(Function),
      });
      expect(poweredOff.unlockSheet).toBeNull();
      expect(poweredOff.checks.suspendSheets).toBe(true);
      expect(poweredOff.checks.state).toBe("checking");
      expect(connect).toHaveBeenCalledTimes(1);
      expect(connect).toHaveBeenCalledWith("device-id");
    });

    it("should keep the checks and retry the connection when it fails", () => {
      const { result, connect, poweredOff } = switchOff();

      poweredOff("connection-error");
      expect(connect).toHaveBeenCalledTimes(1);
      act(() => {
        jest.advanceTimersByTime(2_000);
      });

      expect(connect).toHaveBeenCalledTimes(2);
      expect(result.current.status).toBe("checks");
      expect(checksModel(result.current).powerOnSheet).not.toBeNull();
    });

    it("should wait for the user instead of retrying an error that opens a system prompt", () => {
      const { result, connect, poweredOff } = switchOff();

      poweredOff("bluetooth-disabled-promptable");
      act(() => {
        jest.advanceTimersByTime(10_000);
      });

      expect(connect).toHaveBeenCalledTimes(1);
      expect(result.current.status).toBe("checks");
    });

    it("should not show the failed screen when the device switches off a second time", () => {
      const { result, connect, poweredOff } = switchOff();
      poweredOff("connection-error");

      poweredOff();

      expect(result.current.status).toBe("checks");
      expect(connect).toHaveBeenCalledTimes(1);
    });

    it("should not hold the checks when the device is being set up", () => {
      const connect = jest.fn();
      const { result } = switchOff({ context: unseededContext(), connect });

      expect(result.current.status).toBe("failed");
      expect(connect).not.toHaveBeenCalled();
    });

    it("should ask to confirm leaving instead of showing the power on sheet", () => {
      const { result } = switchOff({ context: confirmingContext });
      const preventDefault = jest.fn();

      act(() => {
        listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });
      });

      expect(preventDefault).toHaveBeenCalledTimes(1);
      expect(goBack).not.toHaveBeenCalled();
      expect(checksModel(result.current).quitConfirmation?.isOpen).toBe(true);
      expect(checksModel(result.current).powerOnSheet).toBeNull();
    });

    it("should quit the machine from the power on sheet close action", () => {
      const { result } = switchOff();

      act(() => checksModel(result.current).powerOnSheet?.onQuit());

      expect(send).toHaveBeenCalledWith({ type: "QUIT" });
    });

    it("should send close from the power on sheet of a seeded device", () => {
      const { result } = switchOff({ snapshot: activeSnapshot(seededMachineContext()) });

      act(() => checksModel(result.current).powerOnSheet?.onQuit());

      expect(clicks()).toEqual(["close"]);
    });

    it("should ask to confirm from the power on sheet close action when leaving needs confirmation", () => {
      const { result } = switchOff({ context: confirmingContext });

      act(() => checksModel(result.current).powerOnSheet?.onQuit());

      expect(send).not.toHaveBeenCalled();
      expect(checksModel(result.current).quitConfirmation?.isOpen).toBe(true);
      expect(checksModel(result.current).powerOnSheet).toBeNull();
    });

    it("should quit the machine when Android back leaves without confirmation", () => {
      switchOff();
      const preventDefault = jest.fn();

      listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });

      expect(preventDefault).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledWith({ type: "QUIT" });
    });
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
    rerender(undefined);
    useSession.mockReturnValue(session({ state: "awaitingSession", liveDevice: null }));
    rerender(undefined);

    expect(result.current.status).toBe("failed");

    useSession.mockReturnValue(session({ state: "deviceLocked", context: null }));
    rerender(undefined);

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
    rerender(undefined);
    useSession.mockReturnValue(session({ state: "awaitingSession", liveDevice: null }));
    rerender(undefined);

    const reconnected = {
      deviceId: "other-device",
      deviceName: "Nano X",
      modelId: DeviceModelId.nanoX,
      wired: false,
    };
    useSession.mockReturnValue(session({ state: "deviceLocked", liveDevice: reconnected }));
    rerender(undefined);

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
    rerender(undefined);

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

  describe("on done", () => {
    function doneSession(onboardedOnEntry: boolean, seedPath: SeedPath | null) {
      return session({
        state: "done",
        status: "exited",
        context: { onboardedOnEntry, checksPaused: false } as DeviceOnboardingSession["context"],
        snapshot: { context: { seedPath } } as DeviceOnboardingSession["snapshot"],
      });
    }

    it.each([SeedPath.RestorePhrase, SeedPath.Recover, SeedPath.RecoveryKey, null])(
      "should end an unseeded restore (%s) on the success karaoke",
      seedPath => {
        useSession.mockReturnValue(doneSession(false, seedPath));

        const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

        expect(result.current.status).toBe("unseededSuccessKaraoke");
        expect(result.current.quitConfirmation).toBeNull();
      },
    );

    it("should leave a new seed to the Recover pitch", () => {
      useSession.mockReturnValue(doneSession(false, SeedPath.NewSeed));

      const { result } = renderRecoverFunnel();

      expect(result.current.status).toBe("recoverNewSeed");
    });

    it.each(["upToDate", "declined", "skipped"] as const)(
      "should leave a new seed to the Recover pitch once the held-back update is %s",
      kind => {
        useSession.mockReturnValue(
          session({
            state: "done",
            status: "exited",
            context: {
              onboardedOnEntry: false,
              isOnboarded: true,
              checksPaused: false,
            } as DeviceOnboardingSession["context"],
            snapshot: {
              context: {
                seedPath: SeedPath.NewSeed,
                updateAfterSetup: true,
                isOnboarded: true,
                firmware: { kind },
                sessionId: "session",
                genuineVerdict: { sessionId: "session", isGenuine: true },
              },
            } as DeviceOnboardingSession["snapshot"],
          }),
        );

        const { result } = renderRecoverFunnel();

        expect(result.current.status).toBe("recoverNewSeed");
      },
    );

    it("should keep a seeded device on the shipped success screen", () => {
      useSession.mockReturnValue(doneSession(true, SeedPath.RestorePhrase));

      const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

      expect(checksOf(result.current).state).toBe("succeeded");
    });
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
        snapshot: {
          context: { seedPath: SeedPath.NewSeed },
        } as DeviceOnboardingSession["snapshot"],
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
    rerender(undefined);

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
    rerender(undefined);

    expect(result.current.status).toBe("unseededIntroKaraoke");

    useSession.mockReturnValue(session({ state: "awaitingStart", context: unseededContext }));
    rerender(undefined);

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

  it("should keep one quit sheet when the setup screen takes over from the karaoke", () => {
    useSession.mockReturnValue(
      session({
        state: "awaitingStart",
        context: unseededContext(),
      }),
    );
    const { result, rerender } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const screen = result.current;
    if (screen.status !== "unseededIntroKaraoke") throw new Error(screen.status);

    act(() => screen.unseededIntroKaraoke.onClose());
    expect(result.current.quitConfirmation?.isOpen).toBe(true);

    useSession.mockReturnValue(
      session({ state: "checks.firmwareCheck", context: unseededContext() }),
    );
    rerender(undefined);
    expect(result.current.status).toBe("setup");
    expect(result.current.quitConfirmation?.isOpen).toBe(true);
    expect(setupOf(result.current).suspendSheets).toBe(true);

    act(() => result.current.quitConfirmation?.onContinue());
    expect(result.current.quitConfirmation?.isOpen).toBe(false);

    useSession.mockReturnValue(session({ state: "awaitingStart", context: unseededContext() }));
    rerender(undefined);
    expect(result.current.status).toBe("unseededIntroKaraoke");
    expect(result.current.quitConfirmation?.isOpen).toBe(false);
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

  it("should leave a finished restore for the portfolio on Android back, without completing it", () => {
    useSession.mockReturnValue(
      session({
        state: "done",
        status: "running",
        context: {
          onboardedOnEntry: false,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
        snapshot: {
          context: { seedPath: SeedPath.RestorePhrase },
        } as DeviceOnboardingSession["snapshot"],
      }),
    );
    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const preventDefault = jest.fn();

    act(() => {
      listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });
    });

    expect(result.current.status).toBe("unseededSuccessKaraoke");
    expect(send).not.toHaveBeenCalled();
    expect(resetNavigation).toHaveBeenCalledWith(
      expect.objectContaining({ routes: [expect.objectContaining({ name: NavigatorName.Base })] }),
    );
  });

  it("should ask before Android back leaves a new seed's done screen", () => {
    useSession.mockReturnValue(
      session({
        state: "done",
        status: "running",
        context: {
          onboardedOnEntry: false,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
        snapshot: {
          context: { seedPath: SeedPath.NewSeed },
        } as DeviceOnboardingSession["snapshot"],
      }),
    );
    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const preventDefault = jest.fn();

    act(() => {
      listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(result.current.quitConfirmation?.isOpen).toBe(true);
    expect(send).not.toHaveBeenCalled();
    expect(resetNavigation).not.toHaveBeenCalled();
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

  it("should ask before leaving when an unseeded device closes the genuine check stage", () => {
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

    act(() => setupOf(result.current).onQuit());

    expect(send).not.toHaveBeenCalled();
    expect(result.current.quitConfirmation?.isOpen).toBe(true);
    expect(setupOf(result.current).suspendSheets).toBe(true);
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
    rerender(undefined);

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

  it("should open the quit sheet on Android back and close it on the next back", () => {
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

    act(() => back());

    expect(result.current.status).toBe("setup");
    expect(result.current.quitConfirmation?.isOpen).toBe(true);
    expect(setupOf(result.current).suspendSheets).toBe(true);

    act(() => back());

    expect(preventDefault).toHaveBeenCalledTimes(2);
    expect(send).not.toHaveBeenCalled();
    expect(result.current.quitConfirmation?.isOpen).toBe(false);
  });

  it("should show the unlock sheet over setup while an unseeded device is locked", () => {
    const context = unseededContext();
    useSession.mockReturnValue(session({ state: "checks.firmwareCheck", context }));
    const { result, rerender } = renderHook(() => useDeviceOnboardingFunnelViewModel());
    const preventDefault = jest.fn();

    act(() => {
      listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });
    });
    expect(result.current.status).toBe("setup");
    expect(result.current.quitConfirmation?.isOpen).toBe(true);

    useSession.mockReturnValue(session({ state: "deviceLocked", context }));
    rerender(undefined);

    const locked = result.current;
    if (locked.status !== "setup") throw new Error(locked.status);
    expect(locked.unlockSheet).toEqual({
      deviceModelId: DeviceModelId.stax,
      deviceName: "Ledger Stax",
    });
    expect(locked.quitConfirmation?.isOpen).toBe(false);
    expect(setupOf(locked).suspendSheets).toBe(true);
    expect(send).not.toHaveBeenCalled();

    useSession.mockReturnValue(session({ state: "readingState", context }));
    rerender(undefined);
    if (result.current.status !== "setup") throw new Error(result.current.status);
    expect(result.current.unlockSheet).toBeNull();
    expect(setupOf(result.current).suspendSheets).toBe(true);

    useSession.mockReturnValue(session({ state: "checks.firmwareCheck", context }));
    rerender(undefined);
    expect(result.current.status).toBe("setup");
    expect(result.current.quitConfirmation?.isOpen).toBe(true);
    expect(setupOf(result.current).suspendSheets).toBe(true);
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

  it("should keep Recover when a new seed reaches done", () => {
    useSession.mockReturnValue(
      session({
        state: "done",
        context: {
          onboardedOnEntry: false,
          checksPaused: false,
        } as DeviceOnboardingSession["context"],
        snapshot: {
          context: { seedPath: SeedPath.NewSeed },
        } as DeviceOnboardingSession["snapshot"],
      }),
    );

    const { result } = renderRecoverFunnel();

    expect(result.current.status).toBe("recoverNewSeed");
  });

  it("should show Recover when an unseeded device reaches done on a new seed", () => {
    useSession.mockReturnValue(doneWithSeed("newSeed"));

    const { result } = renderRecoverFunnel();

    expect(result.current.status).toBe("recoverNewSeed");
  });

  it("should skip the Recover pitch when protectServicesMobile is disabled", () => {
    useSession.mockReturnValue(doneWithSeed("newSeed"));
    const { result, store } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(result.current.status).toBe("success");
    expect(navigate).not.toHaveBeenCalled();

    act(() => successOf(result.current).onFinish());

    expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
    expect(store.getState().settings.hasBeenUpsoldProtect).toBe(false);
    expect(store.getState().postOnboarding.actionsToComplete).not.toContain("recover");
  });

  it("should move to the success karaoke when Recover is skipped", () => {
    useSession.mockReturnValue(doneWithSeed("newSeed"));
    const { result } = renderRecoverFunnel();
    act(() => recoverOf(result.current).onSkip());

    expect(result.current.status).toBe("success");
  });

  it("should add the recover action and show success when the user asks to be reminded", () => {
    useSession.mockReturnValue(doneWithSeed("newSeed"));
    const { result, store } = renderRecoverFunnel();
    act(() => recoverOf(result.current).onRemindLater());

    expect(result.current.status).toBe("success");
    expect(store.getState().postOnboarding.actionsToComplete).toContain("recover");
  });

  it("should open Recover without completing onboarding", () => {
    useSession.mockReturnValue(doneWithSeed("newSeed"));
    const { result, store } = renderRecoverFunnel();
    act(() => recoverOf(result.current).onOpenLiveApp());

    expect(navigate).toHaveBeenCalledWith("Base", {
      screen: "DeviceOnboardingRecover",
      params: { platform: "protect-simu", device },
    });
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
    expect(result.current.status).toBe("recoverNewSeed");
  });

  it("should show the success karaoke when the funnel is focused again after Recover", () => {
    useSession.mockReturnValue(doneWithSeed("newSeed"));
    const { result, rerender } = renderRecoverFunnel();
    act(() => recoverOf(result.current).onOpenLiveApp());
    jest.mocked(useIsFocused).mockReturnValue(false);
    rerender(undefined);
    expect(result.current.status).toBe("recoverNewSeed");

    jest.mocked(useIsFocused).mockReturnValue(true);
    rerender(undefined);
    expect(result.current.status).toBe("success");
  });

  it("should complete onboarding on the success tap after the pitch", () => {
    useSession.mockReturnValue(doneWithSeed("newSeed"));
    const { result, store } = renderRecoverFunnel();
    act(() => recoverOf(result.current).onSkip());
    act(() => successOf(result.current).onFinish());

    expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
    expect(store.getState().settings.hasBeenUpsoldProtect).toBe(true);
    expect(resetNavigation).toHaveBeenCalled();
  });

  it("should show the success karaoke when an unseeded restore reaches done", () => {
    useSession.mockReturnValue(doneWithSeed("restorePhrase"));
    const { result, store } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(result.current.status).toBe("unseededSuccessKaraoke");
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
  });

  it("should not open Ledger Sync on a restore when the flag is off", () => {
    useSession.mockReturnValue(doneWithSeed("restorePhrase"));
    const { result } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    expect(result.current.status).toBe("unseededSuccessKaraoke");
    expect(navigate).not.toHaveBeenCalled();
  });

  it("should offer Ledger Sync without the Recover pitch when protectServicesMobile is disabled", () => {
    useSession.mockReturnValue(doneWithSeed("newSeed"));
    const { result, store } = renderFunnelWithSyncOffer();

    expect(result.current.status).toBe("success");
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(ScreenName.DeviceOnboardingSyncOffer, syncOfferParams);

    act(() => successOf(result.current).onFinish());

    expect(store.getState().settings.hasBeenUpsoldProtect).toBe(false);
    expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
  });

  it("should offer Ledger Sync before the success karaoke of a restore", () => {
    useSession.mockReturnValue(doneWithSeed("restorePhrase"));
    const { result, store } = renderFunnelWithSyncOffer();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(ScreenName.DeviceOnboardingSyncOffer, syncOfferParams);
    expect(result.current.status).toBe("unseededSuccessKaraoke");
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
    expect(resetNavigation).not.toHaveBeenCalled();
  });

  it("should offer Ledger Sync before the success karaoke of a new seed, after Recover is skipped", () => {
    useSession.mockReturnValue(doneWithSeed("newSeed"));
    const { result, store } = renderFunnelWithSyncOffer(recoverEnabled);

    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.status).toBe("recoverNewSeed");

    act(() => recoverOf(result.current).onSkip());

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(ScreenName.DeviceOnboardingSyncOffer, syncOfferParams);
    expect(result.current.status).toBe("success");
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
  });

  it("should complete a new seed on the success tap after Ledger Sync", () => {
    useSession.mockReturnValue(doneWithSeed("newSeed"));
    const { result, store } = renderFunnelWithSyncOffer(recoverEnabled);
    act(() => recoverOf(result.current).onSkip());
    act(() => successOf(result.current).onFinish());

    expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
    expect(store.getState().settings.hasBeenUpsoldProtect).toBe(true);
    expect(resetNavigation).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("should open Ledger Sync once when the funnel regains focus", () => {
    useSession.mockReturnValue(doneWithSeed("restorePhrase"));
    const { rerender } = renderFunnelWithSyncOffer();

    jest.mocked(useIsFocused).mockReturnValue(false);
    rerender(undefined);
    jest.mocked(useIsFocused).mockReturnValue(true);
    rerender(undefined);

    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("should not open Ledger Sync later when the device is gone at the success screen", () => {
    useSession.mockReturnValue({ ...doneWithSeed("restorePhrase"), liveDevice: null });
    const { result, rerender } = renderFunnelWithSyncOffer();

    expect(result.current.status).toBe("unseededSuccessKaraoke");
    expect(navigate).not.toHaveBeenCalled();

    useSession.mockReturnValue(doneWithSeed("restorePhrase"));
    rerender(undefined);

    expect(navigate).not.toHaveBeenCalled();
  });

  it("should leave a finished unseeded device without completing onboarding", () => {
    useSession.mockReturnValue(doneWithSeed("newSeed"));
    const { result, store } = renderHook(() => useDeviceOnboardingFunnelViewModel());

    act(() => result.current.quitConfirmation?.onLeave());

    expect(send).not.toHaveBeenCalled();
    expect(resetNavigation).toHaveBeenCalled();
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
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

  it("should ask to confirm the skip when the OS update comes back after the release notes closed", () => {
    const unseeded = unseededContext({
      availableFirmwareVersion: "5.4.3",
      firmwareVersion: "2.1.0",
    });
    useSession.mockReturnValue(
      session({ state: "checks.firmwareUpdateOffered", context: unseeded }),
    );
    const { result, rerender } = renderFunnel();
    const moveTo = (state: string) => {
      useSession.mockReturnValue(session({ state, context: unseeded }));
      rerender(undefined);
    };

    expect(setupOf(result.current).checks?.confirmSkipUpdate).toBe(false);

    moveTo("checks.firmwareUpdateDelegated");
    mockReturnsWithoutUpdate = 1;
    moveTo("readingState");
    moveTo("checks.genuineCheck.running");
    moveTo("checks.firmwareUpdateOffered");

    expect(setupOf(result.current).checks?.confirmSkipUpdate).toBe(true);

    moveTo("checks.firmwareUpdateDelegated");

    expect(setupOf(result.current).checks?.confirmSkipUpdate).toBe(false);
  });

  it.each([
    ["the device locks", "deviceLocked"],
    ["the session drops", "awaitingSession"],
  ])(
    "should still ask to confirm the skip when %s before the update is offered again",
    (_, interruption) => {
      const unseeded = unseededContext({
        availableFirmwareVersion: "5.4.3",
        firmwareVersion: "2.1.0",
      });
      useSession.mockReturnValue(
        session({ state: "checks.firmwareUpdateOffered", context: unseeded }),
      );
      const { result, rerender } = renderFunnel();
      const moveTo = (state: string) => {
        useSession.mockReturnValue(session({ state, context: unseeded }));
        rerender(undefined);
      };

      moveTo("checks.firmwareUpdateDelegated");
      mockReturnsWithoutUpdate = 1;
      moveTo("readingState");
      moveTo(interruption);
      moveTo("readingState");
      moveTo("checks.firmwareUpdateOffered");

      expect(setupOf(result.current).checks?.confirmSkipUpdate).toBe(true);
    },
  );

  it("should still ask to confirm the skip when the release notes close after a disconnect", () => {
    const unseeded = unseededContext({
      availableFirmwareVersion: "5.4.3",
      firmwareVersion: "2.1.0",
    });
    useSession.mockReturnValue(
      session({ state: "checks.firmwareUpdateOffered", context: unseeded }),
    );
    const { result, rerender } = renderFunnel();
    const moveTo = (state: string) => {
      useSession.mockReturnValue(session({ state, context: unseeded }));
      rerender(undefined);
    };

    moveTo("checks.firmwareUpdateDelegated");
    mockReturnsWithoutUpdate = 1;
    moveTo("awaitingSessionAfterFirmwareUpdate");
    moveTo("readingState");
    moveTo("checks.firmwareUpdateOffered");

    expect(setupOf(result.current).checks?.confirmSkipUpdate).toBe(true);
  });

  it("should not ask to confirm the skip when the release notes never opened", () => {
    const unseeded = unseededContext({
      availableFirmwareVersion: "5.4.3",
      firmwareVersion: "2.1.0",
    });
    useSession.mockReturnValue(
      session({ state: "checks.firmwareUpdateOffered", context: unseeded }),
    );
    const { result, rerender } = renderFunnel();
    const moveTo = (state: string) => {
      useSession.mockReturnValue(session({ state, context: unseeded }));
      rerender(undefined);
    };

    moveTo("checks.firmwareUpdateDelegated");
    moveTo("readingState");
    moveTo("checks.firmwareUpdateOffered");

    expect(setupOf(result.current).checks?.confirmSkipUpdate).toBe(false);
  });

  it("should not ask to confirm the skip when the OS update is first offered", () => {
    useSession.mockReturnValue(
      session({ state: "checks.firmwareUpdateOffered", context: unseededContext() }),
    );

    const { result } = renderFunnel();

    expect(setupOf(result.current).checks?.confirmSkipUpdate).toBe(false);
  });

  it.each<[FirmwareCheck["kind"], boolean]>([
    ["declined", true],
    ["upToDate", false],
    ["skipped", false],
  ])("should report a firmware answer of %s as declined: %s", (kind, declined) => {
    useSession.mockReturnValue(
      session({
        state: "checks.firmwareCheck",
        context: unseededContext(),
        snapshot: { context: { firmware: { kind } } } as DeviceOnboardingSession["snapshot"],
      }),
    );

    const { result } = renderFunnel();

    expect(setupOf(result.current).firmwareDeclined).toBe(declined);
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

  it("should continue again after a lock that happens once the checks have succeeded", () => {
    const unseeded = unseededContext();
    useSession.mockReturnValue(session({ state: "checks.checksSucceeded", context: unseeded }));
    const { result, rerender } = renderFunnel();

    expect(send).toHaveBeenCalledTimes(1);

    useSession.mockReturnValue(session({ state: "deviceLocked", context: unseeded }));
    rerender(undefined);
    expect(setupOf(result.current).suspendSheets).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);

    useSession.mockReturnValue(session({ state: "readingState", context: unseeded }));
    rerender(undefined);

    useSession.mockReturnValue(session({ state: "checks.checksSucceeded", context: unseeded }));
    rerender(undefined);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenLastCalledWith({ type: "CONTINUE" });
  });

  it("should count one fewer stage on a Nano, which asks the setup choice before the PIN", () => {
    useSession.mockReturnValue(
      session({
        state: "deviceSetup.pin",
        liveDevice: { ...device, modelId: DeviceModelId.nanoX },
        context: unseededContext({ currentOnboardingStep: "pin" }),
      }),
    );

    const { result } = renderFunnel();

    expect(setupOf(result.current).stage).toEqual({
      index: 2,
      total: 4,
      kind: "pin",
      indicator: "none",
      infoCard: "pin",
    });
  });

  it("should show five stages on a Nano whose OS can only update after setup", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.genuineCheck.running",
        liveDevice: { ...device, modelId: DeviceModelId.nanoX },
        context: unseededContext(),
        snapshot: {
          context: {
            updateAfterSetup: false,
            isOnboarded: false,
            onboardedOnEntry: false,
            firmwareVersion: "2.4.0",
            deviceModelId: DmkDeviceModelId.NANO_X,
            lastDeviceState: null,
            recoveryKeyBackupOpen: false,
          },
        } as DeviceOnboardingSession["snapshot"],
      }),
    );

    const { result } = renderFunnel();

    expect(setupOf(result.current).stage).toEqual({
      index: 0,
      total: 5,
      kind: "genuine",
      indicator: "loading",
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

  it("should come back to the setup screen, not the intro, after an OS update", () => {
    const unseeded = unseededContext();
    useSession.mockReturnValue(
      session({ state: "checks.firmwareUpdateDelegated", context: unseeded }),
    );

    const { result, rerender } = renderFunnel();

    expect(setupOf(result.current).stage.kind).toBe("checks");

    useSession.mockReturnValue(
      session({ state: "awaitingSessionAfterFirmwareUpdate", context: unseeded }),
    );
    rerender(undefined);
    expect(result.current.status).toBe("connecting");

    for (const state of ["readingState", "checks.firmwareCheck"]) {
      useSession.mockReturnValue(session({ state, context: unseeded }));
      rerender(undefined);
      expect(result.current.status).not.toBe("karaoke");
    }
    expect(setupOf(result.current).stage.kind).toBe("checks");

    useSession.mockReturnValue(session({ state: "checks.checksSucceeded", context: unseeded }));
    rerender(undefined);

    expect(setupOf(result.current).stage.indicator).toBe("success");
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: "CONTINUE" });
  });

  it("should open the OS update of an unseeded device as not onboarded", () => {
    const unseeded = unseededContext({
      isOnboarded: false,
      firmwareVersion: "1.0.0",
      availableFirmwareVersion: "1.1.0",
    });
    useSession.mockReturnValue(
      session({ state: "checks.firmwareUpdateOffered", context: unseeded }),
    );

    const { result, rerender } = renderFunnel();

    setupOf(result.current).checks?.onAcceptUpdate();
    expect(send).toHaveBeenCalledWith({ type: "USER_ACCEPT" });

    useSession.mockReturnValue(
      session({ state: "checks.firmwareUpdateDelegated", context: unseeded }),
    );
    rerender(undefined);

    expect(firmwareUpdateHandover).toHaveBeenLastCalledWith(
      expect.objectContaining({
        machineState: "checks.firmwareUpdateDelegated",
        isDeviceOnboarded: false,
      }),
    );
  });

  it.each([
    [true, true],
    [false, false],
  ])(
    "should flag a not genuine device when the verdict matches this session (%s)",
    (verdictMatchesSession, expected) => {
      useSession.mockReturnValue(
        session({
          state: "checks.checksIdle",
          context: unseededContext({
            checksPaused: true,
            genuineFailureKind: "DEVICE_NOT_GENUINE",
            verdictMatchesSession,
          }),
        }),
      );

      const { result } = renderFunnel();

      expect(setupOf(result.current).checks?.deviceNotGenuine).toBe(expected);
    },
  );

  it("should only close the quit sheet on Android back while the firmware handover opens", () => {
    useSession.mockReturnValue(
      session({ state: "checks.firmwareUpdateDelegated", context: unseededContext() }),
    );
    const { result } = renderFunnel();
    const preventDefault = jest.fn();

    act(() => setupOf(result.current).onQuit());
    expect(result.current.quitConfirmation?.isOpen).toBe(true);

    act(() => {
      listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });
    });

    expect(result.current.quitConfirmation?.isOpen).toBe(false);
    expect(closeFirmwareHandover).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("should close the firmware handover before quitting an unseeded update", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.firmwareUpdateDelegated",
        context: unseededContext(),
      }),
    );

    const { result } = renderFunnel();

    act(() => result.current.quitConfirmation?.onLeave());

    expect(closeFirmwareHandover).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: "QUIT" });
    expect(closeFirmwareHandover.mock.invocationCallOrder[0]).toBeLessThan(
      send.mock.invocationCallOrder[0],
    );
  });

  it("should send one QUIT when leave is pressed twice during an update", () => {
    useSession.mockReturnValue(
      session({
        state: "checks.firmwareUpdateDelegated",
        context: unseededContext(),
      }),
    );

    const { result } = renderFunnel();

    act(() => {
      result.current.quitConfirmation?.onLeave();
      result.current.quitConfirmation?.onLeave();
    });

    expect(closeFirmwareHandover).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: "QUIT" });
  });

  it("should show Recover restore while that step is on the device", () => {
    useSession.mockReturnValue(
      session({
        state: "deviceSetup.restoreRecover",
        context: unseededContext({ currentOnboardingStep: "restore-recover-backup" }),
      }),
    );

    const { result } = renderFunnel();

    expect(result.current.status).toBe("recoverRestore");
    expect(result.current.quitConfirmation?.isOpen).toBe(false);
    expect(send).not.toHaveBeenCalledWith({ type: "PAUSE_POLLING" });
    expect(send).not.toHaveBeenCalledWith({ type: "RESUME_POLLING" });
  });

  it("should return to the restore choice on close and on Android back", () => {
    useSession.mockReturnValue(
      session({
        state: "deviceSetup.restoreRecover",
        context: unseededContext({ currentOnboardingStep: "restore-recover-backup" }),
      }),
    );
    const { result } = renderFunnel();
    const preventDefault = jest.fn();

    act(() => restoreOf(result.current).onClose());

    expect(result.current.status).toBe("setup");
    expect(setupOf(result.current).stage.infoCard).toBe("restoreChoice");
    expect(send).not.toHaveBeenCalledWith({ type: "QUIT" });

    useSession.mockReturnValue(
      session({
        state: "deviceSetup.restoreWords",
        context: unseededContext({ currentOnboardingStep: "restore-recovery-phrase" }),
      }),
    );
    const again = renderFunnel();
    useSession.mockReturnValue(
      session({
        state: "deviceSetup.restoreRecover",
        context: unseededContext({ currentOnboardingStep: "restore-recover-backup" }),
      }),
    );
    again.rerender(undefined);
    expect(again.result.current.status).toBe("recoverRestore");

    act(() => {
      listeners.get("beforeRemove")?.({ preventDefault, data: { action: { type: "GO_BACK" } } });
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(again.result.current.status).toBe("setup");
    expect(send).not.toHaveBeenCalledWith({ type: "QUIT" });
  });

  it("should open Recover only after polling has paused, then resume once", () => {
    navigate.mockClear();
    send.mockClear();
    jest.mocked(useIsFocused).mockReturnValue(true);
    useSession.mockReturnValue(
      session({
        state: "deviceSetup.restoreRecover",
        context: unseededContext({
          currentOnboardingStep: "restore-recover-backup",
          firmwareVersion: "1.8.0",
          pollingPaused: false,
        }),
      }),
    );

    const { result, rerender } = renderFunnel();

    act(() => restoreOf(result.current).onContinue());

    expect(send).toHaveBeenCalledWith({ type: "PAUSE_POLLING" });
    expect(navigate).not.toHaveBeenCalled();

    useSession.mockReturnValue(
      session({
        state: "deviceSetup.restoreRecover",
        context: unseededContext({ pollingPaused: true, firmwareVersion: "1.8.0" }),
      }),
    );
    rerender(undefined);

    expect(navigate).toHaveBeenCalledWith(NavigatorName.Base, {
      screen: ScreenName.DeviceOnboardingRecover,
      params: {
        platform: "protect-simu",
        device,
        redirectTo: "restore",
      },
    });

    jest.mocked(useIsFocused).mockReturnValue(false);
    rerender(undefined);
    jest.mocked(useIsFocused).mockReturnValue(true);
    rerender(undefined);

    expect(send).toHaveBeenCalledWith({ type: "RESUME_POLLING" });
    expect(send.mock.calls.filter(([event]) => event.type === "RESUME_POLLING")).toHaveLength(1);

    jest.mocked(useIsFocused).mockReturnValue(false);
    rerender(undefined);
    jest.mocked(useIsFocused).mockReturnValue(true);
    rerender(undefined);

    expect(send.mock.calls.filter(([event]) => event.type === "RESUME_POLLING")).toHaveLength(1);
  });

  it("should resume instead of opening Recover when Close lands before the pause is acknowledged", () => {
    navigate.mockClear();
    send.mockClear();
    jest.mocked(useIsFocused).mockReturnValue(true);
    useSession.mockReturnValue(
      session({
        state: "deviceSetup.restoreRecover",
        context: unseededContext({
          currentOnboardingStep: "restore-recover-backup",
          firmwareVersion: "1.8.0",
          pollingPaused: false,
        }),
      }),
    );

    const { result, rerender } = renderFunnel();
    const restore = restoreOf(result.current);

    act(() => restore.onContinue());
    act(() => restore.onClose());

    expect(result.current.status).toBe("setup");

    useSession.mockReturnValue(
      session({
        state: "deviceSetup.restoreRecover",
        context: unseededContext({ pollingPaused: true, firmwareVersion: "1.8.0" }),
      }),
    );
    rerender(undefined);

    expect(navigate).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledWith({ type: "RESUME_POLLING" });
  });

  it("should not pause polling for a seeded device", () => {
    send.mockClear();
    useSession.mockReturnValue(
      session({
        state: "checks.firmwareCheck",
        context: seededContext(),
      }),
    );

    renderFunnel();

    expect(send).not.toHaveBeenCalledWith({ type: "PAUSE_POLLING" });
    expect(send).not.toHaveBeenCalledWith({ type: "RESUME_POLLING" });
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
    setupOf(result.current).checks?.onStart();
    expect(send).toHaveBeenCalledWith({ type: "RETRY" });
  });
  describe("when an unseeded device disconnects during the setup", () => {
    it("should keep the stage, reconnect to the same device and show the reconnecting sheet", () => {
      const { result, connect } = dropDuringPin();

      const setup = setupOf(result.current);
      expect(setup.stage.kind).toBe("pin");
      expect(setup.connection?.state).toBe("reconnecting");
      expect(connect).toHaveBeenCalledTimes(1);
      expect(connect).toHaveBeenCalledWith("device-id");
    });

    it("should show the failed sheet when the reconnection fails, and reconnect on retry", () => {
      const { result, connect, update } = dropDuringPin();

      update({ state: "awaitingSession", error: "unknown-error" });
      expect(setupOf(result.current).connection?.state).toBe("failed");

      act(() => setupOf(result.current).connection?.retry());

      expect(connect).toHaveBeenCalledTimes(2);
      expect(connect).toHaveBeenLastCalledWith("device-id");
    });

    it("should close the sheet on the same stage once the session is back", () => {
      const { result, update } = dropDuringPin();

      update({ state: "readingState" });

      const setup = setupOf(result.current);
      expect(setup.stage.kind).toBe("pin");
      expect(setup.connection).toBeNull();
    });

    it("should reconnect again on a second drop after reconnecting to a locked device", () => {
      const { result, connect, update } = dropDuringPin();

      update({ state: "deviceLocked" });
      const locked = setupOf(result.current);
      expect(locked.stage.kind).toBe("pin");
      expect(locked.connection).toBeNull();

      update({ state: "awaitingSession" });

      expect(setupOf(result.current).connection?.state).toBe("reconnecting");
      expect(connect).toHaveBeenCalledTimes(2);
    });

    it("should keep showing the connecting screen after a firmware update", () => {
      const { result } = dropDuringPin({ state: "awaitingSessionAfterFirmwareUpdate" });

      expect(result.current.status).toBe("connecting");
    });
  });

  describe("seeded funnel tracking", () => {
    it("should leave the refusal page and the retry click to the drawer when the device refuses", () => {
      useSession.mockReturnValue(
        seededSession(
          "checks.genuineFailed",
          {
            lastGenuineFailure: { kind: "GENUINE_CHECK_REFUSED" },
          } as Partial<DeviceOnboardingContext>,
          { genuineFailureKind: "GENUINE_CHECK_REFUSED" },
        ),
      );

      const { result } = renderFunnel();
      const checks = checksOf(result.current);
      checks.onRetry();

      expect(screensOf(checks)).toEqual([]);
      expect(checks.funnelProps).toMatchObject({ deviceModelId: "stax" });
      expect(clicks()).toEqual([]);
      expect(send).toHaveBeenCalledWith({ type: "RETRY" });
    });

    it.each([
      [null, ["Genuine Check success"]],
      ["offerSheet", ["Genuine Check success", "OS update required"]],
      ["decisionScreen", ["Genuine Check success", "OS update required refusal screen"]],
      ["unsupportedUsbDrawer", ["Genuine Check success", "Drawer : OS update unsupported"]],
    ] as const)("should show the genuine success page then the %s page", (step, expected) => {
      expect(screensOf(renderUpdateOffer(), step)).toEqual(expected);
    });

    it("should send the unsupported reason when the device needs USB", () => {
      const checks = renderUpdateOffer();

      expect(checks.screensFor?.("unsupportedUsbDrawer").at(-1)?.tracking).toEqual(
        expect.objectContaining({ reason: "usb_required", deviceModelId: "stax" }),
      );
    });

    it("should send the update availability on the genuine success page", () => {
      expect(renderUpdateOffer().screensFor?.("offerSheet")[0]?.tracking).toEqual(
        expect.objectContaining({
          category: "Genuine Check success",
          firmware_update_availability: "yes",
        }),
      );
    });

    it("should send close when the user closes the offer sheet", () => {
      renderUpdateOffer().onUpdateSheetClosed?.();

      expect(clicks()).toEqual(["close"]);
    });

    it.each([
      ["Install Ledger OS update", "onInstallUpdate"],
      ["Continue", "onUpdatePressed"],
      ["Skip Ledger OS update", "onDeclineUpdate"],
      ["close", "onClosePressed"],
    ] as const)("should send %s when the user presses it", (button, press) => {
      const checks = renderUpdateOffer();
      checks[press]?.();

      expect(clicks()).toEqual([button]);
    });

    it("should mark the firmware update as started on the Continue tap, before the eligibility check", () => {
      useSession.mockReturnValue(
        seededSession(
          "checks.firmwareUpdateOffered",
          { firmware: offered(availableUpdate) },
          {
            firmwareVersion: "1.0.0",
            availableFirmwareVersion: "1.1.0",
          },
        ),
      );

      const { result } = renderFunnel();
      act(() => checksOf(result.current).onUpdatePressed?.());
      const exit = recorded.host?.onLeave?.("offerLedgerSync", seededMachineContext());

      expect(send).not.toHaveBeenCalled();
      expect(exit).toEqual(expect.objectContaining({ firmwareUpdateStarted: true }));
    });

    it("should leave from the checks without a click: the close button sends it", () => {
      useSession.mockReturnValue(seededSession("checks.firmwareCheck"));

      const { result } = renderFunnel();
      act(() => checksOf(result.current).onQuit?.());

      expect(clicks()).toEqual([]);
      expect(result.current.quitConfirmation?.isOpen).toBe(true);
      expect(events()).not.toContain("onboarding_aborted");
    });

    it("should send the genuine success page again, as a new screen, after a skipped OS update", () => {
      const before = renderUpdateOffer().screensFor?.("offerSheet")[0];
      useSession.mockReturnValue(
        seededSession(
          "checks.checksSucceeded",
          { firmware: declined },
          {
            firmwareUpToDate: false,
            firmwareChecked: true,
          },
        ),
      );

      const [after] = checksOf(renderFunnel().result.current).screensFor?.(null) ?? [];

      expect(after?.tracking).toEqual(
        expect.objectContaining({
          category: "Genuine Check success",
          firmware_update_availability: "yes",
        }),
      );
      expect(after?.key).not.toBe(before?.key);
    });

    it.each([
      [upToDate, "no"],
      [skipped, "unknown"],
    ] as const)("should send availability %o → %s on the result page", (check, availability) => {
      useSession.mockReturnValue(
        seededSession(
          "checks.checksSucceeded",
          { firmware: check },
          {
            firmwareUpToDate: check === upToDate,
            firmwareChecked: true,
          },
        ),
      );

      expect(checksOf(renderFunnel().result.current).screensFor?.(null)[0]?.tracking).toEqual(
        expect.objectContaining({ firmware_update_availability: availability }),
      );
    });

    it("should keep the checks page while the device is locked, so unlock sends it once", () => {
      useSession.mockReturnValue(seededSession("checks.firmwareCheck"));
      const { result, rerender } = renderFunnel();
      const before = checksOf(result.current).screensFor?.(null);

      useSession.mockReturnValue(seededSession("deviceLocked"));
      rerender(undefined);

      expect(checksOf(result.current).screensFor?.(null)).toEqual(before);
    });

    it.each([
      ["an unseeded device", "checks.checksSucceeded", { onboardedOnEntry: false }],
      ["a leave before the device read", null, null],
    ])("should send nothing for %s", (_case, state, context) => {
      useSession.mockReturnValue(
        session({
          status: state ? "running" : "connecting",
          state,
          liveDevice: state ? device : null,
          context: context as DeviceOnboardingSession["context"],
        }),
      );

      const { result } = renderFunnel();
      if (result.current.status === "connecting") result.current.onQuit();

      expect(pages()).toEqual([]);
      expect(events()).toEqual([]);
    });

    it("should send close from the connecting screen's close", () => {
      useSession.mockReturnValue({
        ...seededSession("checks.firmwareCheck"),
        status: "connecting",
        liveDevice: null,
      });

      const { result } = renderFunnel();
      if (result.current.status !== "connecting") throw new Error(result.current.status);
      act(() => {
        if (result.current.status === "connecting") result.current.onQuit();
      });

      expect(clicks()).toEqual(["close"]);
    });

    it.each([
      ["completed", true, ["onboarding_started", "onboarding_done"]],
      ["userQuit", true, ["onboarding_started", "onboarding_done"]],
      ["userQuit", false, ["onboarding_started", "onboarding_aborted"]],
      ["resumeFirmwareUpdate", true, ["onboarding_started", "onboarding_aborted"]],
      ["offerLedgerSync", true, ["onboarding_started"]],
      ["legacyFallback", true, ["onboarding_started", "onboarding_done"]],
      ["legacyFallback", false, []],
    ] as const)("should end a %s exit (genuine: %s) with %j", (reason, genuine, sent) => {
      useSession.mockReturnValue(seededSession("readingState"));
      renderFunnel();

      const exit = recorded.host?.onLeave?.(
        reason,
        seededMachineContext({
          firmwareVersion: null,
          genuineVerdict: { sessionId: "s1", isGenuine: genuine },
        }),
      );

      expect(events()).toEqual(sent);
      expect(exit ?? null).toEqual(
        sent.length ? expect.objectContaining({ deviceType: "stax" }) : null,
      );
    });
  });
});
