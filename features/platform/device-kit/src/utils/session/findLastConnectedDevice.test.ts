// oxlint-disable typescript/consistent-type-assertions
import type { ConnectedDevice, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { findLastConnectedDevice } from "./findLastConnectedDevice";

const session = (sessionId: string, type: ConnectedDevice["type"]) =>
  ({ sessionId, type }) as ConnectedDevice;
const dmkWith = (listConnectedDevices: () => ConnectedDevice[]) =>
  ({ listConnectedDevices }) as unknown as DeviceManagementKit;

describe("findLastConnectedDevice", () => {
  it("finds the USB session of a wired device", () => {
    const dmk = dmkWith(() => [session("ble-1", "BLE"), session("usb-1", "USB")]);

    expect(findLastConnectedDevice(dmk, { wired: true })?.sessionId).toBe("usb-1");
  });

  it("finds the BLE session of a wireless device", () => {
    const dmk = dmkWith(() => [session("usb-1", "USB"), session("ble-1", "BLE")]);

    expect(findLastConnectedDevice(dmk, { wired: false })?.sessionId).toBe("ble-1");
  });

  it("takes the most recent session of the connection", () => {
    const dmk = dmkWith(() => [session("usb-1", "USB"), session("usb-2", "USB")]);

    expect(findLastConnectedDevice(dmk, { wired: true })?.sessionId).toBe("usb-2");
  });

  it("finds nothing without a session on the connection", () => {
    const dmk = dmkWith(() => [session("ble-1", "BLE")]);

    expect(findLastConnectedDevice(dmk, { wired: true })).toBeUndefined();
  });

  it("finds nothing when the DMK cannot list its sessions", () => {
    const dmk = dmkWith(() => {
      throw new Error("unexpected");
    });

    expect(findLastConnectedDevice(dmk, { wired: true })).toBeUndefined();
  });
});
