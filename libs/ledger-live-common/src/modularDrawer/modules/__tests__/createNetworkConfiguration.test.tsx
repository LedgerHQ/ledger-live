/**
 * @jest-environment jsdom
 */

import React from "react";
import { renderHook } from "@testing-library/react";
import { BigNumber } from "bignumber.js";
import { genAccount } from "@ledgerhq/coin-framework/lib/mocks/account";
import { createFixtureCryptoCurrency } from "../../../mock/fixtures/cryptoCurrencies";
import { createNetworkConfigurationHook } from "../createNetworkConfiguration";
import {
  createEthereumSetup,
  createUseBalanceDeps,
  createMockStore,
  createWrapper,
} from "../../test-helpers";

const { ethereumCurrency, ethereumAccountHigh } = createEthereumSetup();
const useBalanceDeps = createUseBalanceDeps(ethereumAccountHigh);

const accountsCount = jest.fn(() => React.createElement("div"));
const accountsCountAndApy = jest.fn(() => React.createElement("div"));
const accountsApy = jest.fn(() => React.createElement("div"));
const balanceItem = jest.fn(() => React.createElement("div"));

const useAccountData = jest.fn(() => [
  {
    asset: ethereumCurrency,
    label: "1 account",
    count: 1,
  },
]);

const networkConfigurationDeps = {
  useBalanceDeps,
  balanceItem,
  accountsCount,
  accountsCountAndApy,
  accountsApy,
  useAccountData,
};

describe("createNetworkConfiguration", () => {
  const store = createMockStore();
  const wrapper = createWrapper(store);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call balanceItem with correct balance data for each network", () => {
    renderHook(
      () =>
        createNetworkConfigurationHook(networkConfigurationDeps)({
          networksConfig: { rightElement: "balance" },
        })([ethereumCurrency]),
      { wrapper },
    );

    expect(balanceItem).toHaveBeenCalledTimes(1);
    expect(balanceItem).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: ethereumCurrency,
        balance: expect.any(BigNumber),
      }),
    );
  });

  it("should call accountsCount when leftElement is 'numberOfAccounts'", () => {
    renderHook(
      () =>
        createNetworkConfigurationHook(networkConfigurationDeps)({
          networksConfig: { leftElement: "numberOfAccounts" },
        })([ethereumCurrency]),
      { wrapper },
    );

    expect(accountsCount).toHaveBeenCalledTimes(1);
    expect(accountsCount).toHaveBeenCalledWith({ label: "1 account" });
  });

  it("should call accountsCountAndApy when leftElement is 'numberOfAccountsAndApy'", () => {
    renderHook(
      () =>
        createNetworkConfigurationHook(networkConfigurationDeps)({
          networksConfig: { leftElement: "numberOfAccountsAndApy" },
        })([ethereumCurrency]),
      { wrapper },
    );

    expect(accountsCountAndApy).toHaveBeenCalled();
  });

  it("should not call balanceItem when rightElement is 'undefined'", () => {
    balanceItem.mockClear();
    renderHook(
      () =>
        createNetworkConfigurationHook(networkConfigurationDeps)({
          networksConfig: { rightElement: "undefined" },
        })([ethereumCurrency]),
      { wrapper },
    );

    expect(balanceItem).not.toHaveBeenCalled();
  });

  it("should not call accountsCount when leftElement is 'undefined'", () => {
    accountsCount.mockClear();
    renderHook(
      () =>
        createNetworkConfigurationHook(networkConfigurationDeps)({
          networksConfig: { leftElement: "undefined" },
        })([ethereumCurrency]),
      { wrapper },
    );

    expect(accountsCount).not.toHaveBeenCalled();
  });

  it("should sort networks by balance when rightElement is 'balance'", () => {
    const bitcoin = createFixtureCryptoCurrency("bitcoin");
    bitcoin.id = "bitcoin";
    const bitcoinAccount = genAccount("bitcoin-account", { currency: bitcoin });
    bitcoinAccount.balance = new BigNumber("500000000"); // Less than ethereum

    useAccountData.mockReturnValueOnce([
      {
        asset: ethereumCurrency,
        label: "1 account",
        count: 1,
      },
      {
        asset: bitcoin,
        label: "1 account",
        count: 1,
      },
    ]);

    const {
      result: { current },
    } = renderHook(
      () =>
        createNetworkConfigurationHook({
          ...networkConfigurationDeps,
          useBalanceDeps: () => ({
            ...useBalanceDeps(),
            flattenedAccounts: [ethereumAccountHigh, bitcoinAccount],
          }),
        })({
          networksConfig: { rightElement: "balance" },
        })([ethereumCurrency, bitcoin]),
      { wrapper },
    );

    // Should be sorted by balance descending (ethereum has more balance)
    expect(current).toHaveLength(2);
    expect(current[0].id).toBe("ethereum");
    expect(current[1].id).toBe("bitcoin");
  });
});
