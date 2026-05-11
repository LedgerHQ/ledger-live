import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { firstValueFrom, of, throwError } from "rxjs";
import { DiscoveryErrors } from "../../types";
import { RnHidDeviceDiscoverySource } from "./RnHidDeviceDiscoverySource";

const createMockDMK = (listenToAvailableDevices: jest.Mock): DeviceManagementKit =>
  ({ listenToAvailableDevices }) as unknown as DeviceManagementKit;

const createDiscoveredDevice = (id: string): DiscoveredDevice =>
  ({
    id,
    name: id,
    deviceModel: { id: "model", model: "model", name: "model" },
    transport: rnHidTransportIdentifier,
  }) as unknown as DiscoveredDevice;

describe("RnHidDeviceDiscoverySource", () => {
  it("GIVEN HID discovery emits devices, WHEN listening, THEN it should emit discovered devices", async () => {
    // GIVEN
    const devices = [createDiscoveredDevice("hid-1")];
    const listenToAvailableDevices = jest.fn().mockReturnValue(of(devices));
    const source = new RnHidDeviceDiscoverySource(createMockDMK(listenToAvailableDevices));

    // WHEN
    const event = firstValueFrom(source.listen());

    // THEN
    await expect(event).resolves.toEqual({
      type: "devices",
      devices,
    });
    expect(listenToAvailableDevices).toHaveBeenCalledWith({ transport: rnHidTransportIdentifier });
  });

  it("GIVEN HID discovery fails, WHEN listening, THEN it should emit an unknown discovery error", async () => {
    // GIVEN
    const error = new Error("hid failure");
    const listenToAvailableDevices = jest.fn().mockReturnValue(throwError(() => error));
    const source = new RnHidDeviceDiscoverySource(createMockDMK(listenToAvailableDevices));

    // WHEN
    const event = firstValueFrom(source.listen());

    // THEN
    await expect(event).resolves.toEqual({
      type: "error",
      error: {
        type: DiscoveryErrors.Unknown,
        transportID: rnHidTransportIdentifier,
        error,
      },
    });
  });
});
