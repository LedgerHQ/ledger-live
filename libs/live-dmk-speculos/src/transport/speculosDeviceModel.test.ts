import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { getSpeculosDeviceModel } from "./speculosDeviceModel";

describe("getSpeculosDeviceModel", () => {
  it.each([
    ["nanoS", DeviceModelId.NANO_S],
    ["nanoSP", DeviceModelId.NANO_SP],
    ["nanoX", DeviceModelId.NANO_X],
    ["stax", DeviceModelId.STAX],
    ["flex", DeviceModelId.FLEX],
    ["nanoGen5", DeviceModelId.APEX],
  ])("maps %s to the DMK model", (speculosDevice, model) => {
    expect(getSpeculosDeviceModel(speculosDevice)).toBe(model);
  });

  it.each([undefined, "", "nanos", "constructor"])("returns undefined for %p", speculosDevice => {
    expect(getSpeculosDeviceModel(speculosDevice)).toBeUndefined();
  });
});
