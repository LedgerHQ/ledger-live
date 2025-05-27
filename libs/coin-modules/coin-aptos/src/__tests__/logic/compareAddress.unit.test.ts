import { compareAddress } from "../../logic/getCoinAndAmounts";

describe("compareAddress", () => {
  it("should return true for identical addresses", () => {
    const addressA = "0x1234567890abcdef";
    const addressB = "0x1234567890abcdef";
    expect(compareAddress(addressA, addressB)).toBe(true);
  });

  it("should return true for addresses with different cases", () => {
    const addressA = "0x1234567890abcdef";
    const addressB = "0x1234567890ABCDEF";
    expect(compareAddress(addressA, addressB)).toBe(true);
  });

  it("should return true for addresses with different hex formats", () => {
    const addressA = "0x1234567890abcdef";
    const addressB = "1234567890abcdef";
    expect(compareAddress(addressA, addressB)).toBe(true);
  });

  it("should return false for different addresses", () => {
    const addressA = "0x1234567890abcdef";
    const addressB = "0xfedcba0987654321";
    expect(compareAddress(addressA, addressB)).toBe(false);
  });
});
