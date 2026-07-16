import { containsRTL, forceLTRIfRTL } from "./rtl";

const LRI = "\u2066";
const PDI = "\u2069";

describe("containsRTL", () => {
  test.each([
    ["Saudi Riyal symbol", "﷼"],
    ["Emirati Dirham symbol", "د.إ."],
    ["Egyptian Pound symbol", "ج.م.‏"],
    ["Afghani symbol", "؋"],
    ["Hebrew letter", "א"],
    ["amount with arabic symbol", "-﷼106.98"],
  ])("returns true for %s", (_name, value) => {
    expect(containsRTL(value)).toBe(true);
  });

  test.each([
    ["dollar", "$"],
    ["euro", "€"],
    ["pound", "£"],
    ["ticker", "USD"],
    ["signed latin amount", "-123.45 USD"],
    ["empty string", ""],
  ])("returns false for %s", (_name, value) => {
    expect(containsRTL(value)).toBe(false);
  });
});

describe("forceLTRIfRTL", () => {
  test("wraps strings containing RTL characters in a LTR isolate", () => {
    expect(forceLTRIfRTL("-﷼106.98")).toBe(`${LRI}-﷼106.98${PDI}`);
  });

  test("leaves strings without RTL characters untouched", () => {
    expect(forceLTRIfRTL("-$106.98")).toBe("-$106.98");
  });
});
