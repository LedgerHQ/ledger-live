import BigNumber from "bignumber.js";
import { fromBigNumberToBigInt } from "./utils";

describe("bigNumberToBigInt", () => {
  it("should convert BigNumber to BigInt", () => {
    // GIVEN
    const bigNumber = new BigNumber("42");

    // WHEN
    const result = fromBigNumberToBigInt(bigNumber);

    // THEN
    expect(result).toEqual(BigInt("42"));
  });

  it("should return the default value if input is undefined", () => {
    // GIVEN
    const value = undefined;
    const defaultValue = BigInt(12);

    // WHEN
    const result = fromBigNumberToBigInt(value, defaultValue);

    // THEN
    expect(result).toEqual(defaultValue);
  });

  it("should return the same value if it's not a BigNumber", () => {
    // GIVEN
    const value = null;

    // WHEN
    const result = fromBigNumberToBigInt(value as unknown as BigNumber);

    // THEN
    expect(result).toEqual(value);
  });
});
