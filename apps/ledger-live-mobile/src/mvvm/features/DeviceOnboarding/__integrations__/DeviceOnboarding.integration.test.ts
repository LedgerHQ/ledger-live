import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { activeHidDeviceSessionSubject } from "@ledgerhq/live-dmk-mobile";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId as LedgerDeviceModelId } from "@ledgerhq/types-devices";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useDeviceOnboarding } from "../hooks/useDeviceOnboarding";
import { createTestDevice, knownStax } from "../testing/testDevice";
import { useLeaveOnboarding } from "../hooks/useLeaveOnboarding";

const leaveOnboarding = jest.fn();

jest.mock("../hooks/useLeaveOnboarding", () => ({
  useLeaveOnboarding: jest.fn(() => leaveOnboarding),
}));

jest.mock("../hooks/useFirmwareUpdateHandover", () => ({
  useFirmwareUpdateHandover: jest.fn(),
}));

const leaveHook = jest.mocked(useLeaveOnboarding);

describe("useDeviceOnboarding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    activeDeviceSessionSubject.next(null);
    activeHidDeviceSessionSubject.next(null);
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

    expect(leaveOnboarding).toHaveBeenCalledWith("userQuit");
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
    const device = createTestDevice();
    const { result } = renderHook(() =>
      useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
    );

    await connectStax(result, device);
    await quit(result);

    expect(result.current.exit).toEqual({
      reason: "userQuit",
      sessionId: device.sessionId,
      modelId: DeviceModelId.STAX,
    });
    expect(leaveOnboarding.mock.calls).toEqual([["userQuit"]]);
    expect(leaveHook).toHaveBeenLastCalledWith({
      navigateOnExit: true,
      device: {
        deviceId: "device-id",
        deviceName: "Ledger Stax",
        modelId: LedgerDeviceModelId.stax,
        wired: false,
      },
    });
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
