import { BigNumber } from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { parseCurrencyUnit } from "./parseCurrencyUnit";

const unit: Unit = {
  name: "Test Unit",
  code: "TST",
  magnitude: 2,
  showAllDigits: false,
  prefixCode: false,
};

describe("parseCurrencyUnit", () => {
  test("parses dot decimals", () => {
    expect(parseCurrencyUnit(unit, "1.23")).toEqual(new BigNumber(123));
  });

  test("parses comma decimals", () => {
    expect(parseCurrencyUnit(unit, "1,23")).toEqual(new BigNumber(123));
  });

  test("returns zero on invalid input", () => {
    expect(parseCurrencyUnit(unit, "invalid")).toEqual(new BigNumber(0));
  });
});
