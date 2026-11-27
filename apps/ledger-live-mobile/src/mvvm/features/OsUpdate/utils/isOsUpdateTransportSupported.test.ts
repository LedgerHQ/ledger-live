import { DeviceModelId } from "@ledgerhq/types-devices";
import { isOsUpdateTransportSupported } from "./isOsUpdateTransportSupported";

describe("isOsUpdateTransportSupported", () => {
  it.each([
    ["Nano X on Bluetooth below 2.4.0", DeviceModelId.nanoX, false, "2.2.3", false],
    ["Nano X on Bluetooth from 2.4.0", DeviceModelId.nanoX, false, "2.4.0", true],
    ["Nano X on USB below 1.3.0", DeviceModelId.nanoX, true, "1.2.0", false],
    ["Nano X on USB from 1.3.0", DeviceModelId.nanoX, true, "1.3.0", true],
    ["Nano S on USB below 1.6.1", DeviceModelId.nanoS, true, "1.6.0", false],
    ["Nano S on USB from 1.6.1", DeviceModelId.nanoS, true, "1.6.1", true],
    ["Nano S Plus on USB", DeviceModelId.nanoSP, true, "1.0.0", true],
    ["Stax on USB", DeviceModelId.stax, true, "1.0.0", true],
    ["Stax on Bluetooth", DeviceModelId.stax, false, "1.0.0", true],
  ])("%s", (_label, modelId, wired, version, expected) => {
    expect(isOsUpdateTransportSupported({ modelId, wired }, version)).toBe(expected);
  });

  it("does not block the update when the OS version is unknown", () => {
    expect(
      isOsUpdateTransportSupported({ modelId: DeviceModelId.nanoX, wired: false }, undefined),
    ).toBe(true);
  });
});
