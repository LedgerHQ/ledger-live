/**
 * @jest-environment jsdom
 */

import React from "react";
import { renderHook } from "@testing-library/react";
import { mockEthCryptoCurrency } from "../../__mocks__/currencies.mock";
import { groupCurrenciesByAsset } from "../../utils";
import createAssetConfigurationHook from "../createAssetConfiguration";
import {
  createEthereumWithToken,
  createUseBalanceDeps,
  createMockStore,
  createWrapper,
  ethereumCurrencyMagnitude,
  fiatCurrencyMagnitude,
  fiatConversion,
} from "../../test-helpers";

const { ethereumCurrency, ethereumAccountHigh } = createEthereumWithToken();
const useBalanceDeps = createUseBalanceDeps(ethereumAccountHigh);

const ApyIndicator = () => null;
const MarketPercentIndicator = () => null;
const MarketPriceIndicator = jest.fn(() => null);

const balanceItem = jest.fn(() => null);

const assetConfigurationDeps = {
  useBalanceDeps,
  balanceItem,
  ApyIndicator,
  MarketPercentIndicator,
  MarketPriceIndicator,
  assetsMap: groupCurrenciesByAsset([
    {
      asset: {
        id: "ethereum",
        ticker: "ETH",
        name: "Ethereum",
        assetsIds: {
          ethereum: "ethereum",
          arbitrum: "arbitrum",
        },
        metaCurrencyId: "ethereum",
      },
      networks: [mockEthCryptoCurrency],
    },
  ]),
};

describe("createAssetConfiguration", () => {
  const store = createMockStore();
  const wrapper = createWrapper(store);

  it("should call balanceItem with correct BalanceUI objects for each asset", () => {
    renderHook(
      () =>
        createAssetConfigurationHook(assetConfigurationDeps)({
          assetsConfiguration: { rightElement: "balance" },
        })([ethereumCurrency]),
      { wrapper },
    );

    expect(balanceItem).toHaveBeenCalledTimes(1);
    expect(balanceItem).toHaveBeenNthCalledWith(1, {
      currency: ethereumCurrency,
      balance: ethereumAccountHigh.balance,
      fiatValue: ethereumAccountHigh.balance
        .shiftedBy(fiatCurrencyMagnitude - ethereumCurrencyMagnitude)
        .multipliedBy(fiatConversion)
        .toNumber(),
    });
  });

  it("should generate market trend right element with correct market trend data", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        createAssetConfigurationHook(assetConfigurationDeps)({
          assetsConfiguration: { rightElement: "marketTrend" },
        })([ethereumCurrency]),
      { wrapper },
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
        createAssetConfigurationHook(assetConfigurationDeps)({
          assetsConfiguration: { leftElement: "apy" },
        })([ethereumCurrency]),
      { wrapper },
    );

    const leftElement = current[0]?.leftElement;
    expect(React.isValidElement(leftElement)).toBe(true);
    if (React.isValidElement(leftElement)) {
      expect(leftElement.props).toEqual({
        value: 4.5,
        type: "APY",
      });
    }
  });

  it("should generate market trend left element when leftElement is 'marketTrend'", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        createAssetConfigurationHook(assetConfigurationDeps)({
          assetsConfiguration: { leftElement: "marketTrend" },
        })([ethereumCurrency]),
      { wrapper },
    );

    const leftElement = current[0]?.leftElement;
    expect(React.isValidElement(leftElement)).toBe(true);
    if (React.isValidElement(leftElement)) {
      expect(leftElement.props).toEqual({
        percent: 5.25,
      });
    }
  });

  it("should not call balanceItem when rightElement is 'marketTrend'", () => {
    balanceItem.mockClear();
    renderHook(
      () =>
        createAssetConfigurationHook(assetConfigurationDeps)({
          assetsConfiguration: { rightElement: "marketTrend" },
        })([ethereumCurrency]),
      { wrapper },
    );

    // balanceItem should not be called because rightElement is marketTrend
    expect(balanceItem).not.toHaveBeenCalled();
  });

  it("should not generate apy left element when leftElement is undefined", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        createAssetConfigurationHook(assetConfigurationDeps)({
          assetsConfiguration: { leftElement: undefined },
        })([ethereumCurrency]),
      { wrapper },
    );

    expect(current[0]?.leftElement).toBeUndefined();
  });

  it("should return basic assets when no configuration is provided", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        createAssetConfigurationHook(assetConfigurationDeps)({
          assetsConfiguration: { rightElement: "undefined", leftElement: "undefined" },
        })([ethereumCurrency]),
      { wrapper },
    );

    expect(current).toHaveLength(1);
    expect(current[0]).toEqual({
      ...ethereumCurrency,
      name: ethereumCurrency.name,
      ticker: ethereumCurrency.ticker,
      id: ethereumCurrency.id,
    });
  });
});
