import { decodeCollectionId, getThreshold, hashProtoNFT, isThresholdValid } from "..";
import { DEFAULT_THRESHOLD } from "../const";

describe("hashProtoNFT", () => {
  it("should hash with all values", () => {
    expect(hashProtoNFT("0xabc", "eth", "123")).toBe("0xabc|123|eth");
  });

  it("should hash with undefined tokenId", () => {
    expect(hashProtoNFT("0xabc", "eth", undefined)).toBe("0xabc|0|eth");
  });

  it("should hash with null tokenId", () => {
    expect(hashProtoNFT("0xabc", "eth", null)).toBe("0xabc|0|eth");
  });

  it("should hash with no tokenId argument at all", () => {
    expect(hashProtoNFT("0xabc", "eth")).toBe("0xabc|0|eth");
  });
});

describe("isThresholdValid", () => {
  it("should return true for valid thresholds", () => {
    expect(isThresholdValid(0)).toBe(true);
    expect(isThresholdValid(50)).toBe(true);
    expect(isThresholdValid(100)).toBe(true);
    expect(isThresholdValid("75")).toBe(true);
  });

  it("should return false for invalid thresholds", () => {
    expect(isThresholdValid(-1)).toBe(false);
    expect(isThresholdValid(101)).toBe(false);
    expect(isThresholdValid("not-a-number")).toBe(false);
    expect(isThresholdValid(undefined)).toBe(false);
  });
});

describe("decodeCollectionId", () => {
  it("should decode a valid collectionId", () => {
    const result = decodeCollectionId("account123|0xContract");
    expect(result).toEqual({
      accountId: "account123",
      contractAddress: "0xContract",
    });
  });

  it("should decode an invalid collectionId with missing parts", () => {
    const result = decodeCollectionId("onlyAccount");
    expect(result).toEqual({
      accountId: "onlyAccount",
      contractAddress: undefined,
    });
  });
});

describe("getThreshold", () => {
  it("should return valid threshold if within range", () => {
    expect(getThreshold(20)).toBe(20);
    expect(getThreshold("40")).toBe(40);
  });

  it("should return DEFAULT_THRESHOLD for invalid values", () => {
    expect(getThreshold(-5)).toBe(DEFAULT_THRESHOLD);
    expect(getThreshold(150)).toBe(DEFAULT_THRESHOLD);
    expect(getThreshold(undefined)).toBe(DEFAULT_THRESHOLD);
    expect(getThreshold("bad")).toBe(DEFAULT_THRESHOLD);
  });
});
