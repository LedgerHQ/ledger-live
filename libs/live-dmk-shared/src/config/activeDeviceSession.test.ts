import {
  type ConnectedDevice,
  type DeviceManagementKit,
  type DeviceSessionState,
  DeviceStatus,
} from "@ledgerhq/device-management-kit";
import { Subject } from "rxjs";

import { ActiveDeviceSessionRegistry } from "./activeDeviceSession";

const makeDmk = () => {
  const sessionState = new Subject<DeviceSessionState>();
  const dmk = {
    getDeviceSessionState: jest.fn(() => sessionState.asObservable()),
    getConnectedDevice: jest.fn(),
  } as unknown as jest.Mocked<DeviceManagementKit>;

  return { dmk, sessionState };
};

describe("ActiveDeviceSessionRegistry", () => {
  let registry: ActiveDeviceSessionRegistry;

  beforeEach(() => {
    registry = new ActiveDeviceSessionRegistry();
  });

  afterEach(() => {
    registry.dispose();
    jest.clearAllMocks();
  });

  it("adds a session and subscribes to its session state", () => {
    const { dmk } = makeDmk();

    registry.addSession({ sessionId: "session-1", dmk });

    expect(registry.getSession("session-1")).toEqual({ sessionId: "session-1", dmk });
    expect(dmk.getDeviceSessionState).toHaveBeenCalledWith({ sessionId: "session-1" });
  });

  it("removes a session when it becomes disconnected", () => {
    const { dmk, sessionState } = makeDmk();
    registry.addSession({ sessionId: "session-1", dmk });

    sessionState.next({ deviceStatus: DeviceStatus.NOT_CONNECTED } as DeviceSessionState);

    expect(registry.getSession("session-1")).toBeNull();
  });

  it("unsubscribes when removing a session", () => {
    const { dmk, sessionState } = makeDmk();
    registry.addSession({ sessionId: "session-1", dmk });

    registry.removeSession("session-1");

    expect(registry.getSession("session-1")).toBeNull();
    expect(sessionState.observed).toBe(false);
  });

  it("disposes all sessions", () => {
    const first = makeDmk();
    const second = makeDmk();
    registry.addSession({ sessionId: "session-1", dmk: first.dmk });
    registry.addSession({ sessionId: "session-2", dmk: second.dmk });

    registry.dispose();

    expect(registry.getSessions()).toEqual([]);
    expect(first.sessionState.observed).toBe(false);
    expect(second.sessionState.observed).toBe(false);
  });

  it("supports multiple simultaneous sessions", () => {
    const first = makeDmk();
    const second = makeDmk();

    registry.addSession({ sessionId: "session-1", dmk: first.dmk });
    registry.addSession({ sessionId: "session-2", dmk: second.dmk });

    expect(registry.getSessions()).toEqual([
      { sessionId: "session-1", dmk: first.dmk },
      { sessionId: "session-2", dmk: second.dmk },
    ]);
  });

  it("finds a matching session from connected device metadata", () => {
    const { dmk } = makeDmk();
    jest.mocked(dmk.getConnectedDevice).mockReturnValue({
      id: "device-1",
      type: "BLE",
    } as ConnectedDevice);
    registry.addSession({ sessionId: "session-1", dmk });

    const session = registry.findSession(
      (_, connectedDevice) => connectedDevice.type === "BLE" && connectedDevice.id === "device-1",
    );

    expect(session).toEqual({ sessionId: "session-1", dmk });
  });

  it("cleans invalid sessions during lookup", () => {
    const { dmk } = makeDmk();
    jest.mocked(dmk.getConnectedDevice).mockImplementation(() => {
      throw new Error("stale session");
    });
    registry.addSession({ sessionId: "session-1", dmk });

    const session = registry.findSession(() => true);

    expect(session).toBeNull();
    expect(registry.getSession("session-1")).toBeNull();
  });
});
