import React, { type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import {
  mockCryptoCurrency,
  mockEthereumCurrency,
} from "@domain/entity-currency-crypto/schema.mock";
import { AssetsTablePortsProvider } from "./assetsTablePorts";
import { mockAssetsTablePorts } from "./testing/mockAssetsTablePorts";
import type { AssetTableItem, AssetTrendRange } from "./types";
import { useAllCurrencyTrends } from "./useAllCurrencyTrends";
import type { CurrencyPortfolioSnapshot } from "./ports";

const bitcoin = mockCryptoCurrency();
const ethereum = mockEthereumCurrency();
const cardano = mockCryptoCurrency({
  id: CryptoCurrencyIdSchema.parse("cardano"),
  name: "Cardano",
  ticker: "ADA",
});
const solana = mockCryptoCurrency({
  id: CryptoCurrencyIdSchema.parse("solana"),
  name: "Solana",
  ticker: "SOL",
});

function makePortfolio(
  percentage?: number,
  points: Array<{ value: number; countervalue: number }> = [],
): CurrencyPortfolioSnapshot {
  return {
    history: points.map(point => ({ ...point })),
    countervalueChange: { percentage, value: 0 },
  };
}

function makeAssetItem(overrides: Partial<AssetTableItem> = {}): AssetTableItem {
  return {
    currency: bitcoin,
    balance: 1,
    value: 100,
    distribution: 1,
    accounts: [{ id: "account" }],
    isPlaceholder: false,
    ...overrides,
  };
}

function renderTrends(
  items: readonly AssetTableItem[],
  range: AssetTrendRange,
  marketDayChangeByCurrencyId?: ReadonlyMap<string, number>,
  ports = mockAssetsTablePorts(),
) {
  return {
    ports,
    ...renderHook(() => useAllCurrencyTrends(items, range, marketDayChangeByCurrencyId), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AssetsTablePortsProvider value={ports}>{children}</AssetsTablePortsProvider>
      ),
    }),
  };
}

