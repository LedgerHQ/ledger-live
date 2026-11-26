import {
  DeviceModelId as DMKDeviceModelId,
  type ConnectedDevice,
  type DeviceManagementKit,
  type DiscoveredDevice,
  type TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import { listen, type Log } from "@ledgerhq/logs";

import { disconnectOtherSessions } from "./disconnectOtherSessions";
import type { IsMatchingConnectedDevice } from "./types";

const bleTransport = "RN_BLE" as TransportIdentifier;
const usbTransport = "RN_HID" as TransportIdentifier;

const makeDiscoveredDevice = (overrides: Partial<DiscoveredDevice> = {}): DiscoveredDevice =>
  ({
    id: "1002",
    name: "Ledger Nano X",
    deviceModel: { id: "nanoX", model: DMKDeviceModelId.NANO_X, name: "Ledger Nano X" },
    transport: usbTransport,
    ...overrides,
  }) as DiscoveredDevice;

const makeConnectedDevice = (overrides: Partial<ConnectedDevice> = {}): ConnectedDevice =>
  ({
    id: "usb_1002",
    sessionId: "usb-session",
    modelId: DMKDeviceModelId.NANO_X,
    name: "Ledger Nano X",
    type: "USB",
    transport: usbTransport,
    ...overrides,
  }) as ConnectedDevice;

const createDmk = (
  openSessions: Array<ConnectedDevice>,
  disconnect = jest.fn().mockResolvedValue(undefined),
) =>
  ({
    listConnectedDevices: jest.fn(() => openSessions),
    disconnect,
  }) as unknown as DeviceManagementKit;

describe("disconnectOtherSessions", () => {
  it("should keep open sessions matching by id and transport by default and disconnect others", () => {
    const deviceToConnect = makeDiscoveredDevice({ id: "nano-x-ble", transport: bleTransport });
    const dmk = createDmk([
      makeConnectedDevice({ id: "nano-x-ble", transport: bleTransport, sessionId: "same-session" }),
      makeConnectedDevice({
        id: "nano-x-ble",
        transport: usbTransport,
        sessionId: "other-transport-session",
      }),
      makeConnectedDevice({
        id: "stax-ble",
        transport: bleTransport,
        sessionId: "other-id-session",
      }),
    ]);

    disconnectOtherSessions(dmk, deviceToConnect);

    expect(jest.mocked(dmk.disconnect).mock.calls).toEqual([
      [{ sessionId: "other-transport-session" }],
      [{ sessionId: "other-id-session" }],
    ]);
  });

  it("should use the injected isMatchingConnectedDevice predicate to keep matching sessions open", () => {
    const deviceToConnect = makeDiscoveredDevice({
      id: "1002",
      transport: usbTransport,
      deviceModel: { id: "nanoX", model: DMKDeviceModelId.NANO_X, name: "Ledger Nano X" },
    });
    const dmk = createDmk([
      makeConnectedDevice({
        id: "usb_1002",
        transport: usbTransport,
        modelId: DMKDeviceModelId.NANO_X,
        sessionId: "nano-x-usb-session",
      }),
      makeConnectedDevice({
        id: "usb_1003",
        transport: usbTransport,
        modelId: DMKDeviceModelId.STAX,
        sessionId: "stax-usb-session",
      }),
      makeConnectedDevice({
        id: "ble-id",
        transport: bleTransport,
        modelId: DMKDeviceModelId.NANO_X,
        sessionId: "nano-x-ble-session",
      }),
    ]);
    const matchByModelOnUsb: IsMatchingConnectedDevice = (connected, discovered) =>
      connected.transport === discovered.transport &&
      connected.modelId === discovered.deviceModel.model;

    disconnectOtherSessions(dmk, deviceToConnect, matchByModelOnUsb);

    expect(jest.mocked(dmk.disconnect).mock.calls).toEqual([
      [{ sessionId: "stax-usb-session" }],
      [{ sessionId: "nano-x-ble-session" }],
    ]);
  });

  it("should log a failure when disconnecting another session rejects", async () => {
    const logs: Array<Log> = [];
    const unsubscribe = listen(entry => logs.push(entry));
    const disconnectError = new Error("disconnect failed");
    const dmk = createDmk(
      [makeConnectedDevice({ id: "other", sessionId: "other-session" })],
      jest.fn().mockRejectedValue(disconnectError),
    );

    disconnectOtherSessions(dmk, makeDiscoveredDevice({ id: "1002" }));
    await Promise.resolve();
    unsubscribe();

    expect(logs).toContainEqual(
      expect.objectContaining({
        type: "disconnectOtherSessions",
        message: "failed to disconnect a session before a connection",
        data: { sessionId: "other-session", error: disconnectError },
      }),
    );
  });
});
