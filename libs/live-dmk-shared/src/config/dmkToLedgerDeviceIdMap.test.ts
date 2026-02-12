import { DeviceModelId as DMKDeviceModelId } from "@ledgerhq/device-management-kit";
import { DeviceModelId as LLDeviceModelId } from "@ledgerhq/types-devices";

import { dmkToLedgerDeviceIdMap, ledgerToDmkDeviceIdMap } from "./dmkToLedgerDeviceIdMap";

describe("dmkToLedgerDeviceIdMap", () => {
  it.each([
    [DMKDeviceModelId.FLEX, LLDeviceModelId.europa],
    [DMKDeviceModelId.STAX, LLDeviceModelId.stax],
    [DMKDeviceModelId.NANO_SP, LLDeviceModelId.nanoSP],
    [DMKDeviceModelId.NANO_S, LLDeviceModelId.nanoS],
    [DMKDeviceModelId.NANO_X, LLDeviceModelId.nanoX],
    [DMKDeviceModelId.APEX, LLDeviceModelId.apex],
  ])("maps DMK %s to LL %s", (dmkId, expectedLLId) => {
    expect(dmkToLedgerDeviceIdMap[dmkId]).toBe(expectedLLId);
  });

  it("has an entry for every DMKDeviceModelId value", () => {
    const dmkValues = Object.values(DMKDeviceModelId);
    for (const dmkId of dmkValues) {
      expect(dmkToLedgerDeviceIdMap).toHaveProperty(dmkId);
    }
  });
});

describe("ledgerToDmkDeviceIdMap", () => {
  it.each([
    [LLDeviceModelId.europa, DMKDeviceModelId.FLEX],
    [LLDeviceModelId.stax, DMKDeviceModelId.STAX],
    [LLDeviceModelId.nanoSP, DMKDeviceModelId.NANO_SP],
    [LLDeviceModelId.nanoS, DMKDeviceModelId.NANO_S],
    [LLDeviceModelId.nanoX, DMKDeviceModelId.NANO_X],
    [LLDeviceModelId.apex, DMKDeviceModelId.APEX],
  ])("maps LL %s to DMK %s", (llId, expectedDmkId) => {
    expect(ledgerToDmkDeviceIdMap[llId]).toBe(expectedDmkId);
  });

  it("is the exact inverse of dmkToLedgerDeviceIdMap", () => {
    for (const [dmkId, llId] of Object.entries(dmkToLedgerDeviceIdMap)) {
      expect(ledgerToDmkDeviceIdMap[llId]).toBe(dmkId);
    }
  });

  it("has the same number of entries as dmkToLedgerDeviceIdMap", () => {
    expect(Object.keys(ledgerToDmkDeviceIdMap)).toHaveLength(
      Object.keys(dmkToLedgerDeviceIdMap).length,
    );
  });
});
