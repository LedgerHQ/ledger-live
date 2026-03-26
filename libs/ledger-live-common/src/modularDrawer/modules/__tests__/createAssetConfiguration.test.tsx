/**
 * @jest-environment jsdom
 */

import React from "react";
import { renderHook } from "@testing-library/react";
import { BigNumber } from "bignumber.js";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { mockEthCryptoCurrency } from "../../__mocks__/currencies.mock";
import { groupCurrenciesByAsset } from "../../utils";
import {
  useAssetConfiguration,
  sortAssets,
  type AssetWithComponents,
} from "../createAssetConfiguration";
import {
  ethereumCurrency,
  bitcoinCurrency,
  makeUsdcToken,
  createBalanceDeps,
  FIAT_CURRENCY_MAGNITUDE,
  ETH_FIAT_CONVERSION,
  TestWrapper,
} from "./fixtures";

const ApyIndicator = () => null;
const MarketPercentIndicator = () => null;
const MarketPriceIndicator = jest.fn(() => null);

const ethereumAccountHigh = genAccount("ethereum-account-high", {
  currency: ethereumCurrency,
});
ethereumAccountHigh.balance = new BigNumber("1000000000000000000000");
ethereumAccountHigh.spendableBalance = ethereumAccountHigh.balance;

const ethereumUsdcToken = makeUsdcToken(ethereumCurrency, "erc20", "USD Coin");
const ethereumUsdcTokenAccount = genTokenAccount(0, ethereumAccountHigh, ethereumUsdcToken);
ethereumUsdcTokenAccount.balance = new BigNumber("1000000000");
ethereumAccountHigh.subAccounts = [ethereumUsdcTokenAccount];

const useBalanceDeps = () =>
  createBalanceDeps([ethereumAccountHigh], { "USD ethereum": ETH_FIAT_CONVERSION });

const balanceItem = jest.fn(() => null);

const multiAssetsMap = groupCurrenciesByAsset([
  {
    asset: {
      id: "ethereum",
      ticker: "ETH",
      name: "Ethereum",
      assetsIds: { ethereum: "ethereum", arbitrum: "arbitrum" },
      metaCurrencyId: "ethereum",
    },
    networks: [mockEthCryptoCurrency],
  },
  {
    asset: {
      id: "bitcoin",
      ticker: "BTC",
      name: "Bitcoin",
      assetsIds: { bitcoin: "bitcoin" },
      metaCurrencyId: "bitcoin",
    },
    networks: [bitcoinCurrency],
  },
]);

const baseOptions = {
  useBalanceDeps,
  balanceItem,
  ApyIndicator,
  MarketPercentIndicator,
  MarketPriceIndicator,
  assetsMap: multiAssetsMap,
};

const makeAssetEntry = (
  currency: typeof ethereumCurrency,
  fiatValue: number,
  balanceValue: string = fiatValue > 0 ? "1" : "0",
): AssetWithComponents => ({
  ...currency,
  balanceData: {
    currency,
    balance: new BigNumber(balanceValue),
    fiatValue,
  },
});

