/**
 * @jest-environment jsdom
 */

import React from "react";
import { renderHook } from "@testing-library/react";
import { BigNumber } from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "../../__mocks__/currencies.mock";
import {
  useNetworkConfiguration,
  sortNetworks,
  NetworksWithComponents,
} from "../createNetworkConfiguration";
import {
  ethereumCurrency,
  bitcoinCurrency,
  createBalanceDeps,
  ETH_FIAT_CONVERSION,
  BTC_FIAT_CONVERSION,
  TestWrapper,
} from "./fixtures";

const ethAccount = genAccount("eth-network-test", { currency: ethereumCurrency });
ethAccount.balance = new BigNumber("5000000000000000000"); // 5 ETH
ethAccount.spendableBalance = ethAccount.balance;

const btcAccount = genAccount("btc-network-test", { currency: bitcoinCurrency });
btcAccount.balance = new BigNumber("100000000"); // 1 BTC
btcAccount.spendableBalance = btcAccount.balance;

const useBalanceDeps = () =>
  createBalanceDeps([ethAccount, btcAccount], {
    "USD ethereum": ETH_FIAT_CONVERSION,
    "USD bitcoin": BTC_FIAT_CONVERSION,
  });

const balanceItem = jest.fn(() => null);
const accountsCount = jest.fn(({ label }: { label: string }) => `Count: ${label}`);
const accountsCountAndApy = jest.fn(
  ({ label, value, type }: { label?: string; value?: number; type?: string }) => {
    if (!value && !label) return undefined;
    return React.createElement("span", null, `${label || ""} APY: ${value}% ${type}`);
  },
);
const ApyIndicator = ({ value, type }: { value: number; type: string }) =>
  React.createElement("span", null, `APY: ${value}% ${type}`);

const useAccountData = jest.fn(
  (params: { networks: import("@ledgerhq/types-cryptoassets").CryptoOrTokenCurrency[] }) =>
    params.networks.map(n => ({
      asset: n,
      label: `${n.name} (${n.ticker})`,
      count: n.id === "ethereum" ? 3 : n.id === "bitcoin" ? 1 : 0,
    })),
);

const baseOptions = {
  useAccountData,
  accountsCount,
  accountsCountAndApy,
  ApyIndicator,
  useBalanceDeps,
  balanceItem,
};

const makeNetworkEntry = (
  currency: typeof ethereumCurrency,
  count: number,
  fiatValue: number,
  balanceValue: string = fiatValue > 0 ? "1" : "0",
): NetworksWithComponents => ({
  ...currency,
  count,
  balanceData: {
    currency,
    balance: new BigNumber(balanceValue),
    fiatValue,
  },
});

describe("sortNetworks", () => {
  it("should sort by count descending when leftElement is 'numberOfAccounts'", () => {
    const low = makeNetworkEntry(bitcoinCurrency, 1, 0);
    const high = makeNetworkEntry(ethereumCurrency, 5, 0);
    const result = sortNetworks([low, high], "numberOfAccounts", "undefined");
    expect(result[0].id).toBe("ethereum");
    expect(result[1].id).toBe("bitcoin");
  });

  it("should sort by count descending when leftElement is 'numberOfAccountsAndApy'", () => {
    const low = makeNetworkEntry(bitcoinCurrency, 1, 0);
    const high = makeNetworkEntry(ethereumCurrency, 5, 0);
    const result = sortNetworks([low, high], "numberOfAccountsAndApy", "undefined");
    expect(result[0].id).toBe("ethereum");
    expect(result[1].id).toBe("bitcoin");
  });

  it("should sort by balance descending when rightElement is 'balance'", () => {
    const low = makeNetworkEntry(ethereumCurrency, 0, 100);
    const high = makeNetworkEntry(bitcoinCurrency, 0, 5000);
    const result = sortNetworks([low, high], "undefined", "balance");
    expect(result[0].id).toBe("bitcoin");
    expect(result[1].id).toBe("ethereum");
  });

  it("should apply balance sort last when both sorts apply", () => {
    const ethEntry = makeNetworkEntry(ethereumCurrency, 5, 100);
    const btcEntry = makeNetworkEntry(bitcoinCurrency, 1, 5000);
    const result = sortNetworks([ethEntry, btcEntry], "numberOfAccounts", "balance");
    expect(result[0].id).toBe("bitcoin");
    expect(result[1].id).toBe("ethereum");
  });

  it("should not sort when both leftElement and rightElement are 'undefined' (string)", () => {
    const ethEntry = makeNetworkEntry(ethereumCurrency, 5, 100);
    const btcEntry = makeNetworkEntry(bitcoinCurrency, 1, 5000);
    const result = sortNetworks([ethEntry, btcEntry], "undefined", "undefined");
    expect(result[0].id).toBe("ethereum");
    expect(result[1].id).toBe("bitcoin");
  });

  it("should not mutate the input array", () => {
    const low = makeNetworkEntry(bitcoinCurrency, 1, 100);
    const high = makeNetworkEntry(ethereumCurrency, 5, 5000);
    const input = [low, high];
    const result = sortNetworks(input, "numberOfAccounts", "undefined");
    expect(result).not.toBe(input);
    expect(input[0].id).toBe("bitcoin");
    expect(input[1].id).toBe("ethereum");
  });

  it("should place networks with balance before those without", () => {
    const noBalance = makeNetworkEntry(bitcoinCurrency, 0, 0, "0");
    const withBalance = makeNetworkEntry(ethereumCurrency, 0, 100, "1");
    const result = sortNetworks([noBalance, withBalance], "undefined", "balance");
    expect(result[0].id).toBe("ethereum");
    expect(result[1].id).toBe("bitcoin");
  });
});

