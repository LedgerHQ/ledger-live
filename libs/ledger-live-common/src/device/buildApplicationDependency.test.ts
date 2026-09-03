import { DeviceModelId } from "@ledgerhq/device-management-kit";
import semver from "semver";
import { buildApplicationDependency, type GetMinVersion } from "./buildApplicationDependency";

function minVersionFor(appName: string, getMinVersion: GetMinVersion): string | undefined {
  const { constraints } = buildApplicationDependency(appName, getMinVersion);
  return constraints?.[0]?.minVersion;
}

const always =
  (minVersion: string | undefined): GetMinVersion =>
  () =>
    minVersion;

const onlyFor =
  (model: DeviceModelId, minVersion: string): GetMinVersion =>
  (_appName, candidate) =>
    candidate === model ? minVersion : undefined;

describe("buildApplicationDependency", () => {
  it("names the application it was asked for", () => {
    expect(buildApplicationDependency("Ethereum", always("1.23.0")).name).toBe("Ethereum");
  });

  it("emits one constraint per device model that has a floor", () => {
    const { constraints } = buildApplicationDependency(
      "Ethereum",
      onlyFor(DeviceModelId.NANO_X, "1.23.0"),
    );

    expect(constraints).toEqual([
      { minVersion: "1.23.0-0", applicableModels: [DeviceModelId.NANO_X] },
    ]);
  });

  it("emits no constraint when no model has a floor", () => {
    expect(buildApplicationDependency("Ethereum", always(undefined)).constraints).toEqual([]);
  });

  it("skips a floor that is not a usable version constraint", () => {
    expect(buildApplicationDependency("Ethereum", always("not-a-version")).constraints).toEqual([]);
  });

  describe("prerelease tolerance", () => {
    it("widens a release floor so it ranks below any prerelease of the same version", () => {
      expect(minVersionFor("Ethereum", always("1.23.0"))).toBe("1.23.0-0");
    });

    it("leaves a floor that already names a prerelease untouched", () => {
      expect(minVersionFor("Ethereum", always("1.23.0-rc2"))).toBe("1.23.0-rc2");
    });

    it("leaves the latest constraint untouched, since the kit resolves it by catalog", () => {
      expect(minVersionFor("Ethereum", always("latest"))).toBe("latest");
    });

    it("drops build metadata rather than appending after it", () => {
      expect(minVersionFor("Ethereum", always("1.23.0+build7"))).toBe("1.23.0-0");
    });

    it.each([
      ["a prerelease build of the required version", "1.23.0-dev", true],
      ["the plain release of the required version", "1.23.0", true],
      ["a later release", "1.24.0", true],
      ["a prerelease build of an older version", "1.22.9-dev", false],
      ["an older release", "1.22.0", false],
    ])("accepts %s: %s -> %s", (_label, deviceVersion, expected) => {
      const floor = minVersionFor("Ethereum", always("1.23.0"))!;

      expect(semver.gte(deviceVersion, floor)).toBe(expected);
    });

    it("keeps a prerelease floor discriminating between its own prereleases", () => {
      const floor = minVersionFor("Ethereum", always("1.23.0-rc2"))!;

      expect(semver.gte("1.23.0-rc1", floor)).toBe(false);
      expect(semver.gte("1.23.0-rc2", floor)).toBe(true);
    });
  });
});
