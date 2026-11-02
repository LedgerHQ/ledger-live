import { DeviceModelId } from "@ledgerhq/devices";
import {
  isBleUpdateSupported,
  isOsUpdateSupported,
  isUsbUpdateSupported,
} from "./isOsUpdateSupported";

describe("isUsbUpdateSupported", () => {
  it.each([
    [DeviceModelId.nanoS, "1.6.0", false],
    [DeviceModelId.nanoS, "1.6.1", true],
    [DeviceModelId.nanoS, "2.0.0", true],
    [DeviceModelId.nanoX, "1.2.9", false],
    [DeviceModelId.nanoX, "1.3.0", true],
    [DeviceModelId.nanoSP, "1.0.0", true],
    [DeviceModelId.nanoSP, "0.9.9", false],
    [DeviceModelId.stax, "1.0.0", true],
    [DeviceModelId.stax, "1.8.0-lo1", true],
    [DeviceModelId.europa, "1.0.0", true],
    [DeviceModelId.apex, "1.0.0", true],
    [DeviceModelId.nanoX, "not-a-version", false],
  ])("%s %s -> %s", (modelId, version, expected) => {
    expect(isUsbUpdateSupported(modelId, version)).toBe(expected);
  });
});

describe("isBleUpdateSupported", () => {
  it.each([
    [DeviceModelId.nanoX, "2.3.9", false],
    [DeviceModelId.nanoX, "2.4.0", true],
    [DeviceModelId.nanoX, "2.5.0-lo1", true],
    [DeviceModelId.nanoS, "2.0.0", false],
    [DeviceModelId.nanoSP, "2.0.0", false],
    [DeviceModelId.stax, "1.0.0", true],
    [DeviceModelId.europa, "1.0.0", true],
    [DeviceModelId.apex, "1.0.0", true],
    [DeviceModelId.nanoX, "not-a-version", false],
  ])("%s %s -> %s", (modelId, version, expected) => {
    expect(isBleUpdateSupported(modelId, version)).toBe(expected);
  });
});

describe("isOsUpdateSupported", () => {
  it("uses the USB rules for wired devices", () => {
    expect(
      isOsUpdateSupported({ modelId: DeviceModelId.stax, version: "1.0.0", wired: true }),
    ).toBe(true);
  });

  it("uses the BLE rules for wireless devices", () => {
    expect(
      isOsUpdateSupported({ modelId: DeviceModelId.nanoSP, version: "1.0.0", wired: false }),
    ).toBe(false);
  });
});
