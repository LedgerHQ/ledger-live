import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import { capFormattedValue, MAX_INTEGER_CHARS } from "../capFormattedValue";

const base: FormattedValue = {
  integerPart: "",
  decimalPart: "00",
  decimalSeparator: ".",
  currencyText: "$",
  currencyPosition: "start",
};

describe("capFormattedValue", () => {
  it("returns the value unchanged when integerPart fits within MAX_INTEGER_CHARS", () => {
    const value = { ...base, integerPart: "1,234,567" };
    expect(capFormattedValue(value)).toBe(value);
  });

  it("returns the value unchanged at exactly MAX_INTEGER_CHARS", () => {
    const value = { ...base, integerPart: "x".repeat(MAX_INTEGER_CHARS) };
    expect(capFormattedValue(value)).toBe(value);
  });

  it("truncates the integerPart with an ellipsis when exceeding the limit", () => {
    const value = { ...base, integerPart: "60,494,256" };
    const capped = capFormattedValue(value);
    expect(capped.integerPart).toBe("60,494,25…");
    expect(capped.decimalPart).toBe("");
  });

  it("preserves currency metadata when capping", () => {
    const value = {
      ...base,
      integerPart: "1234567890",
      currencyText: "€",
      currencyPosition: "end" as const,
    };
    const capped = capFormattedValue(value);
    expect(capped.currencyText).toBe("€");
    expect(capped.currencyPosition).toBe("end");
    expect(capped.decimalSeparator).toBe(".");
  });
});
