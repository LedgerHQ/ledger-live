/**
 * @jest-environment jsdom
 */
import { BigNumber } from "bignumber.js";
import {
  formatFeesValue,
  joinFeeSublabelValues,
  resolveFeeDisplayContext,
} from "../networkFeesDisplay";
import type { Account } from "@ledgerhq/types-live";

jest.mock("@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit", () => ({
  formatCurrencyUnit: jest.fn((_unit, value) => `FMT_${value.toString()}`),
}));

describe("networkFeesDisplay", () => {
  const btcUnit = { name: "Bitcoin", code: "BTC", magnitude: 8 };
  const usdUnit = { name: "US Dollar", code: "USD", magnitude: 2 };
  const accountCurrency = {
    id: "bitcoin",
    family: "bitcoin",
    ticker: "BTC",
    units: [btcUnit],
  };
  const mainAccount = {
    type: "Account",
    id: "main",
    currency: accountCurrency,
    subAccounts: [
      {
        type: "TokenAccount",
        id: "usdc-sub-account-id",
        token: {
          type: "TokenCurrency",
          id: "celo/erc20/usdc",
          ticker: "USDC",
          units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
        },
      },
    ],
  } as unknown as Account;

  it("resolveFeeDisplayContext uses token unit when fee currency sub-account exists", () => {
    const context = resolveFeeDisplayContext({
      mainAccount,
      accountCurrency: accountCurrency as never,
      accountUnit: btcUnit,
      feeCurrencyAccountId: "usdc-sub-account-id",
    });

    expect(context.displayUnit.code).toBe("USDC");
    expect(context.displayCurrency.ticker).toBe("USDC");
  });

  const baseParams: {
    estimatedFeesCountervalue: BigNumber | null;
    fiatUnit: typeof usdUnit;
    displayUnit: typeof btcUnit;
  } = {
    estimatedFeesCountervalue: null,
    fiatUnit: usdUnit,
    displayUnit: btcUnit,
  };

  describe.each(["fiat", "crypto"] as const)("%s mode", mode => {
    it("returns '-' when fees are zero", () => {
      expect(
        formatFeesValue({
          ...baseParams,
          estimatedFees: new BigNumber(0),
          mode,
        }).displayFeesValue,
      ).toBe("-");
    });

    it("returns '-' for a non-finite estimate (never renders NaN)", () => {
      expect(
        formatFeesValue({
          ...baseParams,
          estimatedFees: new BigNumber(NaN),
          mode,
        }).displayFeesValue,
      ).toBe("-");
    });

    it("never sets a secondary value", () => {
      expect(
        formatFeesValue({
          ...baseParams,
          estimatedFees: new BigNumber(1000),
          mode,
        }).secondaryFeesValue,
      ).toBeNull();
    });
  });

  it("fiat mode prefers fiat formatting when a countervalue is available", () => {
    const result = formatFeesValue({
      ...baseParams,
      estimatedFees: new BigNumber(1000),
      estimatedFeesCountervalue: new BigNumber(42),
      mode: "fiat",
    });

    expect(result.displayFeesValue).toBe("FMT_42");
  });

  it("fiat mode falls back to the crypto amount when no countervalue is available", () => {
    const result = formatFeesValue({
      ...baseParams,
      estimatedFees: new BigNumber(1000),
      mode: "fiat",
    });

    expect(result.displayFeesValue).toBe("FMT_1000");
  });

  it("crypto mode shows the native amount even when a countervalue is available", () => {
    const result = formatFeesValue({
      ...baseParams,
      estimatedFees: new BigNumber(1000),
      estimatedFeesCountervalue: new BigNumber(42),
      mode: "crypto",
    });

    expect(result.displayFeesValue).toBe("FMT_1000");
  });

  it("both mode shows fiat + crypto, and 0 (not '-') for a zero fee", () => {
    const result = formatFeesValue({
      ...baseParams,
      estimatedFees: new BigNumber(0),
      mode: "both",
    });

    expect(result.displayFeesValue).toBe("FMT_0");
    expect(result.secondaryFeesValue).toBe("FMT_0");
  });

  it("both mode shows fiat + crypto for a non-zero fee with a countervalue", () => {
    const result = formatFeesValue({
      ...baseParams,
      estimatedFees: new BigNumber(1000),
      estimatedFeesCountervalue: new BigNumber(42),
      mode: "both",
    });

    expect(result.displayFeesValue).toBe("FMT_42");
    expect(result.secondaryFeesValue).toBe("FMT_1000");
  });

  it("both mode promotes the crypto amount for a non-zero fee with no countervalue", () => {
    const result = formatFeesValue({
      ...baseParams,
      estimatedFees: new BigNumber(1000),
      mode: "both",
    });

    expect(result.displayFeesValue).toBe("FMT_1000");
    expect(result.secondaryFeesValue).toBeNull();
  });

  it("both mode clamps a negative/invalid estimate to zero", () => {
    const result = formatFeesValue({
      ...baseParams,
      estimatedFees: new BigNumber(-5),
      estimatedFeesCountervalue: new BigNumber(3),
      mode: "both",
    });

    expect(result.displayFeesValue).toBe("FMT_0");
    expect(result.secondaryFeesValue).toBe("FMT_0");
  });

  it("both mode treats a non-finite estimate as zero (never renders NaN)", () => {
    const result = formatFeesValue({
      ...baseParams,
      estimatedFees: new BigNumber(NaN),
      mode: "both",
    });

    expect(result.displayFeesValue).toBe("FMT_0");
    expect(result.secondaryFeesValue).toBe("FMT_0");
  });

  it("joinFeeSublabelValues joins both values and degrades to whichever side exists", () => {
    expect(joinFeeSublabelValues("$0.03", "0.000329 ETH")).toBe("$0.03 · 0.000329 ETH");
    expect(joinFeeSublabelValues("$0.03", null)).toBe("$0.03");
    expect(joinFeeSublabelValues(null, "0.000329 ETH")).toBe("0.000329 ETH");
    expect(joinFeeSublabelValues(null, null)).toBeNull();
  });
});
