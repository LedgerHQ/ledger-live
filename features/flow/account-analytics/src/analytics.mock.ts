import type { AnalyticsBalanceData, AnalyticsCatalog, AnalyticsReadResult } from "./types";

export const analyticsCatalog: AnalyticsCatalog = {
  assets: [
    { id: "eth", name: "Ethereum", ticker: "ETH", iconId: "ethereum" },
    { id: "usdc", name: "USD Coin", ticker: "USDC", iconId: "ethereum/erc20/usdc" },
    { id: "btc", name: "Bitcoin", ticker: "BTC", iconId: "bitcoin" },
  ],
  accounts: [
    { id: "eth-account", name: "Savings", networkName: "Ethereum", address: "0x123" },
    { id: "tron-account", name: "Savings", networkName: "Tron", address: "T123" },
    { id: "btc-account", name: "Savings", networkName: "Bitcoin", address: "bc123" },
  ],
  positions: [
    { positionId: "eth-native", accountId: "eth-account", currencyId: "ethereum", assetId: "eth" },
    {
      positionId: "eth-usdc",
      accountId: "eth-account",
      currencyId: "ethereum/erc20/usdc",
      assetId: "usdc",
    },
    {
      positionId: "tron-usdc",
      accountId: "tron-account",
      currencyId: "tron/trc20/usdc",
      assetId: "usdc",
    },
    { positionId: "btc-native", accountId: "btc-account", currencyId: "bitcoin", assetId: "btc" },
  ],
};

export function readyBalance(amount = 100): AnalyticsReadResult<AnalyticsBalanceData> {
  return {
    status: "ready",
    data: { amount, variation: { amount: 0, ratio: 0 }, history: [{ timestamp: 1000, amount }] },
  };
}

export function deferred<Value>() {
  let resolve!: (value: Value) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<Value>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}
