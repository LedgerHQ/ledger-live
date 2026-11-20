import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { isRebootedDevice } from "./rebootedDevice";

const device: Device = {
  deviceId: "device-id",
  deviceName: "Ledger Stax",
  modelId: DeviceModelId.stax,
  wired: false,
};

describe("isRebootedDevice", () => {
  it("should recognise the same touchscreen after its BLE address and advertised name change", () => {
    const before = { ...device, deviceName: "Ledger Stax 1A2B" };
    const after = { ...device, deviceId: "new-ble-address", deviceName: "1A2B" };

    expect(isRebootedDevice(before, after)).toBe(true);
  });

  it("should reject a different model", () => {
    expect(
      isRebootedDevice(device, { ...device, modelId: DeviceModelId.nanoX, deviceName: "Nano X" }),
    ).toBe(false);
  });
});
