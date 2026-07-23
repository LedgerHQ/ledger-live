import { isValidNumberForInput, normalizeDecimalSeparator } from "../customFeeUtils";

describe("normalizeDecimalSeparator", () => {
  it("converts a comma decimal separator to a dot", () => {
    expect(normalizeDecimalSeparator("0,0014")).toBe("0.0014");
  });

  it("leaves a dot separator untouched (idempotent)", () => {
    expect(normalizeDecimalSeparator("0.0014")).toBe("0.0014");
  });

  it("returns an empty string unchanged", () => {
    expect(normalizeDecimalSeparator("")).toBe("");
  });
});

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
