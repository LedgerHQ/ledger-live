import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
import { firstValueFrom, of } from "rxjs";
import { MockServerDeviceDiscoverySource } from "./MockServerDeviceDiscoverySource";

const createMockDMK = (listenToAvailableDevices: jest.Mock): DeviceManagementKit =>
  ({ listenToAvailableDevices }) as unknown as DeviceManagementKit;

describe("MockServerDeviceDiscoverySource", () => {
  it("listens for devices on the mock server transport", async () => {
    const devices = [{ id: "mock-1", transport: mockserverIdentifier }] as DiscoveredDevice[];
    const listenToAvailableDevices = jest.fn().mockReturnValue(of(devices));
    const source = new MockServerDeviceDiscoverySource(createMockDMK(listenToAvailableDevices));

    await expect(firstValueFrom(source.listen())).resolves.toEqual({
      type: "devices",
      devices,
    });
    expect(listenToAvailableDevices).toHaveBeenCalledWith({ transport: mockserverIdentifier });
  });
});
