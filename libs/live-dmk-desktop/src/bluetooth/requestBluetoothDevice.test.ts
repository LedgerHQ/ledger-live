import {
  TransportNotSupportedError,
  type DeviceManagementKit,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { webBleIdentifier } from "@ledgerhq/device-transport-kit-web-ble";
import { EMPTY, of, throwError } from "rxjs";
import { requestBluetoothDevice } from "./requestBluetoothDevice";

const createDmk = (startDiscovering: jest.Mock): DeviceManagementKit =>
  ({ startDiscovering }) as unknown as DeviceManagementKit;

const device = { id: "ble-device", transport: webBleIdentifier } as DiscoveredDevice;

describe("requestBluetoothDevice", () => {
  it("GIVEN the user picks a device, WHEN requesting, THEN it resolves with it from the Web BLE transport", async () => {
    const startDiscovering = jest.fn().mockReturnValue(of(device));

    await expect(requestBluetoothDevice(createDmk(startDiscovering))).resolves.toBe(device);
    expect(startDiscovering).toHaveBeenCalledWith({ transport: webBleIdentifier });
  });

  it("GIVEN a DMK without the Bluetooth transport, WHEN requesting, THEN it rejects instead of throwing synchronously", async () => {
    const startDiscovering = jest.fn(() => {
      throw new TransportNotSupportedError(new Error("No transport"));
    });

    const request = requestBluetoothDevice(createDmk(startDiscovering));

    await expect(request).rejects.toThrow(Error);
    await expect(request).rejects.toMatchObject({
      cause: expect.any(TransportNotSupportedError),
    });
  });

  it("GIVEN the user cancels the chooser, WHEN requesting, THEN it rejects with the original error", async () => {
    const cancellation = new Error("User cancelled the requestDevice() chooser.");
    const startDiscovering = jest.fn().mockReturnValue(throwError(() => cancellation));

    await expect(requestBluetoothDevice(createDmk(startDiscovering))).rejects.toBe(cancellation);
  });

  it("GIVEN discovery ends without a device, WHEN requesting, THEN it rejects", async () => {
    const startDiscovering = jest.fn().mockReturnValue(EMPTY);

    await expect(requestBluetoothDevice(createDmk(startDiscovering))).rejects.toThrow(Error);
  });
});
