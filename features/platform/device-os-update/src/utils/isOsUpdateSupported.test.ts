import { DeviceModelId } from "@ledgerhq/device-management-kit";
import {
  isBleUpdateSupported,
  isOsUpdateSupported,
  isUsbUpdateSupported,
} from "./isOsUpdateSupported";

describe("isUsbUpdateSupported", () => {
  it.each([
    [DeviceModelId.NANO_S, "1.6.0", false],
    [DeviceModelId.NANO_S, "1.6.1", true],
    [DeviceModelId.NANO_S, "2.0.0", true],
    [DeviceModelId.NANO_X, "1.2.9", false],
    [DeviceModelId.NANO_X, "1.3.0", true],
    [DeviceModelId.NANO_SP, "1.0.0", true],
    [DeviceModelId.NANO_SP, "0.9.9", false],
    [DeviceModelId.STAX, "1.0.0", true],
    [DeviceModelId.STAX, "1.8.0-lo1", true],
    [DeviceModelId.FLEX, "1.0.0", true],
    [DeviceModelId.APEX, "1.0.0", true],
    [DeviceModelId.NANO_X, "not-a-version", false],
  ])("%s %s -> %s", (modelId, version, expected) => {
    expect(isUsbUpdateSupported(modelId, version)).toBe(expected);
  });
});

describe("isBleUpdateSupported", () => {
  it.each([
    [DeviceModelId.NANO_X, "2.3.9", false],
    [DeviceModelId.NANO_X, "2.4.0", true],
    [DeviceModelId.NANO_X, "2.5.0-lo1", true],
    [DeviceModelId.NANO_S, "2.0.0", false],
    [DeviceModelId.NANO_SP, "2.0.0", false],
    [DeviceModelId.STAX, "1.0.0", true],
    [DeviceModelId.FLEX, "1.0.0", true],
    [DeviceModelId.APEX, "1.0.0", true],
    [DeviceModelId.NANO_X, "not-a-version", false],
  ])("%s %s -> %s", (modelId, version, expected) => {
    expect(isBleUpdateSupported(modelId, version)).toBe(expected);
  });
});

describe("isOsUpdateSupported", () => {
  it("uses the USB rules for wired devices", () => {
    expect(
      isOsUpdateSupported({ modelId: DeviceModelId.STAX, version: "1.0.0", wired: true }),
    ).toBe(true);
  });

  it("uses the BLE rules for wireless devices", () => {
    expect(
      isOsUpdateSupported({ modelId: DeviceModelId.NANO_SP, version: "1.0.0", wired: false }),
    ).toBe(false);
  });
});
