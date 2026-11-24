import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { requiresLegacyFlow, updateWaitsForSeed } from "./firmwareRules";

const { NANO_S, NANO_SP, NANO_X, STAX, FLEX, APEX } = DeviceModelId;

describe("requiresLegacyFlow", () => {
  it.each([STAX, FLEX, APEX])("drives %s on an old firmware", deviceModelId => {
    expect(requiresLegacyFlow({ currentVersion: "0.9.0", deviceModelId, isOnboarded: false })).toBe(
      false,
    );
  });

  it.each([true, false])("sends every nano s to legacy, seeded: %s", isOnboarded => {
    expect(
      requiresLegacyFlow({ currentVersion: "1.6.1", deviceModelId: NANO_S, isOnboarded }),
    ).toBe(true);
  });

  it.each([
    [NANO_X, "2.1.9", true],
    [NANO_X, "2.2.0", false],
    [NANO_X, "2.2.1", false],
    [NANO_SP, "1.0.9", true],
    [NANO_SP, "1.1.0", false],
    [NANO_SP, "1.1.1", false],
  ])("sends an unseeded %s on %s to legacy: %s", (deviceModelId, currentVersion, expected) => {
    expect(requiresLegacyFlow({ currentVersion, deviceModelId, isOnboarded: false })).toBe(
      expected,
    );
  });

  it.each([NANO_X, NANO_SP])("drives a seeded %s on an old firmware", deviceModelId => {
    expect(requiresLegacyFlow({ currentVersion: "0.9.0", deviceModelId, isOnboarded: true })).toBe(
      false,
    );
  });

  it("coerces the suffixed versions the devices actually report", () => {
    expect(
      requiresLegacyFlow({
        currentVersion: "2.4.0-il2",
        deviceModelId: NANO_X,
        isOnboarded: false,
      }),
    ).toBe(false);
  });

  it("sends a device to legacy when its version means nothing", () => {
    expect(
      requiresLegacyFlow({ currentVersion: "", deviceModelId: NANO_X, isOnboarded: true }),
    ).toBe(true);
  });
});

describe("updateWaitsForSeed", () => {
  it.each([
    [NANO_X, "2.1.9", false],
    [NANO_X, "2.2.0", true],
    [NANO_X, "2.2.1", true],
    [NANO_X, "2.6.9", true],
    [NANO_X, "2.7.0", true],
    [NANO_X, "2.7.1", false],
    [NANO_SP, "1.0.9", false],
    [NANO_SP, "1.1.0", true],
    [NANO_SP, "1.1.1", true],
    [NANO_SP, "1.5.9", true],
    [NANO_SP, "1.6.0", true],
    [NANO_SP, "1.6.1", false],
  ])(
    "holds the update of an unseeded %s on %s back: %s",
    (deviceModelId, currentVersion, expected) => {
      expect(updateWaitsForSeed({ currentVersion, deviceModelId, isOnboarded: false })).toBe(
        expected,
      );
    },
  );

  it("coerces a suffixed version", () => {
    expect(
      updateWaitsForSeed({
        currentVersion: "2.3.0-il2",
        deviceModelId: NANO_X,
        isOnboarded: false,
      }),
    ).toBe(true);
  });

  it.each([NANO_X, NANO_SP])("never holds the update of a seeded %s back", deviceModelId => {
    expect(updateWaitsForSeed({ currentVersion: "1.3.0", deviceModelId, isOnboarded: true })).toBe(
      false,
    );
  });

  it.each([NANO_S, STAX, FLEX, APEX])("never holds the update of %s back", deviceModelId => {
    expect(updateWaitsForSeed({ currentVersion: "1.3.0", deviceModelId, isOnboarded: false })).toBe(
      false,
    );
  });
});
