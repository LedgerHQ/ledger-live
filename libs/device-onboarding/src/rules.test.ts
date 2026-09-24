import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { isTouchscreen, minimumNanoVersions, requiresLegacyFlow } from "./rules";

describe("requiresLegacyFlow", () => {
  it.each([DeviceModelId.STAX, DeviceModelId.FLEX, DeviceModelId.APEX])(
    "drives %s whatever firmware it runs",
    deviceModelId => {
      expect(requiresLegacyFlow({ currentVersion: "0.0.1", deviceModelId })).toBe(false);
    },
  );

  it.each(["1.6.1", "2.1.0", "9.9.9"])("sends a nano s running %s to legacy", currentVersion => {
    expect(requiresLegacyFlow({ currentVersion, deviceModelId: DeviceModelId.NANO_S })).toBe(true);
  });

  it("holds no floor for the nano s, which no version gets past", () => {
    expect(minimumNanoVersions.has(DeviceModelId.NANO_S)).toBe(false);
  });

  it("sends a nano below its model floor to legacy", () => {
    expect(
      requiresLegacyFlow({ currentVersion: "1.9.0", deviceModelId: DeviceModelId.NANO_X }),
    ).toBe(true);
  });

  it("keeps a nano sitting exactly on its floor", () => {
    expect(
      requiresLegacyFlow({
        currentVersion: minimumNanoVersions.get(DeviceModelId.NANO_X) as string,
        deviceModelId: DeviceModelId.NANO_X,
      }),
    ).toBe(false);
  });

  it("keeps a nano above its floor", () => {
    expect(
      requiresLegacyFlow({ currentVersion: "2.4.0", deviceModelId: DeviceModelId.NANO_X }),
    ).toBe(false);
  });

  it("reads the floor of each nano rather than one shared version", () => {
    const version = "1.5.0";

    expect(
      requiresLegacyFlow({ currentVersion: version, deviceModelId: DeviceModelId.NANO_X }),
    ).toBe(true);
    expect(
      requiresLegacyFlow({ currentVersion: version, deviceModelId: DeviceModelId.NANO_SP }),
    ).toBe(false);
  });

  it("coerces the suffixed versions the devices actually report", () => {
    expect(
      requiresLegacyFlow({
        currentVersion: "2.4.0-il2",
        deviceModelId: DeviceModelId.NANO_X,
      }),
    ).toBe(false);
  });

  it("sends a nano to legacy when its version means nothing", () => {
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
