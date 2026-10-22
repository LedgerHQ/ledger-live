import { DeviceModelId, type DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { OnboardingStep } from "@features/platform-device-onboarding";
import { rnBleTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import { act, renderHook, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { useDeviceOnboarding } from "./useDeviceOnboarding";
import { createScriptedTestDevice } from "../testing/scriptedTestDevice";
import { knownStax } from "../testing/testDevice";

type HandoverProps = {
  onReconnectRequired: () => void;
};

function mockUseFirmwareUpdateHandover(props: HandoverProps) {
  mockUseFirmwareUpdateHandover.latest = props;
  return { close: jest.fn() };
}
mockUseFirmwareUpdateHandover.latest = null as HandoverProps | null;

jest.mock("./useFirmwareUpdateHandover", () => ({
  ...jest.requireActual<typeof import("./useFirmwareUpdateHandover")>(
    "./useFirmwareUpdateHandover",
  ),
  useFirmwareUpdateHandover: (props: HandoverProps) => mockUseFirmwareUpdateHandover(props),
}));

jest.mock("./useLeaveOnboarding", () => ({
  useLeaveOnboarding: () => jest.fn(),
}));

describe("useDeviceOnboarding reconnect after an OS update", () => {
  beforeEach(() => {
    mockUseFirmwareUpdateHandover.latest = null;
  });

  it("disconnects the old session before opening a new one, and watches it only once it returns", async () => {
    const device = createScriptedTestDevice();
    const calls: string[] = [];
    const { result, rerender } = renderHook(
      () => useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
      {
        overrideInitialState: withFlagOverrides({
          deviceOnboarding: { enabled: true, params: { connectUnseededDevice: true } },
        }),
      },
    );
    await connectStax(result, device);

    const disconnect = jest.fn(async ({ sessionId }: { sessionId: string }) => {
      calls.push(`disconnect:${sessionId}`);
    });
    device.dmk.disconnect = disconnect as DeviceManagementKit["disconnect"];
    device.dmk.listConnectedDevices = (() => {
      calls.push("list");
      return [];
    }) as DeviceManagementKit["listConnectedDevices"];
    device.setSession("session-2");
    device.show();

    act(() => {
      mockUseFirmwareUpdateHandover.latest?.onReconnectRequired();
    });
    rerender(undefined as never);

    await waitFor(() => expect(result.current.device?.sessionId).toBe("session-2"));
    expect(calls.indexOf("disconnect:session-1")).toBeLessThan(calls.indexOf("list"));
    expect(result.current.error).toBeNull();
    expect(result.current.log.some(row => row.event?.type === "SESSION_READY")).toBe(true);

    act(() => device.unplug());
    await waitFor(() => expect(lostTransport(result.current.log)).toBe(true));
    const readyAt = result.current.log.findIndex(row => row.event?.type === "SESSION_READY");
    const lostAt = result.current.log.findIndex(row => row.event?.type === "TRANSPORT_LOST");
    expect(readyAt).toBeGreaterThanOrEqual(0);
    expect(readyAt).toBeLessThan(lostAt);
  });

  it("shows an error when the original session is still the only connected device", async () => {
    const device = createScriptedTestDevice();
    const { result, rerender } = renderHook(
      () => useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
      {
        overrideInitialState: withFlagOverrides({
          deviceOnboarding: { enabled: true, params: { connectUnseededDevice: true } },
        }),
      },
    );
    await connectStax(result, device);

    device.dmk.disconnect = jest.fn(async () => undefined) as DeviceManagementKit["disconnect"];
    device.dmk.listConnectedDevices = (() => [
      { sessionId: device.sessionId },
    ]) as DeviceManagementKit["listConnectedDevices"];

    act(() => {
      mockUseFirmwareUpdateHandover.latest?.onReconnectRequired();
    });
    rerender(undefined as never);

    await waitFor(() => expect(result.current.error).toBe("Unable to reconnect to the device"));
    expect(result.current.device).toBeNull();
    expect(result.current.state).toBe("awaitingSessionAfterFirmwareUpdate");

    device.setSession("session-2");
    device.dmk.listConnectedDevices = (() => []) as DeviceManagementKit["listConnectedDevices"];
    device.show();
    act(() => result.current.connect());

    await waitFor(() => expect(result.current.device?.sessionId).toBe("session-2"));
    expect(result.current.error).toBeNull();
    act(() => device.unplug());
    await waitFor(() => expect(lostTransport(result.current.log)).toBe(true));
  });

  it("shows an error when another device is the only connected device", async () => {
    const device = createScriptedTestDevice();
    const { result, rerender } = renderHook(
      () => useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
      {
        overrideInitialState: withFlagOverrides({
          deviceOnboarding: { enabled: true, params: { connectUnseededDevice: true } },
        }),
      },
    );
    await connectStax(result, device);

    const disconnect = jest.fn(async () => undefined);
    device.dmk.disconnect = disconnect as DeviceManagementKit["disconnect"];
    device.dmk.listConnectedDevices = (() => [
      { sessionId: "session-other" },
    ]) as DeviceManagementKit["listConnectedDevices"];
    device.dmk.getConnectedDevice = (() => ({
      id: "other-id",
      name: "Ledger Nano X",
      type: "BLE",
      sessionId: "session-other",
      modelId: DeviceModelId.NANO_X,
      transport: rnBleTransportIdentifier,
    })) as DeviceManagementKit["getConnectedDevice"];

    act(() => {
      mockUseFirmwareUpdateHandover.latest?.onReconnectRequired();
    });
    rerender(undefined as never);

    await waitFor(() => expect(result.current.error).toBe("Unable to reconnect to the device"));
    expect(result.current.device).toBeNull();
    expect(result.current.state).toBe("awaitingSessionAfterFirmwareUpdate");
    expect(disconnect).toHaveBeenCalledWith({ sessionId: "session-other" });
  });

  it("drops the run when the user leaves while the old session is still closing", async () => {
    const device = createScriptedTestDevice();
    let releaseDisconnect: (() => void) | undefined;
    const { result, rerender } = renderHook(
      () => useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
      {
        overrideInitialState: withFlagOverrides({
          deviceOnboarding: { enabled: true, params: { connectUnseededDevice: true } },
        }),
      },
    );
    await connectStax(result, device);

    const disconnect = jest.fn(
      () =>
        new Promise<void>(resolve => {
          releaseDisconnect = resolve;
        }),
    );
    device.dmk.disconnect = disconnect as DeviceManagementKit["disconnect"];
    device.setSession("session-2");

    act(() => {
      mockUseFirmwareUpdateHandover.latest?.onReconnectRequired();
    });
    rerender(undefined as never);
    await waitFor(() => expect(disconnect).toHaveBeenCalled());

    act(() => result.current.abortFirmwareReconnect());
    expect(result.current.status).toBe("idle");
    expect(result.current.state).toBeNull();

    await act(async () => {
      releaseDisconnect?.();
    });
    expect(result.current.device).toBeNull();
    expect(result.current.status).toBe("idle");
  });
});

function lostTransport(log: ReturnType<typeof useDeviceOnboarding>["log"]): boolean {
  return log.some(row => row.event?.type === "TRANSPORT_LOST");
}

async function connectStax(
  result: { current: ReturnType<typeof useDeviceOnboarding> },
  device: ReturnType<typeof createScriptedTestDevice>,
) {
  device.answerState({
    onboardingState: OnboardingStep.WelcomeScreen1,
    numberOfWords: 24,
    currentWordIndex: 0,
  });
  device.show();
  act(() => result.current.connect());
  await waitFor(() => expect(result.current.state).toBe("awaitingStart"));

  device.acceptToggle();
  act(() => result.current.send({ type: "CONTINUE" }));
  await waitFor(() => expect(result.current.state).toBe("checks.genuineCheck.running"));

  act(() => device.passGenuineCheck());
  await waitFor(() => expect(result.current.state).toBe("checks.firmwareCheck"));

  act(() => device.reportAvailableFirmware());
  await waitFor(() => expect(result.current.state).toBe("checks.firmwareUpdateOffered"));

  act(() => result.current.send({ type: "USER_ACCEPT" }));
  await waitFor(() => expect(result.current.state).toBe("checks.firmwareUpdateDelegated"));
}