describe("useNetworkConfiguration", () => {
  beforeEach(() => {
    balanceItem.mockClear();
    accountsCount.mockClear();
    accountsCountAndApy.mockClear();
    useAccountData.mockClear();
  });

  it("should return networks with numberOfAccounts and balance by default", () => {
    const {
      result: { current },
    } = renderHook(() => useNetworkConfiguration([ethereumCurrency], baseOptions), {
      wrapper: TestWrapper,
    });

    expect(current).toHaveLength(1);
    expect(current[0]).toHaveProperty("leftElement");
    expect(current[0]).toHaveProperty("rightElement");
    expect(current[0].count).toBe(3);
    expect(accountsCount).toHaveBeenCalledWith({ label: "Ethereum (ETH)" });
    expect(balanceItem).toHaveBeenCalled();
  });

  it("should merge APY data when leftElement is 'numberOfAccountsAndApy'", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        useNetworkConfiguration([ethereumCurrency], {
          ...baseOptions,
          leftElement: "numberOfAccountsAndApy",
        }),
      { wrapper: TestWrapper },
    );

    expect(current).toHaveLength(1);
    expect(current[0]).toHaveProperty("leftElement");
    expect(accountsCountAndApy).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Ethereum (ETH)",
        value: 4.5,
        type: "APY",
      }),
    );
  });

  it("should not include rightElement when rightElement is 'undefined'", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        useNetworkConfiguration([ethereumCurrency], {
          ...baseOptions,
          rightElement: "undefined",
        }),
      { wrapper: TestWrapper },
    );

    expect(current[0].rightElement).toBeUndefined();
    expect(current[0]).toHaveProperty("leftElement");
  });

  it("should not include leftElement when leftElement is 'undefined'", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        useNetworkConfiguration([ethereumCurrency], {
          ...baseOptions,
          leftElement: "undefined",
        }),
      { wrapper: TestWrapper },
    );

    expect(current[0].leftElement).toBeUndefined();
    expect(current[0].count).toBeUndefined();
    expect(current[0]).toHaveProperty("rightElement");
  });

  it("should sort networks by count descending", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        useNetworkConfiguration([bitcoinCurrency, ethereumCurrency], {
          ...baseOptions,
          rightElement: "undefined",
        }),
      { wrapper: TestWrapper },
    );

    expect(current).toHaveLength(2);
    expect(current[0].id).toBe("ethereum");
    expect(current[0].count).toBe(3);
    expect(current[1].id).toBe("bitcoin");
    expect(current[1].count).toBe(1);
  });

  it("should return an empty array when no networks are provided", () => {
    const {
      result: { current },
    } = renderHook(() => useNetworkConfiguration([], baseOptions), {
      wrapper: TestWrapper,
    });

    expect(current).toEqual([]);
  });

  it("should use parentCurrency as base when input is a TokenCurrency", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        useNetworkConfiguration([usdcToken], {
          ...baseOptions,
          rightElement: "undefined",
          leftElement: "undefined",
        }),
      { wrapper: TestWrapper },
    );

    expect(current).toHaveLength(1);
    expect(current[0].id).toBe("ethereum");
    expect(current[0].type).toBe("CryptoCurrency");
  });

  it("should sort networks by balance descending when both sorts apply", () => {
    const {
      result: { current },
    } = renderHook(
      () => useNetworkConfiguration([ethereumCurrency, bitcoinCurrency], baseOptions),
      { wrapper: TestWrapper },
    );

    expect(current).toHaveLength(2);
    expect(current[0].id).toBe("bitcoin");
    expect(current[1].id).toBe("ethereum");
  });
});
