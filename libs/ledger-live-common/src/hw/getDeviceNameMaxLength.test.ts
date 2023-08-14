import { DeviceModelId } from "@ledgerhq/devices";
import getDeviceNameMaxLength from "./getDeviceNameMaxLength";

describe("getDeviceNameMaxLength", () => {
  test("LNX 2.1.0 and lower should max at 17", async () => {
    expect(
      getDeviceNameMaxLength({
        deviceModelId: DeviceModelId.nanoX,
        version: "2.1.0",
      }),
    ).toBe(17);
    expect(
      getDeviceNameMaxLength({
        deviceModelId: DeviceModelId.nanoX,
        version: "2.0.0",
      }),
    ).toBe(17);
    expect(
      getDeviceNameMaxLength({
        deviceModelId: DeviceModelId.nanoX,
        version: "1.5.5",
      }),
    ).toBe(17);
  });
  test("LNX 2.2.0 and higher should max at 20", async () => {
    expect(
      getDeviceNameMaxLength({
        deviceModelId: DeviceModelId.nanoX,
        version: "2.2.0",
      }),
    ).toBe(20);
    expect(
      getDeviceNameMaxLength({
        deviceModelId: DeviceModelId.nanoX,
        version: "2.3.0",
      }),
    ).toBe(20);
    expect(
      getDeviceNameMaxLength({
        deviceModelId: DeviceModelId.nanoX,
        version: "4.2.0",
      }),
    ).toBe(20);
  });
  test("Stax of any version should max at 20", async () => {
    expect(
      getDeviceNameMaxLength({
        deviceModelId: DeviceModelId.stax,
        version: "0.0.1",
      }),
    ).toBe(20);
    expect(
      getDeviceNameMaxLength({
        deviceModelId: DeviceModelId.stax,
        version: "1.2.3",
      }),
    ).toBe(20);
    expect(
      getDeviceNameMaxLength({
        deviceModelId: DeviceModelId.stax,
        version: "3.4.5",
      }),
    ).toBe(20);
  });
  test("Other models should just return 17 as a fallback", async () => {
    expect(
      getDeviceNameMaxLength({
        deviceModelId: DeviceModelId.blue,
        version: "3.4.5",
      }),
    ).toBe(17);
    expect(
      getDeviceNameMaxLength({
        deviceModelId: DeviceModelId.nanoSP,
        version: "3.4.5",
      }),
    ).toBe(17);
    expect(
      getDeviceNameMaxLength({
        deviceModelId: DeviceModelId.nanoS,
        version: "3.4.5",
      }),
    ).toBe(17);
  });
});
