import { DeviceModelId } from "@ledgerhq/device-management-kit";
import {
  DEFAULT_RECEIVE_FAMILY_CONFIG,
  resolveReceiveFamilyConfig,
} from "../resolveReceiveFamilyConfig";

describe("resolveReceiveFamilyConfig", () => {
  it("returns the defaults when the family has no config", () => {
    expect(resolveReceiveFamilyConfig({ family: "evm", excludedFamilies: [] })).toEqual(
      DEFAULT_RECEIVE_FAMILY_CONFIG,
    );
  });

  it("supports a family with no notice by default", () => {
    expect(DEFAULT_RECEIVE_FAMILY_CONFIG).toEqual({ isSupported: true, notices: [] });
  });

  it("merges the family config onto the defaults", () => {
    const config = resolveReceiveFamilyConfig({
      family: "bitcoin",
      familyConfig: { notices: ["utxo", "taproot"] },
      excludedFamilies: [],
    });

    expect(config).toEqual({ isSupported: true, notices: ["utxo", "taproot"] });
  });

  it("keeps the device models the family cannot verify on", () => {
    const config = resolveReceiveFamilyConfig({
      family: "aptos",
      familyConfig: { unsupportedDeviceModelIds: [DeviceModelId.NANO_S] },
      excludedFamilies: [],
    });

    expect(config.unsupportedDeviceModelIds).toEqual([DeviceModelId.NANO_S]);
  });

  it("sends an excluded family to the legacy flow", () => {
    const config = resolveReceiveFamilyConfig({
      family: "tron",
      familyConfig: { notices: ["tronInactiveAccount"] },
      excludedFamilies: ["tron"],
    });

    expect(config).toEqual({ isSupported: false, notices: ["tronInactiveAccount"] });
  });

  it("sends an excluded family to the legacy flow even when its config supports it", () => {
    const config = resolveReceiveFamilyConfig({
      family: "tron",
      familyConfig: { isSupported: true },
      excludedFamilies: ["tron"],
    });

    expect(config.isSupported).toBe(false);
  });

  it("keeps a family supported when another family is excluded", () => {
    const config = resolveReceiveFamilyConfig({ family: "bitcoin", excludedFamilies: ["tron"] });

    expect(config.isSupported).toBe(true);
  });
});
