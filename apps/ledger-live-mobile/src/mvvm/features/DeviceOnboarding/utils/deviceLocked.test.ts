import { DeviceModelId } from "@ledgerhq/types-devices";
import { toDeviceUnlockSheetProps } from "./deviceLocked";

describe("toDeviceUnlockSheetProps", () => {
  it("should carry the model and the name of the device", () => {
    expect(
      toDeviceUnlockSheetProps({ modelId: DeviceModelId.stax, deviceName: "Ledger Stax" }),
    ).toEqual({ deviceModelId: DeviceModelId.stax, deviceName: "Ledger Stax" });
  });

  it("should use an empty name when the device has none", () => {
    expect(toDeviceUnlockSheetProps({ modelId: DeviceModelId.nanoX }).deviceName).toBe("");
  });
});