describe("sortAssets", () => {
  it("should sort by fiatValue descending when rightElement is 'balance'", () => {
    const low = makeAssetEntry(bitcoinCurrency, 100);
    const high = makeAssetEntry(ethereumCurrency, 5000);
    const result = sortAssets([low, high], "balance");
    expect(result[0].id).toBe("ethereum");
    expect(result[1].id).toBe("bitcoin");
  });

  it("should sort by fiatValue descending when rightElement is undefined", () => {
    const low = makeAssetEntry(bitcoinCurrency, 100);
    const high = makeAssetEntry(ethereumCurrency, 5000);
    const result = sortAssets([low, high], undefined);
    expect(result[0].id).toBe("ethereum");
    expect(result[1].id).toBe("bitcoin");
  });

  it("should preserve original order when rightElement is 'marketTrend'", () => {
    const low = makeAssetEntry(bitcoinCurrency, 100);
    const high = makeAssetEntry(ethereumCurrency, 5000);
    const result = sortAssets([low, high], "marketTrend");
    expect(result[0].id).toBe("bitcoin");
    expect(result[1].id).toBe("ethereum");
  });

  it("should preserve original order when rightElement is 'undefined' (string)", () => {
    const low = makeAssetEntry(bitcoinCurrency, 100);
    const high = makeAssetEntry(ethereumCurrency, 5000);
    const result = sortAssets([low, high], "undefined");
    expect(result[0].id).toBe("bitcoin");
    expect(result[1].id).toBe("ethereum");
  });

  it("should not mutate the input array", () => {
    const low = makeAssetEntry(bitcoinCurrency, 100);
    const high = makeAssetEntry(ethereumCurrency, 5000);
    const input = [low, high];
    const result = sortAssets(input, "balance");
    expect(result).not.toBe(input);
    expect(input[0].id).toBe("bitcoin");
    expect(input[1].id).toBe("ethereum");
  });

  it("should place assets with balance before those without", () => {
    const noBalance = makeAssetEntry(bitcoinCurrency, 0, "0");
    const withBalance = makeAssetEntry(ethereumCurrency, 100, "1");
    const result = sortAssets([noBalance, withBalance], "balance");
    expect(result[0].id).toBe("ethereum");
    expect(result[1].id).toBe("bitcoin");
  });
});

