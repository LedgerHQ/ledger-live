import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { DeviceModelId as LedgerDeviceModelId } from "@ledgerhq/types-devices";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import { createTestDevice, knownStax } from "../testing/testDevice";
import { useDeviceOnboarding } from "./useDeviceOnboarding";
import { useDeviceOnboardingExit } from "./useDeviceOnboardingExit";

jest.mock("./useDeviceOnboardingExit", () => ({
  useDeviceOnboardingExit: jest.fn(),
}));

jest.mock("./useFirmwareUpdateHandover", () => ({
  useFirmwareUpdateHandover: jest.fn(),
}));

const exitHook = jest.mocked(useDeviceOnboardingExit);

describe("useDeviceOnboarding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  // Quit ends the run. The next screen needs the app device, not only the devtool text.
  it("passes the screen device when the user quits", async () => {
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
    expect(exitHook).toHaveBeenLastCalledWith({
      device: {
        deviceId: "device-id",
        deviceName: "Ledger Stax",
        modelId: LedgerDeviceModelId.stax,
        wired: false,
      },
      output: expect.objectContaining({ reason: "userQuit" }),
      navigateOnExit: true,
    });
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
