import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { OnboardingStep } from "@features/platform-device-onboarding";
import {
  DeviceManagementKitBLETransport,
  activeHidDeviceSessionSubject,
} from "@ledgerhq/live-dmk-mobile";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId as LedgerDeviceModelId } from "@ledgerhq/types-devices";
import { act, renderHook, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useDeviceOnboarding } from "../hooks/useDeviceOnboarding";
import { createScriptedTestDevice } from "../testing/scriptedTestDevice";
import { createTestDevice, knownStax } from "../testing/testDevice";
import { useLeaveOnboarding } from "../hooks/useLeaveOnboarding";

const leaveOnboarding = jest.fn();

jest.mock("../hooks/useLeaveOnboarding", () => ({
  useLeaveOnboarding: jest.fn(() => leaveOnboarding),
}));

jest.mock("../hooks/useFirmwareUpdateHandover", () => ({
  useFirmwareUpdateHandover: jest.fn(() => ({ close: jest.fn() })),
}));

const leaveHook = jest.mocked(useLeaveOnboarding);

describe("useDeviceOnboarding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    activeDeviceSessionSubject.next(null);
    activeHidDeviceSessionSubject.next(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("saves each event on the state it led to", async () => {
    const device = createTestDevice();
    const { result } = renderHook(() =>
      useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
    );

    await connectStax(result, device);
    expect(result.current.log.at(-1)?.state).toBe("readingState");
    expect(result.current.nextStates).toEqual(
      expect.arrayContaining([{ event: "DEVICE_STATE_READ", state: "routing" }]),
    );
    expect(result.current.nextStates.map(row => row.event)).toEqual(
      expect.not.arrayContaining(["LOCKED", "TRANSPORT_LOST", "QUIT"]),
    );

    await quit(result);
    const quitRow = [...result.current.log].reverse().find(row => row.event?.type === "QUIT");
    expect(quitRow?.state).toBe("exitOnboarding");
  });

  it("keeps the newest 200 log rows, so a long run does not grow without end", async () => {
    const device = createTestDevice();
    const { result } = renderHook(() =>
      useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
    );

    await connectStax(result, device);
    // A device that locks and unlocks again and again, the longest run QA sees.
    for (let index = 0; index < 150; index++) {
      act(() => result.current.send({ type: "LOCKED" }));
      act(() => result.current.send({ type: "UNLOCKED" }));
    }

    await waitFor(() => expect(result.current.log).toHaveLength(200));
    expect(result.current.log.at(-1)?.event?.type).toBe("UNLOCKED");
  });

  // A lost Bluetooth connection must bring Connect back.
  // SESSION_READY stays off until a new session is watched.
  it("hides the device when Bluetooth disconnects, so Connect can be used again", async () => {
    const device = createTestDevice();
    const { result } = renderHook(() =>
      useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
    );

    await connectStax(result, device);
    act(() => device.unplug());

    await waitFor(() => expect(result.current.device).toBeNull());
    expect(result.current.status).toBe("running");
    expect(result.current.state).toBe("awaitingSession");
    expect(canSend(result, "SESSION_READY")).toBe(false);
  });

  // The machine can report the lost connection itself, not only the session watch.
  it("hides the device when the machine reports a lost connection", async () => {
    const device = createTestDevice();
    const { result } = renderHook(() =>
      useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
    );

    await connectStax(result, device);
    act(() => result.current.send({ type: "TRANSPORT_LOST" }));

    expect(result.current.device).toBeNull();
    expect(result.current.status).toBe("running");
    expect(result.current.state).toBe("awaitingSession");
  });

  // The device id can change between connections (for example a new Bluetooth address).
  // The next screen must get the id of the last connection.
  it("passes the last connection's device when the id changes on reconnect", async () => {
    const device = createTestDevice();
    const { result } = renderHook(() =>
      useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
    );

    await connectStax(result, device);
    act(() => device.unplug());
    device.setSession("session-2");
    device.setDeviceId("device-id-2");
    await connectStax(result, device);
    await quit(result);

    expect(leaveOnboarding).toHaveBeenCalledWith(
      "userQuit",
      expect.objectContaining({ sessionId: "session-2", isOnboarded: false }),
    );
    expect(leaveHook).toHaveBeenLastCalledWith(
      expect.objectContaining({
        device: expect.objectContaining({ deviceId: "device-id-2", wired: false }),
      }),
    );
    // The run quits before SESSION_READY, so the machine must already follow the new session.
    expect(result.current.exit?.sessionId).toBe("session-2");
  });

  // The watch must start before SESSION_READY.
  // Otherwise the machine reads the device while nobody listens for a lost Bluetooth connection.
  it("watches the new session before SESSION_READY is offered", async () => {
    const device = createTestDevice();
    const { result } = renderHook(() =>
      useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
    );

    await connectStax(result, device);
    act(() => device.unplug());
    // The fake device keeps "session-1" until we change it.
    // This connect must be a new session, so we can see that this session is watched.
    device.setSession("session-2");
    await connectStax(result, device);

    expect(device.isWatching(device.sessionId)).toBe(true);
    expect(canSend(result, "SESSION_READY")).toBe(true);
  });

  // A new session can already be locked. The machine must poll it, not the lost one.
  it("polls the new session when it is already locked on reconnect", async () => {
    const device = createTestDevice();
    const { result } = renderHook(() =>
      useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
    );

    await connectStax(result, device);
    act(() => device.unplug());
    device.setSession("session-2");
    device.lock();
    await connectStax(result, device);

    await waitFor(() => expect(result.current.state).toBe("deviceLocked"));
    await waitFor(() => expect(device.sentTo.at(-1)).toBe("session-2"));
  });

  // Quit ends the run. The machine leaves once, and the app gets its device, not the devtool text.
  it("leaves with the screen device when the user quits", async () => {
    const onLeave = jest.fn();
    const device = createTestDevice();
    const { result } = renderHook(() =>
      useDeviceOnboarding({
        dmk: device.dmk,
        knownDevices: [knownStax],
        offerSync: false,
        onLeave,
      }),
    );

    await connectStax(result, device);
    await quit(result);
    expect(onLeave).toHaveBeenCalledTimes(1);

    expect(result.current.exit).toEqual({
      reason: "userQuit",
      sessionId: device.sessionId,
      modelId: DeviceModelId.STAX,
    });
    expect(leaveOnboarding.mock.calls).toEqual([
      ["userQuit", expect.objectContaining({ sessionId: device.sessionId })],
    ]);
    expect(leaveHook).toHaveBeenLastCalledWith({
      navigateOnExit: true,
      wasReadOnlyAtEntry: false,
      device: {
        deviceId: "device-id",
        deviceName: "Ledger Stax",
        modelId: LedgerDeviceModelId.stax,
        wired: false,
      },
    });
  });

  it("tells the machine the host can set up an unseeded device when that flag is on", async () => {
    const device = createTestDevice();
    const { result } = renderHook(
      () => useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
      {
        overrideInitialState: withFlagOverrides({
          deviceOnboarding: { enabled: true, params: { connectUnseededDevice: true } },
        }),
      },
    );

    await connectStax(result, device);

    expect(result.current.machineContext).toEqual(
      expect.objectContaining({ hostsSeedSetup: true }),
    );
  });

  it("leaves seed setup to legacy when the unseeded flag is off", async () => {
    const device = createTestDevice();
    const { result } = renderHook(() =>
      useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
    );

    await connectStax(result, device);

    expect(result.current.machineContext).toEqual(
      expect.objectContaining({ hostsSeedSetup: false }),
    );
  });

  it("keeps the screen awake from connect until reset", async () => {
    const device = createTestDevice();
    const { result } = renderHook(() =>
      useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
    );
    expect(activateKeepAwakeAsync).not.toHaveBeenCalled();

    await connectStax(result, device);
    expect(activateKeepAwakeAsync).toHaveBeenCalledTimes(1);

    act(() => result.current.reset());
    expect(deactivateKeepAwake).toHaveBeenCalledTimes(1);
  });

  it("closes the device session when the screen goes away", async () => {
    const closedSessionIds = closedSessions();
    const device = createTestDevice();
    const { result, unmount } = renderHook(() =>
      useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
    );

    await connectStax(result, device);
    await quit(result);
    expect(closedSessionIds).toEqual([]);

    unmount();

    await waitFor(() => expect(closedSessionIds).toEqual(["session-1"]));
    expect(activeDeviceSessionSubject.value).toBeNull();
  });

  it("closes the lost session before using the new one", async () => {
    const closedSessionIds = closedSessions();
    const device = createTestDevice();
    const { result } = renderHook(() =>
      useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
    );

    await connectStax(result, device);
    act(() => device.unplug());
    device.setSession("session-2");
    await connectStax(result, device);

    expect(closedSessionIds).toEqual(["session-1"]);
    expect(activeDeviceSessionSubject.value?.sessionId).toBe("session-2");
    expect(canSend(result, "SESSION_READY")).toBe(true);
  });

  // A new run must drop the old exit. Otherwise the next screen can open again.
  it("clears the old exit when a new run starts", async () => {
    const device = createTestDevice();
    const { result } = renderHook(() =>
      useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
    );

    await connectStax(result, device);
    await quit(result);
    await connectStax(result, device);

    expect(result.current.exit).toBeNull();
  });
});

