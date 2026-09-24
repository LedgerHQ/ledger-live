import type {
  ConnectedDevice,
  DeviceManagementKit,
  DeviceSessionState,
} from "@ledgerhq/device-management-kit";
import { DeviceModelId, DeviceStatus } from "@ledgerhq/device-management-kit";
import type { ConnectDeviceInput, ConnectDeviceUIState } from "@ledgerhq/live-dmk-mobile";
import {
  activeHidDeviceSessionSubject,
  connectDevice,
  ConnectDeviceUIStateTypes,
  DeviceManagementKitBLETransport,
  rnBleTransportIdentifier,
} from "@ledgerhq/live-dmk-mobile";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import { NEVER, Observable, Subject } from "rxjs";
import { useDeviceOnboarding } from "../hooks/useDeviceOnboarding";
import { createDeviceOnboardingPorts } from "../utils/ports";

jest.mock("@ledgerhq/live-dmk-mobile", () => ({
  ...jest.requireActual("@ledgerhq/live-dmk-mobile"),
  connectDevice: jest.fn(),
}));

const mockedConnectDevice = jest.mocked(connectDevice);

const connectedDevice = {
  id: "device-id",
  name: "Ledger Stax",
  type: "BLE",
  sessionId: "session-1",
  modelId: DeviceModelId.STAX,
  transport: rnBleTransportIdentifier,
} satisfies ConnectedDevice;

function createPortDmk(): DeviceManagementKit {
  return {
    getConnectedDevice: jest.fn(() => connectedDevice),
    getDeviceSessionState: jest.fn(() => NEVER),
  } as unknown as DeviceManagementKit;
}

