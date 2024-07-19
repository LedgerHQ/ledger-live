import { DeviceModelId } from "@ledgerhq/devices";
import { shouldForceFirmwareUpdate } from "./shouldForceFirmwareUpdate";

describe("shouldForceFirmwareUpdate", () => {
  it("should force firmware update for stax <=1.3.0 and not other versions", () => {
    expect(
      shouldForceFirmwareUpdate({ currentVersion: "1.2.0", deviceModelId: DeviceModelId.stax }),
    ).toBe(true);

    expect(
      shouldForceFirmwareUpdate({
        currentVersion: "1.2.0-whatever",
        deviceModelId: DeviceModelId.stax,
      }),
    ).toBe(true);

    expect(
      shouldForceFirmwareUpdate({ currentVersion: "1.3.0", deviceModelId: DeviceModelId.stax }),
    ).toBe(true);

    expect(
      shouldForceFirmwareUpdate({
        currentVersion: "1.3.0-whatever",
        deviceModelId: DeviceModelId.stax,
      }),
    ).toBe(true);

    expect(
      shouldForceFirmwareUpdate({ currentVersion: "1.3.1", deviceModelId: DeviceModelId.stax }),
    ).toBe(false);

    expect(
      shouldForceFirmwareUpdate({
        currentVersion: "1.3.1-whatever",
        deviceModelId: DeviceModelId.stax,
      }),
    ).toBe(false);
  });

  it("should force firmware update for europa <1.1.1 and not other versions", () => {
    expect(
      shouldForceFirmwareUpdate({ currentVersion: "1.0.0", deviceModelId: DeviceModelId.europa }),
    ).toBe(true);

    expect(
      shouldForceFirmwareUpdate({
        currentVersion: "1.0.0-whatever",
        deviceModelId: DeviceModelId.europa,
      }),
    ).toBe(true);

    expect(
      shouldForceFirmwareUpdate({ currentVersion: "1.1.0", deviceModelId: DeviceModelId.europa }),
    ).toBe(true);

    expect(
      shouldForceFirmwareUpdate({
        currentVersion: "1.1.0-whatever",
        deviceModelId: DeviceModelId.europa,
      }),
    ).toBe(true);

    expect(
      shouldForceFirmwareUpdate({ currentVersion: "1.1.1", deviceModelId: DeviceModelId.europa }),
    ).toBe(false);

    expect(
      shouldForceFirmwareUpdate({
        currentVersion: "1.1.1-whatever",
        deviceModelId: DeviceModelId.europa,
      }),
    ).toBe(false);

    expect(
      shouldForceFirmwareUpdate({ currentVersion: "1.2.0", deviceModelId: DeviceModelId.europa }),
    ).toBe(false);

    expect(
      shouldForceFirmwareUpdate({
        currentVersion: "1.2.0-whatever",
        deviceModelId: DeviceModelId.europa,
      }),
    ).toBe(false);
  });

  it("should not force firmware update for other models", () => {
    expect(
      shouldForceFirmwareUpdate({ currentVersion: "1.2.0", deviceModelId: DeviceModelId.nanoX }),
    ).toBe(false);

    expect(
      shouldForceFirmwareUpdate({
        currentVersion: "1.2.0-whatever",
        deviceModelId: DeviceModelId.nanoX,
      }),
    ).toBe(false);

    expect(
      shouldForceFirmwareUpdate({ currentVersion: "1.3.0", deviceModelId: DeviceModelId.nanoX }),
    ).toBe(false);

    expect(
      shouldForceFirmwareUpdate({
        currentVersion: "1.3.0-whatever",
        deviceModelId: DeviceModelId.nanoX,
      }),
    ).toBe(false);

    expect(
      shouldForceFirmwareUpdate({ currentVersion: "1.3.1", deviceModelId: DeviceModelId.nanoX }),
    ).toBe(false);

    expect(
      shouldForceFirmwareUpdate({
        currentVersion: "1.3.1-whatever",
        deviceModelId: DeviceModelId.nanoX,
      }),
    ).toBe(false);
  });
});