function closedSessions() {
  const ids: string[] = [];
  jest
    .spyOn(DeviceManagementKitBLETransport.prototype, "close")
    .mockImplementation(function closeSession(this: DeviceManagementKitBLETransport) {
      ids.push(this.sessionId);
      return Promise.resolve();
    });
  return ids;
}

function canSend(
  result: { current: ReturnType<typeof useDeviceOnboarding> },
  type: string,
): boolean {
  return result.current.sendableEvents.some(({ event }) => event.type === type);
}

async function connectStax(
  result: { current: ReturnType<typeof useDeviceOnboarding> },
  device: ReturnType<typeof createTestDevice>,
) {
  device.show();
  act(() => result.current.connect());
  await waitFor(() => {
    expect(result.current.status).toBe("running");
    expect(result.current.device?.sessionId).toBe(device.sessionId);
  });
}

async function quit(result: { current: ReturnType<typeof useDeviceOnboarding> }) {
  act(() => result.current.send({ type: "QUIT" }));
  await waitFor(() => expect(result.current.status).toBe("exited"));
}

describe("scripted device onboarding", () => {
  it("drives a new device from connection to ready", async () => {
    const device = createScriptedTestDevice();
    const { result } = renderScripted(device);

    await connectToGenuineCheck(result, device);
    await finishSetup(result, device);

    expect(result.current.exit).toEqual({
      reason: "completed",
      sessionId: device.sessionId,
      modelId: DeviceModelId.STAX,
    });
    expect(device.isWatching(device.sessionId)).toBe(true);
    expect(device.commands()).toEqual([
      "closeApp",
      "getOsVersion",
      "toggleOnboardingEarlyCheck",
      "toggleOnboardingEarlyCheck",
      "getOsVersion",
    ]);
    expect(device.dmk.executeDeviceAction).toHaveBeenCalledTimes(2);
  });

  it("closes an app open on the device, then runs the checks", async () => {
    const device = createScriptedTestDevice();
    const { result } = renderScripted(device);
    device.openApp("Bitcoin");

    await connectToGenuineCheck(result, device);

    expect(result.current.state).toBe("checks.genuineCheck.running");
  });

  it("takes the device off the genuine check screen before closing the session on reset", async () => {
    const closedSessionIds = closedSessions();
    const device = createScriptedTestDevice();
    const { result } = renderScripted(device);
    await connectToGenuineCheck(result, device);
    expect(device.showsEarlyCheckScreen()).toBe(true);

    act(() => result.current.reset());
    expect(closedSessionIds).toEqual([]);

    device.acceptToggle();
    await waitFor(() => expect(closedSessionIds).toEqual([device.sessionId]));
    expect(device.showsEarlyCheckScreen()).toBe(false);
  });

  it("keeps the session a new screen took over when the old screen closes late", async () => {
    const closedSessionIds = closedSessions();
    const device = createScriptedTestDevice();
    const first = renderScripted(device);
    await connectToGenuineCheck(first.result, device);
    first.unmount();

    const { result } = renderScripted(device);
    device.show();
    act(() => result.current.connect());
    await waitFor(() => expect(result.current.status).toBe("running"));

    // The old screen's Exit lands only now, after the new screen took the session.
    device.acceptToggle();
    await waitFor(() => expect(device.showsEarlyCheckScreen()).toBe(false));
    answerWelcome(device);
    await waitFor(() => expect(result.current.state).toBe("awaitingStart"));

    expect(closedSessionIds).toEqual([]);
    expect(activeDeviceSessionSubject.value?.sessionId).toBe(device.sessionId);
  });

  it("allows a repeated secure-connection prompt once", async () => {
    const device = createScriptedTestDevice();
    const { result } = renderScripted(device);
    await connectToGenuineCheck(result, device);

    act(() => device.requestSecureConnection());
    await waitFor(() => expect(result.current.context?.secureConnectionRequested).toBe(true));

    act(() => device.requestSecureConnection());
    expect(allowedSecureConnections(result)).toHaveLength(0);

    act(() => device.allowSecureConnection());
    await waitFor(() => expect(result.current.context?.secureConnectionRequested).toBe(false));
    expect(allowedSecureConnections(result)).toHaveLength(1);

    await finishSetup(result, device);
    expect(result.current.exit?.reason).toBe("completed");
  });

  it("retries a failed genuine check and finishes setup", async () => {
    const device = createScriptedTestDevice();
    const { result } = renderScripted(device);
    await connectToGenuineCheck(result, device);

    act(() => device.failGenuineCheck());
    await waitFor(() => expect(result.current.state).toBe("checks.genuineFailed"));

    act(() => result.current.send({ type: "RETRY" }));
    await waitFor(() => expect(result.current.state).toBe("checks.genuineCheck.running"));

    await finishSetup(result, device);
    expect(result.current.exit?.reason).toBe("completed");
  });

  it("watches the new session before SESSION_READY and finishes on it", async () => {
    const device = createScriptedTestDevice();
    const { result } = renderScripted(device);
    await connectToGenuineCheck(result, device);

    act(() => device.unplug());
    await waitFor(() => expect(result.current.state).toBe("awaitingSession"));

    device.setSession("session-2");
    device.show();
    act(() => result.current.connect());
    await waitFor(() => expect(result.current.device?.sessionId).toBe("session-2"));
    expect(canSend(result, "SESSION_READY")).toBe(true);

    answerWelcome(device);
    device.acceptToggle();
    act(() => result.current.send({ type: "SESSION_READY" }));
    await waitFor(() => expect(result.current.state).toBe("checks.genuineCheck.running"));

    await finishSetup(result, device);
    expect(result.current.exit).toMatchObject({ reason: "completed", sessionId: "session-2" });
  });

  it("retries a failed firmware check and finishes setup", async () => {
    const device = createScriptedTestDevice();
    const { result } = renderScripted(device);
    await connectToGenuineCheck(result, device);

    act(() => device.passGenuineCheck());
    await waitFor(() => expect(result.current.state).toBe("checks.firmwareCheck"));

    act(() => device.failFirmwareCheck());
    await waitFor(() => expect(result.current.state).toBe("checks.firmwareCheckFailed"));

    act(() => result.current.send({ type: "RETRY" }));
    await waitFor(() => expect(result.current.state).toBe("checks.firmwareCheck"));

    device.acceptToggle();
    act(() => device.reportFirmwareUpToDate());
    await waitFor(() => expect(result.current.state).toBe("deviceSetup.waiting"));

    act(() =>
      device.answerState({
        onboardingState: OnboardingStep.Ready,
        numberOfWords: 24,
        currentWordIndex: 0,
        isOnboarded: true,
      }),
    );
    await waitFor(() => expect(result.current.status).toBe("exited"));
    expect(result.current.exit?.reason).toBe("completed");
  });
});

