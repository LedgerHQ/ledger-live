import { PAY_CARD_BALANCE_FILTER_ALL } from "../state";
import { aggregateBalance } from "../logic/aggregateBalance";
import type { FormattedValue, PortfolioPort } from "../types";

const formatCountervalue = (): FormattedValue => ({}) as unknown as FormattedValue;
const onConfirmFilter = jest.fn();
const filterOptions = [
  {
    id: PAY_CARD_BALANCE_FILTER_ALL,
    title: "All stablecoins",
    countervalue: 0,
    countervalueLabel: "$0.00",
  },
] as const;
const filterOptionsWithStablecoins = [
  ...filterOptions,
  {
    id: "ethereum/erc20/usdc",
    title: "USD Coin",
    ticker: "USDC",
    ledgerId: "ethereum/erc20/usdc",
    countervalue: 1000,
    countervalueLabel: "$1,000.00",
    cryptoAmountLabel: "1,000.00 USDC",
  },
  {
    id: "ethereum/erc20/usdt",
    title: "Tether USD",
    ticker: "USDT",
    ledgerId: "ethereum/erc20/usdt",
    countervalue: 250.5,
    countervalueLabel: "$250.50",
    cryptoAmountLabel: "250.50 USDT",
  },
] as const;

function buildPort(overrides: Partial<PortfolioPort> = {}): PortfolioPort {
  return {
    stablecoins: [],
    filter: PAY_CARD_BALANCE_FILTER_ALL,
    isLoading: false,
    isError: false,
    filterOptions,
    formatCountervalue,
    onConfirmFilter,
    ...overrides,
  };
}

const usdc = {
  currency: { id: "ethereum/erc20/usdc", ticker: "USDC" },
  value: 1000,
  balance: 1_000_000,
};
const usdt = {
  currency: { id: "ethereum/erc20/usdt", ticker: "USDT" },
  value: 250.5,
  balance: 250_500,
};

describe("aggregateBalance", () => {
  it("should sum every stablecoin countervalue when the filter is all", () => {
    const data = aggregateBalance(buildPort({ stablecoins: [usdc, usdt] }));

    expect(data.stableBalance).toBe(1250.5);
    expect(data.hasBalance).toBe(true);
    expect(data.status).toBe("ready");
    expect(data.filter).toBe("all");
  });

  it("should sum only the matching stablecoin when the filter is a currencyId", () => {
    const data = aggregateBalance(
      buildPort({
        stablecoins: [usdc, usdt],
        filter: "ethereum/erc20/usdc",
        filterOptions: filterOptionsWithStablecoins,
      }),
    );

    expect(data.stableBalance).toBe(1000);
    expect(data.filter).toBe("ethereum/erc20/usdc");
  });

  it("should fall back to all when the persisted filter is no longer available", () => {
    const data = aggregateBalance(
      buildPort({
        stablecoins: [usdc, usdt],
        filter: "ethereum/erc20/dai",
        filterOptions: filterOptionsWithStablecoins,
      }),
    );

    expect(data.stableBalance).toBe(1250.5);
    expect(data.filter).toBe(PAY_CARD_BALANCE_FILTER_ALL);
  });

  it("should report loading while the portfolio is loading", () => {
    const data = aggregateBalance(buildPort({ stablecoins: [usdc], isLoading: true }));

    expect(data.status).toBe("loading");
  });

  it("should report error when the portfolio errors, regardless of loading", () => {
    const data = aggregateBalance(
      buildPort({ stablecoins: [usdc], isLoading: true, isError: true }),
    );

    expect(data.status).toBe("error");
  });

  it("should report a balance when a holding has a crypto amount and no countervalue", () => {
    const data = aggregateBalance(
      buildPort({
        stablecoins: [
          { currency: { id: "ethereum/erc20/usdc", ticker: "USDC" }, value: 0, balance: 1_000_000 },
        ],
      }),
    );

    expect(data.hasBalance).toBe(true);
    expect(data.stableBalance).toBe(0);
  });

  it("should stay empty when every holding is zero", () => {
    const data = aggregateBalance(
      buildPort({
        stablecoins: [
          { currency: { id: "ethereum/erc20/usdc", ticker: "USDC" }, value: 0, balance: 0 },
        ],
      }),
    );

    expect(data.hasBalance).toBe(false);
  });

  it("should keep hasBalance from all holdings, not the active filter", () => {
    const data = aggregateBalance(
      buildPort({
        stablecoins: [usdc, { ...usdt, value: 0, balance: 0 }],
        filter: "ethereum/erc20/usdt",
        filterOptions: filterOptionsWithStablecoins,
      }),
    );

    expect(data.stableBalance).toBe(0);
    expect(data.hasBalance).toBe(true);
  });

  it("should forward the countervalue formatter untouched", () => {
    const data = aggregateBalance(buildPort());

    expect(data.formatCountervalue).toBe(formatCountervalue);
  });

  it("should forward filterOptions and onConfirmFilter", () => {
    const data = aggregateBalance(buildPort());

    expect(data.filterOptions).toBe(filterOptions);
    expect(data.onConfirmFilter).toBe(onConfirmFilter);
  });
});
