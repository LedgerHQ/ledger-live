/**
 * @jest-environment jsdom
 *
 * Uses the REAL `formatCurrencyUnit` (no mock) to lock the actually-rendered fee row strings.
 * The sibling `networkFeesDisplay.test.ts` mocks the formatter and so cannot catch how zero and
 * fractional amounts render — notably that a zero fee is `0 TRX` / `0 USD` (not `0.00`), which is
 * the accepted format for the combined row.
 */
import { BigNumber } from "bignumber.js";
import type { Unit } from "@domain/entity-currency-unit";
import { formatCombinedFeesValue, formatDisplayFeesValue } from "../networkFeesDisplay";

const trxUnit: Unit = { name: "TRX", code: "TRX", magnitude: 6 };
const usdUnit: Unit = { name: "US Dollar", code: "USD", magnitude: 2 };

// `formatCurrencyUnit` separates the amount and code with a non-breaking space; normalise it so the
// assertions read naturally while still locking the amount precision and the " • " composition.
const norm = (value: string) => value.replace(/[\u00A0\u202F\u2009]/g, " ");

describe("networkFeesDisplay (real formatter)", () => {
  it("formatCombinedFeesValue renders `<fiat> • <crypto>` with explicit zeros for a covered fee", () => {
    const { displayFeesValue } = formatCombinedFeesValue({
      estimatedFees: new BigNumber(0),
      estimatedFeesCountervalue: null,
      fiatUnit: usdUnit,
      displayUnit: trxUnit,
    });

    expect(norm(displayFeesValue)).toBe("0 USD • 0 TRX");
  });

  it("formatCombinedFeesValue renders full native precision alongside fiat for a shortfall", () => {
    const { displayFeesValue } = formatCombinedFeesValue({
      estimatedFees: new BigNumber(56), // 0.000056 TRX
      estimatedFeesCountervalue: new BigNumber(35), // 0.35 USD
      fiatUnit: usdUnit,
      displayUnit: trxUnit,
    });

    expect(norm(displayFeesValue)).toBe("0.35 USD • 0.000056 TRX");
  });

  it("formatDisplayFeesValue (default) is unchanged: `-` for zero, fiat when a rate exists", () => {
    expect(
      formatDisplayFeesValue({
        estimatedFees: new BigNumber(0),
        estimatedFeesCountervalue: null,
        fiatUnit: usdUnit,
        displayUnit: trxUnit,
      }).displayFeesValue,
    ).toBe("-");

    expect(
      norm(
        formatDisplayFeesValue({
          estimatedFees: new BigNumber(56),
          estimatedFeesCountervalue: new BigNumber(35),
          fiatUnit: usdUnit,
          displayUnit: trxUnit,
        }).displayFeesValue,
      ),
    ).toBe("0.35 USD");
  });
});