describe("useAllCurrencyTrends", () => {
  it("computes trends for real items and skips placeholders and empty accounts", () => {
    const bitcoinAccounts = [{ id: "btc" }];
    const ethereumAccounts = [{ id: "eth" }];
    const getCurrencyPortfolio = jest
      .fn()
      .mockReturnValueOnce(makePortfolio(12.34))
      .mockReturnValueOnce(makePortfolio(-5.67));
    const ports = mockAssetsTablePorts({ getCurrencyPortfolio });

    const { result } = renderTrends(
      [
        makeAssetItem({ accounts: bitcoinAccounts }),
        makeAssetItem({ currency: ethereum, accounts: ethereumAccounts }),
        makeAssetItem({ currency: cardano, isPlaceholder: true, accounts: [] }),
        makeAssetItem({ currency: solana, accounts: [] }),
      ],
      "week",
      undefined,
      ports,
    );

    expect(getCurrencyPortfolio).toHaveBeenCalledTimes(2);
    expect(getCurrencyPortfolio).toHaveBeenNthCalledWith(1, bitcoinAccounts, "week");
    expect(getCurrencyPortfolio).toHaveBeenNthCalledWith(2, ethereumAccounts, "week");
    expect(result.current.get(bitcoin.id)).toBe(12.34);
    expect(result.current.get(ethereum.id)).toBe(-5.67);
    expect(result.current.get(cardano.id)).toBeNull();
    expect(result.current.get(solana.id)).toBeNull();
  });

  it("returns null when both the portfolio change and the balance fallback are unavailable", () => {
    const getCurrencyPortfolio = jest.fn().mockReturnValueOnce(makePortfolio(undefined));
    const getCurrentBalanceCountervalueChange = jest.fn().mockReturnValueOnce({ percentage: null });
    const ports = mockAssetsTablePorts({
      getCurrencyPortfolio,
      getCurrentBalanceCountervalueChange,
    });

    const { result } = renderTrends(
      [makeAssetItem({ accounts: [{ id: "btc" }] })],
      "month",
      undefined,
      ports,
    );

    expect(result.current.get(bitcoin.id)).toBeNull();
  });

  it("falls back to the current-balance price change when the portfolio change is unavailable", () => {
    const bitcoinAccounts = [{ id: "btc" }];
    const getCurrencyPortfolio = jest.fn().mockReturnValueOnce(makePortfolio(undefined));
    const getCurrentBalanceCountervalueChange = jest.fn().mockReturnValueOnce({ percentage: 3.21 });
    const ports = mockAssetsTablePorts({
      getCurrencyPortfolio,
      getCurrentBalanceCountervalueChange,
    });

    const { result } = renderTrends(
      [makeAssetItem({ accounts: bitcoinAccounts })],
      "day",
      undefined,
      ports,
    );

    expect(getCurrentBalanceCountervalueChange).toHaveBeenCalledWith(bitcoinAccounts, "day");
    expect(result.current.get(bitcoin.id)).toBe(3.21);
  });

  it("returns zero for a zero-value asset without reading the portfolio", () => {
    const getCurrencyPortfolio = jest.fn();
    const getCurrentBalanceCountervalueChange = jest.fn();
    const ports = mockAssetsTablePorts({
      getCurrencyPortfolio,
      getCurrentBalanceCountervalueChange,
    });

    const { result } = renderTrends(
      [makeAssetItem({ accounts: [{ id: "btc" }], balance: 100, value: 0 })],
      "day",
      undefined,
      ports,
    );

    expect(getCurrencyPortfolio).not.toHaveBeenCalled();
    expect(getCurrentBalanceCountervalueChange).not.toHaveBeenCalled();
    expect(result.current.get(bitcoin.id)).toBe(0);
  });

  it("does not use the balance fallback when the portfolio change is available", () => {
    const getCurrencyPortfolio = jest.fn().mockReturnValueOnce(makePortfolio(7.89));
    const getCurrentBalanceCountervalueChange = jest.fn();
    const ports = mockAssetsTablePorts({
      getCurrencyPortfolio,
      getCurrentBalanceCountervalueChange,
    });

    const { result } = renderTrends(
      [makeAssetItem({ accounts: [{ id: "btc" }] })],
      "day",
      undefined,
      ports,
    );

    expect(getCurrentBalanceCountervalueChange).not.toHaveBeenCalled();
    expect(result.current.get(bitcoin.id)).toBe(7.89);
  });

  it("uses the market 24h ratio when the day balance is unchanged", () => {
    const getCurrencyPortfolio = jest.fn().mockReturnValueOnce(
      makePortfolio(0.02, [
        { value: 1, countervalue: 100 },
        { value: 1, countervalue: 110 },
      ]),
    );
    const getCurrentBalanceCountervalueChange = jest.fn();
    const ports = mockAssetsTablePorts({
      getCurrencyPortfolio,
      getCurrentBalanceCountervalueChange,
    });

    const { result } = renderTrends(
      [makeAssetItem({ accounts: [{ id: "btc" }] })],
      "day",
      new Map([[bitcoin.id, 10]]),
      ports,
    );

    expect(result.current.get(bitcoin.id)).toBe(0.1);
    expect(getCurrentBalanceCountervalueChange).not.toHaveBeenCalled();
  });

  it("keeps the portfolio ratio when the day balance changes", () => {
    const getCurrencyPortfolio = jest.fn().mockReturnValueOnce(
      makePortfolio(0.02, [
        { value: 1, countervalue: 100 },
        { value: 2, countervalue: 110 },
      ]),
    );
    const ports = mockAssetsTablePorts({ getCurrencyPortfolio });

    const { result } = renderTrends(
      [makeAssetItem({ accounts: [{ id: "btc" }] })],
      "day",
      new Map([[bitcoin.id, 10]]),
      ports,
    );

    expect(result.current.get(bitcoin.id)).toBe(0.02);
  });

  it("keeps the balance fallback when the market 24h change is missing", () => {
    const getCurrencyPortfolio = jest.fn().mockReturnValueOnce(
      makePortfolio(undefined, [
        { value: 1, countervalue: 100 },
        { value: 1, countervalue: 110 },
      ]),
    );
    const getCurrentBalanceCountervalueChange = jest.fn().mockReturnValueOnce({ percentage: 3.21 });
    const ports = mockAssetsTablePorts({
      getCurrencyPortfolio,
      getCurrentBalanceCountervalueChange,
    });

    const { result } = renderTrends(
      [makeAssetItem({ accounts: [{ id: "btc" }] })],
      "day",
      undefined,
      ports,
    );

    expect(result.current.get(bitcoin.id)).toBe(3.21);
  });
});
