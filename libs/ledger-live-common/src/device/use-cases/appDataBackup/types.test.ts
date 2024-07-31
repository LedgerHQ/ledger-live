import { AppStorageInfo } from "@ledgerhq/device-core";
import { isAppStorageType } from "./types";

jest.mock("@ledgerhq/device-core", () => {
  return {
    isAppStorageInfo: jest.fn(() => true),
  };
});

describe("isAppStorageType", () => {
  it("should return true for valid AppStorageType", () => {
    const data = {
      appDataInfo: {} as AppStorageInfo,
      appData: "MTA2IFJ1ZSBkdSBUZW1wbGUgNzUwMDMgUGFyaXM=", // 106 Rue du Temple 75003 Paris
    };

    expect(isAppStorageType(data)).toBe(true);
  });

  it("should return false for missing appDataInfo", () => {
    const data = {
      // Missing appDataInfo property
      appData: "MTA2IFJ1ZSBkdSBUZW1wbGUgNzUwMDMgUGFyaXM=",
    };

    expect(isAppStorageType(data)).toBe(false);
  });

  it("should return false for missing appData", () => {
    const data = {
      appDataInfo: {} as AppStorageInfo,
      // Missing appData property
    };

    expect(isAppStorageType(data)).toBe(false);
  });

  it("should return false for invalid appData type", () => {
    const data = {
      appDataInfo: {} as AppStorageInfo,
      appData: 42, // Invalid appData
    };

    expect(isAppStorageType(data)).toBe(false);
  });

  it("should return false for unknown data", () => {
    const data = {
      // Unknown data
      foo: "bar",
    };

    expect(isAppStorageType(data)).toBe(false);
  });
});