type ScriptedHook = { current: ReturnType<typeof useDeviceOnboarding> };

function renderScripted(device: ReturnType<typeof createScriptedTestDevice>) {
  return renderHook(
    () => useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
    {
      overrideInitialState: withFlagOverrides({
        deviceOnboarding: { enabled: true, params: { connectUnseededDevice: true } },
      }),
    },
  );
}

function allowedSecureConnections(result: ScriptedHook) {
  return result.current.log.filter(row => row.event?.type === "SECURE_CONNECTION_ALLOWED");
}

function answerWelcome(device: ReturnType<typeof createScriptedTestDevice>) {
  device.answerState({
    onboardingState: OnboardingStep.WelcomeScreen1,
    numberOfWords: 24,
    currentWordIndex: 0,
  });
}

async function connectToGenuineCheck(
  result: ScriptedHook,
  device: ReturnType<typeof createScriptedTestDevice>,
) {
  answerWelcome(device);
  device.show();
  act(() => result.current.connect());

  await waitFor(() => expect(result.current.state).toBe("awaitingStart"));
  expect(device.isWatching(device.sessionId)).toBe(true);

  device.acceptToggle();
  act(() => result.current.send({ type: "CONTINUE" }));
  await waitFor(() => expect(result.current.state).toBe("checks.genuineCheck.running"));
}

async function finishSetup(
  result: ScriptedHook,
  device: ReturnType<typeof createScriptedTestDevice>,
) {
  act(() => device.passGenuineCheck());
  await waitFor(() => expect(result.current.state).toBe("checks.firmwareCheck"));

  device.acceptToggle();
  act(() => device.reportFirmwareUpToDate());
  await waitFor(() => expect(result.current.state).toBe("deviceSetup.waiting"));

  act(() =>
    device.answerState({
      onboardingState: OnboardingStep.Ready,
      numberOfWords: 24,
      currentWordIndex: 0,
      isOnboarded: true,
    }),
  );
  await waitFor(() => expect(result.current.status).toBe("exited"));
}