describe("useAssetConfiguration", () => {
  beforeEach(() => {
    balanceItem.mockClear();
    MarketPriceIndicator.mockClear();
  });

  it("should call balanceItem with correct BalanceUI objects for each asset", () => {
    renderHook(
      () =>
        useAssetConfiguration([ethereumCurrency], {
          ...baseOptions,
          rightElement: "balance",
        }),
      { wrapper: TestWrapper },
    );

    expect(balanceItem).toHaveBeenCalledTimes(1);
    expect(balanceItem).toHaveBeenNthCalledWith(1, {
      currency: ethereumCurrency,
      balance: ethereumAccountHigh.balance,
      fiatValue: ethereumAccountHigh.balance
        .shiftedBy(FIAT_CURRENCY_MAGNITUDE - ethereumCurrency.units[0].magnitude)
        .multipliedBy(ETH_FIAT_CONVERSION)
        .toNumber(),
    });
  });

  it("should generate market trend right element with correct market trend data", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        useAssetConfiguration([ethereumCurrency], {
          ...baseOptions,
          rightElement: "marketTrend",
        }),
      { wrapper: TestWrapper },
    );

    const rightElement = current[0]?.rightElement;
    expect(rightElement).toBeDefined();
    expect(React.isValidElement(rightElement)).toBe(true);
    if (React.isValidElement(rightElement)) {
      expect(rightElement.props).toEqual({
        percent: 5.25,
        price: "$2,500.50",
      });
    }
  });

  it("should generate apy left element when leftElement is 'apy'", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        useAssetConfiguration([ethereumCurrency], {
          ...baseOptions,
          leftElement: "apy",
        }),
      { wrapper: TestWrapper },
    );

    if (React.isValidElement(current[0]?.leftElement)) {
      expect(current[0].leftElement.props).toEqual({
        value: 4.5,
        type: "APY",
      });
    } else {
      fail("leftElement should be a valid React element");
    }
  });

  it("should generate market trend left element when leftElement is 'marketTrend'", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        useAssetConfiguration([ethereumCurrency], {
          ...baseOptions,
          leftElement: "marketTrend",
        }),
      { wrapper: TestWrapper },
    );

    if (React.isValidElement(current[0]?.leftElement)) {
      expect(current[0].leftElement.props).toEqual({
        percent: 5.25,
      });
    } else {
      fail("leftElement should be a valid React element");
    }
  });

  it("should not include rightElement when rightElement is 'undefined'", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        useAssetConfiguration([ethereumCurrency], {
          ...baseOptions,
          rightElement: "undefined",
        }),
      { wrapper: TestWrapper },
    );

    expect(current[0]?.rightElement).toBeUndefined();
  });

  it("should merge both balance right and apy left elements", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        useAssetConfiguration([ethereumCurrency], {
          ...baseOptions,
          rightElement: "balance",
          leftElement: "apy",
        }),
      { wrapper: TestWrapper },
    );

    expect(current[0]?.rightElement).toBeDefined();
    expect(current[0]?.leftElement).toBeDefined();
    if (React.isValidElement(current[0]?.leftElement)) {
      expect(current[0].leftElement.props).toEqual({
        value: 4.5,
        type: "APY",
      });
    } else {
      fail("leftElement should be a valid React element");
    }
    expect(balanceItem).toHaveBeenCalledTimes(1);
  });

  it("should merge independent right and left marketTrend elements", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        useAssetConfiguration([ethereumCurrency], {
          ...baseOptions,
          rightElement: "marketTrend",
          leftElement: "marketTrend",
        }),
      { wrapper: TestWrapper },
    );

    const rightEl = current[0]?.rightElement;
    const leftEl = current[0]?.leftElement;
    expect(React.isValidElement(rightEl)).toBe(true);
    expect(React.isValidElement(leftEl)).toBe(true);
    if (React.isValidElement(rightEl)) {
      expect(rightEl.props).toEqual({ percent: 5.25, price: "$2,500.50" });
    }
    if (React.isValidElement(leftEl)) {
      expect(leftEl.props).toEqual({ percent: 5.25 });
    }
  });

  it("should default to balance rightElement and no leftElement when not specified", () => {
    const {
      result: { current },
    } = renderHook(() => useAssetConfiguration([ethereumCurrency], baseOptions), {
      wrapper: TestWrapper,
    });

    expect(balanceItem).toHaveBeenCalled();
    expect(current[0]?.rightElement).toBeDefined();
    expect(current[0]?.leftElement).toBeUndefined();
  });

  it("should correctly merge elements per index for multiple currencies", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        useAssetConfiguration([ethereumCurrency, bitcoinCurrency], {
          ...baseOptions,
          assetsMap: multiAssetsMap,
          rightElement: "marketTrend",
        }),
      { wrapper: TestWrapper },
    );

    expect(current).toHaveLength(2);

    const ethResult = current[0];
    const btcResult = current[1];

    expect(React.isValidElement(ethResult?.rightElement)).toBe(true);
    if (React.isValidElement(ethResult?.rightElement)) {
      expect(ethResult.rightElement.props).toEqual({
        percent: 5.25,
        price: "$2,500.50",
      });
    }

    expect(React.isValidElement(btcResult?.rightElement)).toBe(true);
    if (React.isValidElement(btcResult?.rightElement)) {
      expect(btcResult.rightElement.props).toEqual({
        percent: -2.5,
        price: "$45,000.00",
      });
    }
  });

  it("should return an empty array when no assets are provided", () => {
    const {
      result: { current },
    } = renderHook(() => useAssetConfiguration([], baseOptions), {
      wrapper: TestWrapper,
    });

    expect(current).toEqual([]);
  });

  it("should not produce leftElement for a currency without APY data", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        useAssetConfiguration([bitcoinCurrency], {
          ...baseOptions,
          leftElement: "apy",
        }),
      { wrapper: TestWrapper },
    );

    expect(current).toHaveLength(1);
    expect(current[0]?.leftElement).toBeUndefined();
  });

  it("should keep left element aligned with its currency after balance sort", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        useAssetConfiguration([bitcoinCurrency, ethereumCurrency], {
          ...baseOptions,
          assetsMap: multiAssetsMap,
          rightElement: "balance",
          leftElement: "apy",
        }),
      { wrapper: TestWrapper },
    );

    expect(current).toHaveLength(2);
    const ethEntry = current.find(c => c.id === "ethereum");
    const btcEntry = current.find(c => c.id === "bitcoin");

    expect(ethEntry).toBeDefined();
    expect(btcEntry).toBeDefined();

    if (React.isValidElement(ethEntry?.leftElement)) {
      expect(ethEntry.leftElement.props).toEqual({
        value: 4.5,
        type: "APY",
      });
    } else {
      fail("ethEntry.leftElement should be a valid React element");
    }
    expect(btcEntry?.leftElement).toBeUndefined();

    expect(current[0]?.id).toBe("ethereum");
  });
});
