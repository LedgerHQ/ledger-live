import { getKeyRingDeviceInitialization, getKeyRingDeviceRequirement } from "./deviceRequirement";
import { KeyRingDeviceRequirementSchema } from "../schema";
import { initializationOf } from "../internals/deviceInitialization";

describe("getKeyRingDeviceRequirement", () => {
  it("asks for the Ledger Sync app on v1", () => {
    const requirement = getKeyRingDeviceRequirement();
    expect(KeyRingDeviceRequirementSchema.parse(requirement)).toEqual({
      kind: "app",
      appName: "Ledger Sync",
    });
  });
});

describe("getKeyRingDeviceInitialization", () => {
  it("asks DIE to open the Ledger Sync app", () => {
    expect(getKeyRingDeviceInitialization()).toEqual({
      kind: "app",
      appRequest: { appName: "Ledger Sync" },
    });
  });

  it("returns an OS feature requirement as data instead of throwing", () => {
    expect(
      initializationOf({ kind: "os-feature", feature: "lkrp", minimumOsVersion: "2.0.0" }),
    ).toEqual({ kind: "os-feature", feature: "lkrp", minimumOsVersion: "2.0.0" });
  });
});
