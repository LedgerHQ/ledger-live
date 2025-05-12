import { DeviceModelId } from "@ledgerhq/types-devices";
import { isLedgerRecoveryKeyCompatible } from "./recoveryKey";

describe("isLedgerRecoveryKeyCompatible", () => {
  it("should return true for Stax with SE version 1.7.0", () => {
    // WHEN
    const result = isLedgerRecoveryKeyCompatible(DeviceModelId.stax, "1.7.0");

    // THEN
    expect(result).toBe(true);
  });

  it("should return true for Europa with SE version 1.3.0", () => {
    // WHEN
    const result = isLedgerRecoveryKeyCompatible(DeviceModelId.europa, "1.3.0");

    // THEN
    expect(result).toBe(true);
  });

  it.each([
    [DeviceModelId.nanoS, "3.0.0"],
    [DeviceModelId.nanoX, "3.0.0"],
    [DeviceModelId.blue, "3.0.0"],
    [DeviceModelId.nanoSP, "3.0.0"],
    [DeviceModelId.stax, "1.6.0"],
    [DeviceModelId.europa, "1.2.0"],
  ])("should return false for %s with SE version %s", (modelId, seVersion) => {
    // WHEN
    const result = isLedgerRecoveryKeyCompatible(modelId, seVersion);

    // THEN
    expect(result).toBe(false);
  });

  it("should return false when seVersion is not provided", () => {
    // WHEN
    const result = isLedgerRecoveryKeyCompatible(DeviceModelId.stax);

    // THEN
    expect(result).toBe(false);
  });
});
