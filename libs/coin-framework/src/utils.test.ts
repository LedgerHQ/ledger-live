import BigNumber from "bignumber.js";
import { fromBigNumberToBigInt } from "./utils";

describe("bigNumberToBigInt", () => {
  it("should convert BigNumber to BigInt", () => {
    const bigNumber = new BigNumber("42");
    const result = fromBigNumberToBigInt(bigNumber);
    expect(result).toEqual(BigInt("42"));
  });

  it("should return the default value if input is undefined", () => {
    const value = undefined;
    const defaultValue = BigInt(12);
    const result = fromBigNumberToBigInt(value, defaultValue);
    expect(result).toEqual(defaultValue);
  });
  it("should convert to BigInt for very large numbers", () => {
    const valueStr = "1234567890123456789012345678901234567890";
    const valBignumber = new BigNumber(valueStr);
    const valBigint = fromBigNumberToBigInt(valBignumber);
    expect(valBigint).toEqual(BigInt(valueStr));
  });
});
