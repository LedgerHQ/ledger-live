import { parseToBigNumber } from "@ledgerhq/live-common/modularDrawer/utils/parseToBigNumber";
import BigNumber from "bignumber.js";

describe("parseToBigNumber", () => {
  it("should return the same BigNumber instance if input is already a BigNumber", () => {
    const input = new BigNumber(123.45);
    const result = parseToBigNumber(input);
    expect(result).toBe(input);
  });

  it("should parse a string into a BigNumber", () => {
    const input = "123.45";
    const result = parseToBigNumber(input);
    expect(result).toEqual(new BigNumber(123.45));
  });

  it("should parse a string with commas into a BigNumber", () => {
    const input = "1,234.56";
    const result = parseToBigNumber(input);
    expect(result).toEqual(new BigNumber(1234.56));
  });

  it("should parse a number into a BigNumber", () => {
    const input = 123.45;
    const result = parseToBigNumber(input);
    expect(result).toEqual(new BigNumber(123.45));
  });

  it("should handle edge cases like zero", () => {
    const input = 0;
    const result = parseToBigNumber(input);
    expect(result).toEqual(new BigNumber(0));
  });

  it("should handle negative numbers", () => {
    const input = "-123.45";
    const result = parseToBigNumber(input);
    expect(result).toEqual(new BigNumber(-123.45));
  });

  it("should handle large numbers", () => {
    const input = "12345678901234567890";
    const result = parseToBigNumber(input);
    expect(result).toEqual(new BigNumber("12345678901234567890"));
  });
});
