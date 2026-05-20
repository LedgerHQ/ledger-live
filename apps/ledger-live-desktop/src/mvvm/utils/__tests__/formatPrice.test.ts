import { BigNumber } from "bignumber.js";
import { getFiatCurrencyByTicker } from "@ledgerhq/live-common/currencies/index";
import { formatPrice } from "../formatPrice";

const USD = getFiatCurrencyByTicker("USD");
const usdUnit = USD.units[0];

describe("formatPrice", () => {
  it("formats whole-unit values like the default formatter (no extra digits)", () => {
    const out = formatPrice(usdUnit, new BigNumber(50_000 * 100));

    expect(out).toContain("50,000");
  });

  it("preserves significant digits for sub-cent prices (BONK-like)", () => {
    // $0.00001 → 0.001 cents (scaled to USD smallest unit).
    const out = formatPrice(usdUnit, new BigNumber(0.001));

    expect(out).not.toMatch(/^0(\.0+)?$/);
    expect(out).toContain("0.00001");
  });

  it("preserves significant digits for negative sub-cent prices (negative PnL)", () => {
    // -$0.00001 → -0.001 cents. Should not collapse to "-$0.00".
    const out = formatPrice(usdUnit, new BigNumber(-0.001));

    expect(out).not.toMatch(/^-?0(\.0+)?$/);
    expect(out).toContain("0.00001");
  });

  it("preserves significant digits for fractional dollar prices (HBAR-like)", () => {
    // $0.092 → 9.2 cents.
    const out = formatPrice(usdUnit, new BigNumber(9.2));

    expect(out).toContain("0.092");
  });

  it("returns 0 for a zero value (does not crash on empty positions)", () => {
    expect(formatPrice(usdUnit, new BigNumber(0))).toContain("0");
  });

  it("respects the showCode option", () => {
    expect(formatPrice(usdUnit, new BigNumber(100 * 100), { showCode: true })).toContain("$");
    expect(formatPrice(usdUnit, new BigNumber(100 * 100), { showCode: false })).not.toContain("$");
  });

  it("hides the value when discreet is enabled", () => {
    expect(formatPrice(usdUnit, new BigNumber(50_000 * 100), { discreet: true })).toContain("***");
  });

  it("respects a custom subMagnitude override", () => {
    // With subMagnitude=2, $0.00001 (= 0.001 cents) should round back to 0.
    const out = formatPrice(usdUnit, new BigNumber(0.001), { subMagnitude: 2 });

    expect(out).not.toContain("0.00001");
  });
});
