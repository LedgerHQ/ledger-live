import { DeviceModelId as DmkDeviceModelId, DeviceStatus } from "@ledgerhq/device-management-kit";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import type { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/devices";
import { act, renderHook, waitFor } from "tests/testSetup";
import { BehaviorSubject, Observable } from "rxjs";
import { useDeviceOnboarding } from "../hooks/useDeviceOnboarding";
import { useFirmwareUpdateHandover } from "../hooks/useFirmwareUpdateHandover";
import { createDeviceOnboardingPorts } from "../utils/ports";

const openSession = jest.fn();
const getConnectedDevice = jest.fn();
type SessionState = { deviceStatus: DeviceStatus };
let sessionState = new BehaviorSubject<SessionState>({
  deviceStatus: DeviceStatus.CONNECTED,
});
const getDeviceSessionState = jest.fn(() => sessionState.asObservable());

jest.mock("@ledgerhq/live-dmk-desktop", () => ({
  DeviceManagementKitTransport: {
    open: () => openSession(),
  },
  getDeviceManagementKit: () => ({
    getConnectedDevice: (input: { sessionId: string }) => getConnectedDevice(input),
    getDeviceSessionState: () => getDeviceSessionState(),
    sendCommand: () => new Promise(() => undefined),
  }),
}));

const firmwareLookup: {
  status: string;
  deviceInfo: DeviceInfo | null;
  firmwareUpdateContext: FirmwareUpdateContext | null;
} = {
  status: "idle",
  deviceInfo: null,
  firmwareUpdateContext: null,
};

const firmwareHookCalls: Array<{ isHookEnabled: boolean }> = [];

jest.mock("@ledgerhq/live-common/deviceSDK/hooks/useGetLatestAvailableFirmware", () => ({
  useGetLatestAvailableFirmware: (input: { isHookEnabled: boolean }) => {
    firmwareHookCalls.push({ isHookEnabled: input.isHookEnabled });
    return { state: firmwareLookup };
  },
}));

const setDrawer = jest.fn();
jest.mock("~/renderer/drawers/Provider", () => ({
  setDrawer: (...args: unknown[]) => setDrawer(...args),
}));

const mockKeepAwake = jest.fn();
jest.mock("~/renderer/hooks/useKeepScreenAwake", () => ({
  useKeepScreenAwake: (enabled: boolean) => mockKeepAwake(enabled),
}));

jest.mock("~/renderer/modals/UpdateFirmwareModal", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("~/renderer/screens/manager/FirmwareUpdate", () => ({
  initialStepId: () => "idCheck",
}));

const connectedDevice = {
  id: "device-id",
  name: "Nano X",
  modelId: DmkDeviceModelId.NANO_X,
};

type PublishedTransport = NonNullable<(typeof activeDeviceSessionSubject)["value"]>["transport"];

function publishTransport(sessionId: string): PublishedTransport {
  const transport = { sessionId, close: jest.fn() } as unknown as PublishedTransport;
  activeDeviceSessionSubject.next({ sessionId, transport });
  return transport;
}

describe("DeviceOnboarding desktop integration", () => {
  let sessionSubscribers = 0;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionSubscribers = 0;
    sessionState = new BehaviorSubject<SessionState>({ deviceStatus: DeviceStatus.CONNECTED });
    getDeviceSessionState.mockImplementation(
      () =>
        new Observable<SessionState>(observer => {
          sessionSubscribers += 1;
          const subscription = sessionState.subscribe(observer);
          return () => {
            sessionSubscribers -= 1;
            subscription.unsubscribe();
          };
        }),
    );
    activeDeviceSessionSubject.next(null);
    firmwareLookup.status = "idle";
    firmwareLookup.deviceInfo = null;
    firmwareLookup.firmwareUpdateContext = null;
    firmwareHookCalls.length = 0;
    getConnectedDevice.mockReturnValue(connectedDevice);
    openSession.mockImplementation(async () => {
      const current = activeDeviceSessionSubject.value?.transport;
      if (current) return current;
      return publishTransport("session-1");
    });
  });

  it("should reuse the published session when open is called again", async () => {
    const first = createDeviceOnboardingPorts();
    await first.openSession();
    const published = activeDeviceSessionSubject.value?.transport;

    const second = createDeviceOnboardingPorts();
    await second.openSession();

    expect(activeDeviceSessionSubject.value?.transport).toBe(published);
    expect(openSession).toHaveBeenCalledTimes(2);
  });

  it("should follow the session id when the published transport is replaced", async () => {
    const ports = createDeviceOnboardingPorts();
    await ports.openSession();

    publishTransport("session-3");

    expect(ports.currentSessionId()).toBe("session-3");
  });

  it("should follow the session id when the transport reconnects without republishing", async () => {
    const ports = createDeviceOnboardingPorts();
    await ports.openSession();

    const transport = activeDeviceSessionSubject.value?.transport;
    expect(transport?.sessionId).toBe("session-1");
    if (!transport) throw new Error("published transport missing");
    transport.sessionId = "session-after-reboot";

    expect(activeDeviceSessionSubject.value?.sessionId).toBe("session-1");
    expect(ports.currentSessionId()).toBe("session-after-reboot");
  });

  it("should resume the machine from the live session after the transport is lost", async () => {
    const { result } = renderHook(() => useDeviceOnboarding());

    act(() => result.current.connect());
    await waitFor(() => expect(result.current.status).toBe("running"));
    expect(result.current.device?.sessionId).toBe("session-1");

    act(() => {
      activeDeviceSessionSubject.next(null);
    });
    await waitFor(() => expect(result.current.state).toBe("awaitingSession"));
    expect(result.current.device).toBeNull();

    act(() => {
      publishTransport("session-2");
    });

    await waitFor(() => expect(result.current.device?.sessionId).toBe("session-2"));
    expect(result.current.state).toBe("readingState");
    expect(result.current.events.some(event => event.type === "SESSION_READY")).toBe(true);
  });

  it("should restart onboarding when the recovered session belongs to another Ledger", async () => {
    const { result } = renderHook(() => useDeviceOnboarding());

    act(() => result.current.connect());
    await waitFor(() => expect(result.current.state).toBe("readingState"));

    act(() => {
      activeDeviceSessionSubject.next(null);
    });
    await waitFor(() => expect(result.current.state).toBe("awaitingSession"));

    getConnectedDevice.mockReturnValue({
      id: "other-device",
      name: "Stax",
      modelId: DmkDeviceModelId.STAX,
    });
    act(() => {
      publishTransport("session-2");
    });

    await waitFor(() => expect(result.current.device?.sessionId).toBe("session-2"));
    expect(result.current.context?.deviceModelId).toBe(DmkDeviceModelId.STAX);
    expect(result.current.state).toBe("readingState");
    expect(result.current.events.some(event => event.type === "SESSION_READY")).toBe(false);
    expect(setDrawer).not.toHaveBeenCalled();
  });

  it("should restart onboarding when another Ledger replaces the published session directly", async () => {
    const { result } = renderHook(() => useDeviceOnboarding());

    act(() => result.current.connect());
    await waitFor(() => expect(result.current.state).toBe("readingState"));

    getConnectedDevice.mockReturnValue({
      id: "other-device",
      name: "Stax",
      modelId: DmkDeviceModelId.STAX,
    });
    act(() => {
      publishTransport("session-2");
    });

    await waitFor(() => expect(result.current.device?.sessionId).toBe("session-2"));
    expect(result.current.context?.deviceModelId).toBe(DmkDeviceModelId.STAX);
    expect(result.current.state).toBe("readingState");
    expect(result.current.events.some(event => event.type === "SESSION_READY")).toBe(false);
  });

  it("should pause the machine when the device locks and resume when it unlocks", async () => {
    const { result } = renderHook(() => useDeviceOnboarding());

    act(() => result.current.connect());
    await waitFor(() => expect(result.current.state).toBe("readingState"));

    act(() => {
      sessionState.next({ deviceStatus: DeviceStatus.CONNECTED });
      sessionState.next({ deviceStatus: DeviceStatus.LOCKED });
    });

    await waitFor(() => expect(result.current.state).toBe("deviceLocked"));

    act(() => {
      sessionState.next({ deviceStatus: DeviceStatus.CONNECTED });
    });

    await waitFor(() => expect(result.current.state).toBe("readingState"));
  });

  it("should start in the locked state when the reused session is already locked", async () => {
    sessionState = new BehaviorSubject<SessionState>({ deviceStatus: DeviceStatus.LOCKED });
    const { result } = renderHook(() => useDeviceOnboarding());

    act(() => result.current.connect());

    await waitFor(() => expect(result.current.state).toBe("deviceLocked"));
    expect(getDeviceSessionState).toHaveBeenCalledTimes(1);

    act(() => {
      sessionState.next({ deviceStatus: DeviceStatus.CONNECTED });
    });

    await waitFor(() => expect(result.current.state).toBe("readingState"));
  });

  it("should subscribe once when the recovered session is already locked", async () => {
    const { result } = renderHook(() => useDeviceOnboarding());

    act(() => result.current.connect());
    await waitFor(() => expect(result.current.state).toBe("readingState"));

    act(() => {
      activeDeviceSessionSubject.next(null);
    });
    await waitFor(() => expect(result.current.state).toBe("awaitingSession"));

    sessionState = new BehaviorSubject<SessionState>({ deviceStatus: DeviceStatus.LOCKED });
    act(() => {
      publishTransport("session-2");
    });

    await waitFor(() => expect(result.current.state).toBe("deviceLocked"));
    expect(getDeviceSessionState).toHaveBeenCalledTimes(2);
  });

  it("should wait for a new session when the session state disconnects", async () => {
    const { result } = renderHook(() => useDeviceOnboarding());

    act(() => result.current.connect());
    await waitFor(() => expect(result.current.state).toBe("readingState"));

    act(() => {
      sessionState.next({ deviceStatus: DeviceStatus.CONNECTED });
      sessionState.next({ deviceStatus: DeviceStatus.NOT_CONNECTED });
    });

    await waitFor(() => expect(result.current.state).toBe("awaitingSession"));
    expect(result.current.device).toBeNull();
  });

  it("should wait for a new session when the session listener fails", async () => {
    const { result } = renderHook(() => useDeviceOnboarding());

    act(() => result.current.connect());
    await waitFor(() => expect(result.current.state).toBe("readingState"));

    act(() => {
      sessionState.error(new Error("session listener failed"));
    });

    await waitFor(() => expect(result.current.state).toBe("awaitingSession"));
    expect(result.current.device).toBeNull();
  });

  it("should discard a recovery that finishes after reset", async () => {
    const { result } = renderHook(() => useDeviceOnboarding());

    act(() => result.current.connect());
    await waitFor(() => expect(result.current.status).toBe("running"));

    let release: ((value: unknown) => void) | undefined;
    openSession.mockImplementation(
      () =>
        new Promise(resolve => {
          release = resolve;
        }),
    );

    act(() => {
      activeDeviceSessionSubject.next(null);
    });
    await waitFor(() => expect(result.current.state).toBe("awaitingSession"));

    act(() => {
      publishTransport("session-2");
    });
    await waitFor(() => expect(release).toBeDefined());

    act(() => result.current.reset());
    await act(async () => {
      release?.(activeDeviceSessionSubject.value?.transport);
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.device).toBeNull();
    expect(result.current.state).toBeNull();
    expect(sessionSubscribers).toBe(0);
  });

  it("should stop listening when the machine exits", async () => {
    const { result } = renderHook(() => useDeviceOnboarding());

    act(() => result.current.connect());
    await waitFor(() => expect(result.current.state).toBe("readingState"));
    expect(sessionSubscribers).toBe(1);

    act(() => {
      result.current.send({ type: "QUIT" });
    });

    await waitFor(() => expect(result.current.status).toBe("exited"));
    expect(sessionSubscribers).toBe(0);
  });

  it("should unsubscribe when the session is already gone as the listener starts", async () => {
    sessionState = new BehaviorSubject<SessionState>({ deviceStatus: DeviceStatus.NOT_CONNECTED });
    const { result } = renderHook(() => useDeviceOnboarding());

    act(() => result.current.connect());

    await waitFor(() => expect(result.current.state).toBe("awaitingSession"));
    expect(sessionSubscribers).toBe(0);
  });

  it("should send FIRMWARE_UPDATE_FLOW_CLOSED once when both drawer closes fire", () => {
    const send = jest.fn();
    const device = {
      deviceId: "device-id",
      deviceName: "Nano X",
      modelId: DeviceModelId.nanoX,
      wired: true,
    } satisfies Device;

    const props = {
      device,
      machineState: "checks.firmwareUpdateDelegated",
    };
    const rendered = renderHook(() =>
      useFirmwareUpdateHandover({
        device: props.device,
        machineState: props.machineState,
        send,
      }),
    );

    firmwareLookup.status = "available-firmware";
    firmwareLookup.deviceInfo = {
      version: "2.2.0",
      isOSU: false,
      mcuVersion: "1.0",
    } as DeviceInfo;
    firmwareLookup.firmwareUpdateContext = {
      osu: {},
      final: { name: "2.3.0" },
      shouldFlashMCU: false,
    } as FirmwareUpdateContext;
    rendered.rerender(undefined);

    const drawerProps = setDrawer.mock.calls[0]?.[1] as {
      onDrawerClose: () => void;
      onRequestClose: () => void;
    };

    act(() => {
      drawerProps.onDrawerClose();
      drawerProps.onRequestClose();
    });

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: "FIRMWARE_UPDATE_FLOW_CLOSED" });
    expect(mockKeepAwake).toHaveBeenCalledWith(true);
    expect(mockKeepAwake).toHaveBeenLastCalledWith(false);
  });

  it.each(["onDrawerClose", "onRequestClose"] as const)(
    "should send FIRMWARE_UPDATE_FLOW_CLOSED once from %s alone",
    close => {
      const send = jest.fn();
      const rendered = renderHook(() =>
        useFirmwareUpdateHandover({
          device: nanoDevice(),
          machineState: "checks.firmwareUpdateDelegated",
          send,
        }),
      );

      publishAvailableFirmware();
      rendered.rerender(undefined);

      const drawerProps = setDrawer.mock.calls[0]?.[1] as Record<typeof close, () => void>;
      act(() => {
        drawerProps[close]();
      });

      expect(send).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledWith({ type: "FIRMWARE_UPDATE_FLOW_CLOSED" });
    },
  );

  it.each(["error", "no-available-firmware"] as const)(
    "should finish the handover without closing another drawer when lookup returns %s",
    status => {
      const send = jest.fn();
      const rendered = renderHook(() =>
        useFirmwareUpdateHandover({
          device: nanoDevice(),
          machineState: "checks.firmwareUpdateDelegated",
          send,
        }),
      );

      firmwareLookup.status = status;
      rendered.rerender(undefined);

      expect(send).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledWith({ type: "FIRMWARE_UPDATE_FLOW_CLOSED" });
      expect(setDrawer).not.toHaveBeenCalled();
    },
  );

  it("should ignore a stale firmware result until the lookup restarts", () => {
    const send = jest.fn();
    const device = nanoDevice();
    const props = { machineState: "checks.firmwareUpdateDelegated" };
    const rendered = renderHook(() =>
      useFirmwareUpdateHandover({
        device,
        machineState: props.machineState,
        send,
      }),
    );

    firmwareLookup.status = "error";
    rendered.rerender(undefined);
    expect(send).toHaveBeenCalledTimes(1);
    expect(setDrawer).not.toHaveBeenCalled();

    props.machineState = "readingState";
    rendered.rerender(undefined);
    firmwareLookup.status = "error";
    props.machineState = "checks.firmwareUpdateDelegated";
    rendered.rerender(undefined);

    expect(send).toHaveBeenCalledTimes(1);
    expect(setDrawer).not.toHaveBeenCalled();

    firmwareLookup.status = "ongoing";
    rendered.rerender(undefined);
    publishAvailableFirmware();
    rendered.rerender(undefined);

    expect(setDrawer).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("should close the firmware drawer when the machine leaves the handover", () => {
    const send = jest.fn();
    const props = { machineState: "checks.firmwareUpdateDelegated" };
    const rendered = renderHook(() =>
      useFirmwareUpdateHandover({
        device: nanoDevice(),
        machineState: props.machineState,
        send,
      }),
    );

    publishAvailableFirmware();
    rendered.rerender(undefined);
    const drawerProps = setDrawer.mock.calls[0]?.[1] as { onDrawerClose: () => void };

    props.machineState = "readingState";
    rendered.rerender(undefined);

    expect(setDrawer).toHaveBeenCalledWith();
    act(() => {
      drawerProps.onDrawerClose();
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("should close the firmware drawer when the tool unmounts", () => {
    const send = jest.fn();
    const rendered = renderHook(() =>
      useFirmwareUpdateHandover({
        device: nanoDevice(),
        machineState: "checks.firmwareUpdateDelegated",
        send,
      }),
    );

    publishAvailableFirmware();
    rendered.rerender(undefined);

    rendered.unmount();

    expect(setDrawer).toHaveBeenCalledWith();
    expect(send).not.toHaveBeenCalled();
  });

  it("should not look up firmware again when the device returns after the drawer opens", () => {
    const send = jest.fn();
    const device = nanoDevice();
    const props: { device: Device | null } = { device };
    const rendered = renderHook(() =>
      useFirmwareUpdateHandover({
        device: props.device,
        machineState: "checks.firmwareUpdateDelegated",
        send,
      }),
    );

    publishAvailableFirmware();
    rendered.rerender(undefined);
    expect(setDrawer).toHaveBeenCalledTimes(1);

    props.device = null;
    rendered.rerender(undefined);
    props.device = device;
    rendered.rerender(undefined);

    expect(firmwareHookCalls.at(-1)?.isHookEnabled).toBe(false);
    expect(setDrawer).toHaveBeenCalledTimes(1);
  });

  it("should leave the drawer closed when firmware metadata is missing", () => {
    const send = jest.fn();
    const rendered = renderHook(() =>
      useFirmwareUpdateHandover({
        device: nanoDevice(),
        machineState: "checks.firmwareUpdateDelegated",
        send,
      }),
    );

    firmwareLookup.status = "available-firmware";
    rendered.rerender(undefined);

    expect(setDrawer).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("should ignore the firmware completion callback", () => {
    const send = jest.fn();
    const rendered = renderHook(() =>
      useFirmwareUpdateHandover({
        device: nanoDevice(),
        machineState: "checks.firmwareUpdateDelegated",
        send,
      }),
    );

    publishAvailableFirmware();
    rendered.rerender(undefined);

    const drawerProps = setDrawer.mock.calls[0]?.[1] as { setFirmwareUpdateCompleted: () => void };
    act(() => {
      drawerProps.setFirmwareUpdateCompleted();
    });

    expect(send).not.toHaveBeenCalled();
    expect(setDrawer).toHaveBeenCalledTimes(1);
  });
});

function nanoDevice(): Device {
  return {
    deviceId: "device-id",
    deviceName: "Nano X",
    modelId: DeviceModelId.nanoX,
    wired: true,
  };
}

function publishAvailableFirmware() {
  firmwareLookup.status = "available-firmware";
  firmwareLookup.deviceInfo = {
    version: "2.2.0",
    isOSU: false,
    mcuVersion: "1.0",
  } as DeviceInfo;
  firmwareLookup.firmwareUpdateContext = {
    osu: {},
    final: { name: "2.3.0" },
    shouldFlashMCU: false,
  } as FirmwareUpdateContext;
}
