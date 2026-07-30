import { describe, expect, it } from "bun:test";
import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { formatCliCurrencyUnit, toAsciiSpaces } from "./currency";

const NBSP = "\u00A0";
const NARROW_NBSP = "\u202F";

const ethUnit = getCryptoCurrencyById("ethereum").units[0];

describe("toAsciiSpaces", () => {
  it("should replace a non-breaking space with U+0020", () => {
    expect(toAsciiSpaces(`1.234${NBSP}ETH`)).toBe("1.234 ETH");
  });

  it("should replace a narrow no-break space with U+0020", () => {
    expect(toAsciiSpaces(`1${NARROW_NBSP}234${NBSP}ETH`)).toBe("1 234 ETH");
  });

  it("should leave a string that already uses ASCII spaces untouched", () => {
    expect(toAsciiSpaces("1,234.5 ETH")).toBe("1,234.5 ETH");
  });
});

describe("formatCliCurrencyUnit", () => {
  it("should separate the value from its code with U+0020, not U+00A0", () => {
    const formatted = formatCliCurrencyUnit(ethUnit, new BigNumber("1234000000000000000"), {
      showCode: true,
    });
    // Assert on the codepoint: `toContain("1.234 ETH")` typed with a regular space is exactly the
    // assertion that let the non-breaking space ship unnoticed.
    expect(formatted).not.toContain(NBSP);
    expect(formatted.split(" ")).toEqual(["1.234", "ETH"]);
  });

  it("should emit no non-ASCII space anywhere, including in grouped thousands", () => {
    const formatted = formatCliCurrencyUnit(ethUnit, new BigNumber("12345000000000000000000"), {
      showCode: true,
    });
    expect(formatted).not.toMatch(new RegExp(`[${NBSP}${NARROW_NBSP}]`));
    expect(formatted.endsWith(" ETH")).toBe(true);
  });

  it("should keep formatting a zero amount pipe-safe", () => {
    const formatted = formatCliCurrencyUnit(ethUnit, new BigNumber(0), { showCode: true });
    expect(formatted).not.toContain(NBSP);
    expect(formatted).toBe("0 ETH");
  });
});
