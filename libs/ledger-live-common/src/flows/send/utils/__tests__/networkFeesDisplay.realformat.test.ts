/**
 * @jest-environment jsdom
 *
 * Uses the REAL `formatCurrencyUnit` (no mock) to lock the actually-rendered fee row strings.
 * The sibling `networkFeesDisplay.test.ts` mocks the formatter and so cannot catch how zero and
 * fractional amounts render — notably that a zero fee is `0 TRX` / `0 USD` (not `0.00`), which is
 * the accepted format for the read-only two-value row.
 */
import { BigNumber } from "bignumber.js";
import type { Unit } from "@domain/entity-currency-unit";
import { formatFeeCurrencyAmount, formatFeesValue } from "../networkFeesDisplay";

const trxUnit: Unit = { name: "TRX", code: "TRX", magnitude: 6 };
const usdUnit: Unit = { name: "US Dollar", code: "USD", magnitude: 2 };
const ethUnit: Unit = { name: "ETH", code: "ETH", magnitude: 18 };

// `formatCurrencyUnit` separates the amount and code with a non-breaking space; normalise it so the
// assertions read naturally while still locking the amount precision.
const norm = (value: string) => value.replace(/[\u00A0\u202F\u2009]/g, " ");

describe("formatFeeCurrencyAmount", () => {
  // An 18-magnitude gas fee printed in full wraps the fee row onto two lines, so the amount must
  // stay rounded to significant digits.
  it.each([
    ["26052026217000", "0.00002605 ETH"],
    ["31386997971000", "0.00003138 ETH"],
    ["70482175575000", "0.00007048 ETH"],
    ["32938000000000000", "0.032938 ETH"],
  ])("rounds a wei fee of %s to significant digits", (wei, expected) => {
    expect(norm(formatFeeCurrencyAmount(ethUnit, new BigNumber(wei)))).toBe(expected);
  });

  it("keeps short native amounts intact", () => {
    expect(norm(formatFeeCurrencyAmount(trxUnit, new BigNumber(56)))).toBe("0.000056 TRX");
    expect(norm(formatFeeCurrencyAmount(usdUnit, new BigNumber(5)))).toBe("0.05 USD");
  });
});

describe("networkFeesDisplay (real formatter)", () => {
  it("both mode renders explicit zeros for a covered fee", () => {
    const { displayFeesValue, secondaryFeesValue } = formatFeesValue({
      estimatedFees: new BigNumber(0),
      estimatedFeesCountervalue: null,
      fiatUnit: usdUnit,
      displayUnit: trxUnit,
      mode: "both",
    });

    expect(norm(displayFeesValue)).toBe("0 USD");
    expect(norm(secondaryFeesValue ?? "")).toBe("0 TRX");
  });

  it("both mode renders full native precision alongside fiat for a shortfall", () => {
    const { displayFeesValue, secondaryFeesValue } = formatFeesValue({
      estimatedFees: new BigNumber(56), // 0.000056 TRX
      estimatedFeesCountervalue: new BigNumber(35), // 0.35 USD
      fiatUnit: usdUnit,
      displayUnit: trxUnit,
      mode: "both",
    });

    expect(norm(displayFeesValue)).toBe("0.35 USD");
    expect(norm(secondaryFeesValue ?? "")).toBe("0.000056 TRX");
  });

  it("fiat mode is unchanged: `-` for zero, fiat when a rate exists", () => {
    expect(
      formatFeesValue({
        estimatedFees: new BigNumber(0),
        estimatedFeesCountervalue: null,
        fiatUnit: usdUnit,
        displayUnit: trxUnit,
        mode: "fiat",
      }).displayFeesValue,
    ).toBe("-");

    expect(
      norm(
        formatFeesValue({
          estimatedFees: new BigNumber(56),
          estimatedFeesCountervalue: new BigNumber(35),
          fiatUnit: usdUnit,
          displayUnit: trxUnit,
          mode: "fiat",
        }).displayFeesValue,
      ),
    ).toBe("0.35 USD");
  });

  it("crypto mode renders full native precision even when a rate exists", () => {
    expect(
      norm(
        formatFeesValue({
          estimatedFees: new BigNumber(56),
          estimatedFeesCountervalue: new BigNumber(35),
          fiatUnit: usdUnit,
          displayUnit: trxUnit,
          mode: "crypto",
        }).displayFeesValue,
      ),
    ).toBe("0.000056 TRX");
  });
});
