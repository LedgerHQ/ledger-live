import { getKeyRingDeviceInitialization, getKeyRingDeviceRequirement } from "./deviceRequirement";
import { KeyRingDeviceRequirementSchema } from "../schema";

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
    expect(getKeyRingDeviceInitialization()).toEqual({ appRequest: { appName: "Ledger Sync" } });
  });
});
