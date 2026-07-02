import { isValidNumberForInput } from "../customFeeUtils";

describe("isValidNumberForInput", () => {
  it.each(["Infinity", "-Infinity", "NaN"])("rejects non-finite values for fee inputs", value => {
    expect(isValidNumberForInput("fees", value)).toBe(false);
  });

  it("accepts positive finite values", () => {
    expect(isValidNumberForInput("fees", "1.5")).toBe(true);
  });

  it("allows zero for maxPriorityFeePerGas", () => {
    expect(isValidNumberForInput("maxPriorityFeePerGas", "0")).toBe(true);
  });
});
