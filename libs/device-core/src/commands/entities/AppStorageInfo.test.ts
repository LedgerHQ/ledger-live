import { isAppStorageInfo, AppStorageInfo } from "./AppStorageInfo";

describe("isAppStorageInfo", () => {
  it("should return true for valid AppStorageInfo object", () => {
    const data: AppStorageInfo = {
      size: 1024,
      dataVersion: "1.0.0",
      hasSettings: true,
      hasData: true,
      hash: "abcd1234",
    };

    expect(isAppStorageInfo(data)).toBe(true);
  });

  it("should return false for non-object input", () => {
    const data: unknown = "invalid";

    expect(isAppStorageInfo(data)).toBe(false);
  });

  it("should return false for null input", () => {
    const data: unknown = null;

    expect(isAppStorageInfo(data)).toBe(false);
  });

  it("should return false for undefined input", () => {
    const data: unknown = undefined;

    expect(isAppStorageInfo(data)).toBe(false);
  });

  it("should return false if missing property", () => {
    const data: unknown = {
      // Missing size property
      dataVersion: "1.0.0",
      hasSettings: true,
      hasData: true,
      hash: "abcd1234",
    };

    expect(isAppStorageInfo(data)).toBe(false);
  });

  it("should return false if property type not correct", () => {
    const data: unknown = {
      size: 1024,
      dataVersion: "1.0.0",
      hasSettings: "Yes",
      hasData: true,
      hash: "abcd1234",
    };

    expect(isAppStorageInfo(data)).toBe(false);
  });
});
