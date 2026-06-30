/**
 * @jest-environment jsdom
 */
import { BigNumber } from "bignumber.js";
import {
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

  it("getSelectedPresetFiatValue ignores custom strategy", () => {
    expect(getSelectedPresetFiatValue("custom", { slow: "$1" })).toBeNull();
    expect(getSelectedPresetFiatValue("slow", { slow: "$1" })).toBe("$1");
  });
});