describe("DeviceOnboarding mobile integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    activeDeviceSessionSubject.next(null);
    activeHidDeviceSessionSubject.next(null);
  });

  it("publishes and reuses an adopted session", async () => {
    const dmk = createPortDmk();
    const first = createDeviceOnboardingPorts({
      dmk,
      sessionId: "session-1",
      connectedDevice,
      wired: false,
    });
    await first.openSession();
    const published = activeDeviceSessionSubject.value?.transport;

    const second = createDeviceOnboardingPorts({
      dmk,
      sessionId: "session-1",
      connectedDevice,
      wired: false,
    });
    await second.openSession();

    expect(activeDeviceSessionSubject.value?.transport).toBe(published);
  });

  it("reads a session id overwritten on the published transport", async () => {
    const ports = createDeviceOnboardingPorts({
      dmk: createPortDmk(),
      sessionId: "session-1",
      connectedDevice,
      wired: false,
    });
    await ports.openSession();

    const transport = activeDeviceSessionSubject.value?.transport;
    if (!transport) throw new Error("Expected a published transport");
    transport.sessionId = "session-2";

    expect(ports.currentSessionId()).toBe("session-2");
  });

  it("reads a session id from a replacement published transport", async () => {
    const dmk = createPortDmk();
    const ports = createDeviceOnboardingPorts({
      dmk,
      sessionId: "session-1",
      connectedDevice,
      wired: false,
    });
    await ports.openSession();

    const replacement = new DeviceManagementKitBLETransport(dmk, "session-3");
    activeDeviceSessionSubject.next({ sessionId: "session-3", transport: replacement });

    expect(ports.currentSessionId()).toBe("session-3");
  });

  it("restarts the listener before offering SESSION_READY and exposes a terminal exit", async () => {
    const connectionInputs: ConnectDeviceInput[] = [];
    mockedConnectDevice.mockImplementation(input => {
      connectionInputs.push(input);
      return new Observable<ConnectDeviceUIState>(subscriber => {
        subscriber.next({ type: ConnectDeviceUIStateTypes.Loading });
      });
    });

    const sessionStates = new Map<string, Subject<DeviceSessionState>>([
      ["session-1", new Subject<DeviceSessionState>()],
      ["session-2", new Subject<DeviceSessionState>()],
    ]);
    const dmk = {
      getConnectedDevice: jest.fn(() => connectedDevice),
      getDeviceSessionState: jest.fn(({ sessionId }: { sessionId: string }) => {
        const subject = sessionStates.get(sessionId);
        if (!subject) throw new Error(`Unknown test session ${sessionId}`);
        return subject.asObservable();
      }),
      sendCommand: jest.fn(() => new Promise(() => undefined)),
    } as unknown as DeviceManagementKit;

    const { result } = renderHook(() =>
      useDeviceOnboarding({ dmk, knownDevices: [], offerSync: false }),
    );

    act(() => result.current.connect());
    await act(async () => {
      connectionInputs[0].onConnected(connectionResult(dmk, "session-1"));
    });
    await waitFor(() => expect(result.current.status).toBe("running"));

    act(() => {
      sessionStates.get("session-1")?.next({
        deviceStatus: DeviceStatus.NOT_CONNECTED,
      } as DeviceSessionState);
    });

    expect(result.current.device).toBeNull();
    expect(
      result.current.sendableEvents.some(({ event }) => event.type === "SESSION_READY"),
    ).toBe(false);

    act(() => result.current.connect());
    await act(async () => {
      connectionInputs[1].onConnected(connectionResult(dmk, "session-2"));
    });
    await waitFor(() =>
      expect(
        result.current.sendableEvents.some(({ event }) => event.type === "SESSION_READY"),
      ).toBe(true),
    );
    expect(sessionStates.get("session-2")?.observed).toBe(true);

    const sessionReady = result.current.sendableEvents.find(
      ({ event }) => event.type === "SESSION_READY",
    );
    if (!sessionReady) throw new Error("Expected SESSION_READY after listener restart");

    act(() => result.current.send(sessionReady.event));
    act(() => result.current.send({ type: "DEVICE_STATE_FAILED" }));

    await waitFor(() => expect(result.current.status).toBe("exited"));
    expect(result.current.exit).toEqual({
      reason: "legacyFallback",
      sessionId: "session-2",
      modelId: DeviceModelId.STAX,
    });

    act(() => result.current.connect());
    await act(async () => {
      connectionInputs[2].onConnected(connectionResult(dmk, "session-1"));
    });
    await waitFor(() => expect(result.current.status).toBe("running"));
    expect(result.current.exit).toEqual({
      reason: "legacyFallback",
      sessionId: "session-2",
      modelId: DeviceModelId.STAX,
    });
  });

  it("clears the device when the machine reports a lost transport itself", async () => {
    const connectionInputs: ConnectDeviceInput[] = [];
    mockedConnectDevice.mockImplementation(input => {
      connectionInputs.push(input);
      return new Observable<ConnectDeviceUIState>(subscriber => {
        subscriber.next({ type: ConnectDeviceUIStateTypes.Loading });
      });
    });

    const sessionStates = new Subject<DeviceSessionState>();
    const dmk = {
      getConnectedDevice: jest.fn(() => connectedDevice),
      getDeviceSessionState: jest.fn(() => sessionStates.asObservable()),
      sendCommand: jest.fn(() => new Promise(() => undefined)),
    } as unknown as DeviceManagementKit;

    const { result } = renderHook(() =>
      useDeviceOnboarding({ dmk, knownDevices: [], offerSync: false }),
    );

    act(() => result.current.connect());
    await act(async () => {
      connectionInputs[0].onConnected(connectionResult(dmk, "session-1"));
    });
    await waitFor(() => expect(result.current.device).not.toBeNull());

    act(() => result.current.send({ type: "TRANSPORT_LOST" }));

    expect(result.current.device).toBeNull();
    expect(result.current.status).toBe("running");
    expect(result.current.state).toBe("awaitingSession");
  });
});

function connectionResult(dmk: DeviceManagementKit, sessionId: string) {
  return {
    dmk,
    sessionId,
    connectedDevice,
    compatDeviceId: "compat-device-id",
    compatDeviceName: "Ledger Stax",
    compatDeviceWired: false,
  };
}
