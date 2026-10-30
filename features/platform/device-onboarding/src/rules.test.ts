import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { firmwareSettled, isTouchscreen, requiresLegacyFlow } from "./rules";
import type { AvailableFirmwareUpdate } from "./types";

describe("requiresLegacyFlow", () => {
  it.each([
    DeviceModelId.STAX,
    DeviceModelId.FLEX,
    DeviceModelId.APEX,
    DeviceModelId.NANO_S,
    DeviceModelId.NANO_SP,
    DeviceModelId.NANO_X,
  ])("drives %s on an old firmware", deviceModelId => {
    expect(requiresLegacyFlow({ currentVersion: "0.9.0", deviceModelId })).toBe(false);
  });

  it("coerces the suffixed versions the devices actually report", () => {
    expect(
      requiresLegacyFlow({
        currentVersion: "2.4.0-il2",
        deviceModelId: DeviceModelId.NANO_X,
      }),
    ).toBe(false);
  });

  it("sends a device to legacy when its version means nothing", () => {
    expect(requiresLegacyFlow({ currentVersion: "", deviceModelId: DeviceModelId.NANO_X })).toBe(
      true,
    );
  });
});

describe("isTouchscreen", () => {
  it.each([DeviceModelId.STAX, DeviceModelId.FLEX, DeviceModelId.APEX])("accepts %s", model => {
    expect(isTouchscreen(model)).toBe(true);
  });

  it.each([DeviceModelId.NANO_S, DeviceModelId.NANO_SP, DeviceModelId.NANO_X])(
    "refuses %s",
    model => {
      expect(isTouchscreen(model)).toBe(false);
    },
  );

  it("reads DMK's own model names, where the Flex is `flex` and the Apex `apexp`", () => {
    expect(DeviceModelId.FLEX).toBe("flex");
    expect(DeviceModelId.APEX).toBe("apexp");
  });
});

describe("firmwareSettled", () => {
  it.each(["upToDate", "declined", "skipped"] as const)("treats %s as finished", kind => {
    expect(firmwareSettled({ kind })).toBe(true);
  });

  it("leaves an offer and a missing check unfinished", () => {
    expect(firmwareSettled(null)).toBe(false);
    expect(
      firmwareSettled({
        kind: "offered",
        update: { finalFirmware: { version: "2.3.0" } } as AvailableFirmwareUpdate,
      }),
    ).toBe(false);
  });
});
