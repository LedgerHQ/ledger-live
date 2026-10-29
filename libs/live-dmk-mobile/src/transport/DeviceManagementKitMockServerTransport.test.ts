import { of } from "rxjs";
import {
  type ConnectedDevice,
  type DeviceManagementKit,
  DeviceModelId as DMKDeviceModelId,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import { DeviceManagementKitMockServerTransport } from "./DeviceManagementKitMockServerTransport";

const makeDiscoveredDevice = (id: string): DiscoveredDevice => ({
  id,
  name: "Ledger Stax",
  deviceModel: { id: DMKDeviceModelId.STAX, model: DMKDeviceModelId.STAX, name: "Ledger Stax" },
  transport: mockserverIdentifier,
});

const makeDmk = ({
  connectedDevices = [],
  availableDevices = [],
}: {
  connectedDevices?: Partial<ConnectedDevice>[];
  availableDevices?: DiscoveredDevice[];
}) =>
  ({
    listConnectedDevices: jest.fn(() => connectedDevices),
    listenToAvailableDevices: jest.fn(() => of(availableDevices)),
    connect: jest.fn().mockResolvedValue("new-session"),
  }) as unknown as DeviceManagementKit;

describe("DeviceManagementKitMockServerTransport", () => {
  it("reuses the session already connected to the mock device", async () => {
    const dmk = makeDmk({
      connectedDevices: [
        { id: "device-1", transport: "RN_BLE", sessionId: "ble-session" },
        { id: "device-1", transport: mockserverIdentifier, sessionId: "mock-session" },
      ],
    });

    const transport = await DeviceManagementKitMockServerTransport.open(
      "mockserver|device-1",
      undefined,
      dmk,
    );

    expect(transport).toBeInstanceOf(DmkCompatTransport);
    expect(transport.sessionId).toBe("mock-session");
    expect(dmk.connect).not.toHaveBeenCalled();
  });

  it("connects to the mock device with the matching id when no session exists", async () => {
    const targetDevice = makeDiscoveredDevice("device-2");
    const dmk = makeDmk({ availableDevices: [makeDiscoveredDevice("device-1"), targetDevice] });

    const transport = await DeviceManagementKitMockServerTransport.open(
      "mockserver|device-2",
      1000,
      dmk,
    );

    expect(dmk.listenToAvailableDevices).toHaveBeenCalledWith({ transport: mockserverIdentifier });
    expect(dmk.connect).toHaveBeenCalledWith({
      device: targetDevice,
      sessionRefresherOptions: { isRefresherDisabled: true },
    });
    expect(transport.sessionId).toBe("new-session");
  });
});
