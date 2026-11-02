import type { ConnectedDevice, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { activeDeviceSessionSubject as activeBleDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { activeDeviceSessionSubject as activeHidDeviceSessionSubject } from "../transport/DeviceManagementKitHIDTransport";
import { getActiveConnectedDevice } from "./getActiveConnectedDevice";

const flex = { sessionId: "flex-session" } as ConnectedDevice;
const nanoX = { sessionId: "nano-x-session" } as ConnectedDevice;

const createDmk = (devices: ConnectedDevice[]) =>
  ({
    getConnectedDevice: jest.fn(({ sessionId }: { sessionId: string }) => {
      const device = devices.find(d => d.sessionId === sessionId);
      if (!device) throw new Error("session not found");
      return device;
    }),
  }) as unknown as DeviceManagementKit;

const setActiveBleSession = (sessionId: string | null) =>
  activeBleDeviceSessionSubject.next(
    sessionId
      ? ({ sessionId, transport: {} } as NonNullable<typeof activeBleDeviceSessionSubject.value>)
      : null,
  );

const setActiveHidSession = (sessionId: string | null) =>
  activeHidDeviceSessionSubject.next(
    sessionId
      ? ({ transport: { sessionId } } as NonNullable<typeof activeHidDeviceSessionSubject.value>)
      : null,
  );

describe("getActiveConnectedDevice", () => {
  beforeEach(() => {
    setActiveBleSession(null);
    setActiveHidSession(null);
  });

  it("returns the device of the active BLE session, even if another one was connected before", () => {
    setActiveBleSession(nanoX.sessionId);
    const dmk = createDmk([flex, nanoX]);

    expect(getActiveConnectedDevice(dmk, { wired: false })).toBe(nanoX);
  });

  it("returns the device of the active USB session", () => {
    setActiveHidSession(flex.sessionId);
    setActiveBleSession(nanoX.sessionId);
    const dmk = createDmk([flex, nanoX]);

    expect(getActiveConnectedDevice(dmk, { wired: true })).toBe(flex);
  });

  it("returns undefined when there is no active session for the connection type", () => {
    setActiveBleSession(nanoX.sessionId);

    expect(getActiveConnectedDevice(createDmk([nanoX]), { wired: true })).toBeUndefined();
  });

  it("returns undefined when the active session is no longer connected", () => {
    setActiveBleSession("gone");

    expect(getActiveConnectedDevice(createDmk([nanoX]), { wired: false })).toBeUndefined();
  });
});
