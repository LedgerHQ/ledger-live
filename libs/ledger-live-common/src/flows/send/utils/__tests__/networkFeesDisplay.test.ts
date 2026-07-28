/**
 * @jest-environment jsdom
 */
import { BigNumber } from "bignumber.js";
import {
  formatCombinedFeesValue,
  formatDisplayFeesValue,
  getSelectedPresetFiatValue,
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

  it("formatDisplayFeesValue returns '-' when fees are zero", () => {
    expect(
      formatDisplayFeesValue({
        estimatedFees: new BigNumber(0),
        estimatedFeesCountervalue: null,
        fiatUnit: usdUnit,
        displayUnit: btcUnit,
      }).displayFeesValue,
    ).toBe("-");
  });

  it("formatDisplayFeesValue prefers fiat formatting when countervalue is available", () => {
    const result = formatDisplayFeesValue({
      estimatedFees: new BigNumber(1000),
      estimatedFeesCountervalue: new BigNumber(42),
      fiatUnit: usdUnit,
      displayUnit: btcUnit,
    });

    expect(result.displayFeesValue).toBe("FMT_42");
    expect(result.formattedEstimatedFeesFiat).toBe("FMT_42");
  });

  it("formatDisplayFeesValue falls back to the crypto amount when no countervalue is available", () => {
    const result = formatDisplayFeesValue({
      estimatedFees: new BigNumber(1000),
      estimatedFeesCountervalue: null,
      fiatUnit: usdUnit,
      displayUnit: btcUnit,
    });

    expect(result.displayFeesValue).toBe("FMT_1000");
    expect(result.formattedEstimatedFeesFiat).toBeNull();
  });

  it("formatDisplayFeesValue returns '-' for a non-finite estimate (never renders NaN)", () => {
    expect(
      formatDisplayFeesValue({
        estimatedFees: new BigNumber(NaN),
        estimatedFeesCountervalue: null,
        fiatUnit: usdUnit,
        displayUnit: btcUnit,
      }).displayFeesValue,
    ).toBe("-");
  });

  it("formatCombinedFeesValue shows fiat • crypto and 0 (not '-') for a zero fee", () => {
    const result = formatCombinedFeesValue({
      estimatedFees: new BigNumber(0),
      estimatedFeesCountervalue: null,
      fiatUnit: usdUnit,
      displayUnit: btcUnit,
    });

    expect(result.displayFeesValue).toBe("FMT_0 • FMT_0");
    expect(result.formattedEstimatedFeesFiat).toBe("FMT_0");
  });

  it("formatCombinedFeesValue shows fiat • crypto for a non-zero fee with a countervalue", () => {
    const result = formatCombinedFeesValue({
      estimatedFees: new BigNumber(1000),
      estimatedFeesCountervalue: new BigNumber(42),
      fiatUnit: usdUnit,
      displayUnit: btcUnit,
    });

    expect(result.displayFeesValue).toBe("FMT_42 • FMT_1000");
    expect(result.formattedEstimatedFeesFiat).toBe("FMT_42");
  });

  it("formatCombinedFeesValue shows the crypto amount alone for a non-zero fee with no countervalue", () => {
    const result = formatCombinedFeesValue({
      estimatedFees: new BigNumber(1000),
      estimatedFeesCountervalue: null,
      fiatUnit: usdUnit,
      displayUnit: btcUnit,
    });

    expect(result.displayFeesValue).toBe("FMT_1000");
    expect(result.formattedEstimatedFeesFiat).toBeNull();
  });

  it("formatCombinedFeesValue clamps a negative/invalid estimate to zero", () => {
    const result = formatCombinedFeesValue({
      estimatedFees: new BigNumber(-5),
      estimatedFeesCountervalue: new BigNumber(3),
      fiatUnit: usdUnit,
      displayUnit: btcUnit,
    });

    expect(result.displayFeesValue).toBe("FMT_0 • FMT_0");
  });

  it("formatCombinedFeesValue treats a non-finite estimate as zero (never renders NaN)", () => {
    const result = formatCombinedFeesValue({
      estimatedFees: new BigNumber(NaN),
      estimatedFeesCountervalue: null,
      fiatUnit: usdUnit,
      displayUnit: btcUnit,
    });

    expect(result.displayFeesValue).toBe("FMT_0 • FMT_0");
  });

  it("getSelectedPresetFiatValue ignores custom strategy", () => {
    expect(getSelectedPresetFiatValue("custom", { slow: "$1" })).toBeNull();
    expect(getSelectedPresetFiatValue("slow", { slow: "$1" })).toBe("$1");
  });
});
