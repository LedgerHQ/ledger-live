import type { Unit } from "@ledgerhq/types-cryptoassets";
import { sanitizeValueString } from "./sanitizeValueString";

const unit: Unit = {
  name: "Test Unit",
  code: "TST",
  magnitude: 2,
  showAllDigits: false,
  prefixCode: false,
};

describe("sanitizeValueString", () => {
  test("keeps numeric input and decimals", () => {
    expect(sanitizeValueString(unit, "12.3", "en-US")).toEqual({
      display: "12.3",
      value: "1230",
    });
  });

  test("normalizes commas as decimal separators", () => {
    expect(sanitizeValueString(unit, "0,45", "fr-FR")).toEqual({
      display: "0,45",
      value: "45",
    });
  });

  test("truncates extra fractional digits", () => {
    expect(sanitizeValueString(unit, "1.2345", "en-US")).toEqual({
      display: "1.23",
      value: "123",
    });
  });
});
