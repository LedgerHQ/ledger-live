import { PAY_CARD_BALANCE_FILTER_ALL } from "../state";
import type { Unit } from "@domain/entity-currency-unit";
import { buildBalanceData, type BuildBalanceDataParams } from "../logic/buildBalanceData";
import type { DefaultStablecoin, StablecoinItem } from "../logic/buildBalanceFilterOptions";
import type { FormattedValue } from "../types";

const USDC: DefaultStablecoin = {
  id: "ethereum/erc20/usd__coin",
  ticker: "USDC",
  name: "USD Coin",
  magnitude: 6,
};

const USDT: DefaultStablecoin = {
  id: "ethereum/erc20/usd_tether__erc20_",
  ticker: "USDT",
  name: "Tether USD",
  magnitude: 6,
};

function makeItem(id: string, ticker: string, name: string, value: number): StablecoinItem {
  return {
    currency: { id, name, ticker, units: [{ name, code: ticker, magnitude: 6 }] },
    balance: value * 1_000_000,
    value,
  };
}

const formatFiat = (value: number): string => `$${value.toFixed(2)}`;
const formatCrypto = (unit: Unit, balance: number): string =>
  `${(balance / 10 ** unit.magnitude).toFixed(2)} ${unit.code}`;
const formatCountervalue = (): FormattedValue => ({}) as unknown as FormattedValue;
const onConfirmFilter = jest.fn();

function build(overrides: Partial<BuildBalanceDataParams> = {}) {
  return buildBalanceData({
    stablecoins: [],
    defaultStablecoins: [USDC, USDT],
    filter: PAY_CARD_BALANCE_FILTER_ALL,
    isLoading: false,
    isError: false,
    allLabel: "All stablecoins",
    formatFiat,
    formatCrypto,
    formatCountervalue,
    onConfirmFilter,
    ...overrides,
  });
}

describe("buildBalanceData", () => {
  it("should sum every stablecoin countervalue when the filter is all", () => {
    const { data } = build({
      stablecoins: [
        makeItem("ethereum/erc20/usd__coin", "USDC", "USD Coin", 1000),
        makeItem("ethereum/erc20/usd_tether__erc20_", "USDT", "Tether USD", 250.5),
      ],
    });

    expect(data.stableBalance).toBe(1250.5);
    expect(data.filter).toBe(PAY_CARD_BALANCE_FILTER_ALL);
    expect(data.hasBalance).toBe(true);
  });

  it("should sum by ticker when the held currencyId differs from the option market id", () => {
    const { data } = build({
      stablecoins: [makeItem("solana/token/usdc", "USDC", "USD Coin", 1000)],
      filter: USDC.id,
    });

    expect(data.filter).toBe(USDC.id);
    expect(data.stableBalance).toBe(1000);
  });

  it("should heal a stale persisted filter once data is ready", () => {
    const { data, shouldResetFilter } = build({
      stablecoins: [makeItem("ethereum/erc20/usd__coin", "USDC", "USD Coin", 1000)],
      filter: "ethereum/erc20/gone",
    });

    expect(data.filter).toBe(PAY_CARD_BALANCE_FILTER_ALL);
    expect(shouldResetFilter).toBe(true);
  });

  it("should not reset the filter while data is loading", () => {
    const { shouldResetFilter } = build({ filter: "ethereum/erc20/gone", isLoading: true });

    expect(shouldResetFilter).toBe(false);
  });

  it("should not reset the filter when it resolves to the persisted value", () => {
    const { shouldResetFilter } = build({
      stablecoins: [makeItem("ethereum/erc20/usd__coin", "USDC", "USD Coin", 1000)],
      filter: USDC.id,
    });

    expect(shouldResetFilter).toBe(false);
  });

  it("should report a balance when a held stablecoin has a crypto amount and no countervalue", () => {
    const { data } = build({
      stablecoins: [
        {
          currency: {
            id: "ethereum/erc20/usd__coin",
            name: "USD Coin",
            ticker: "USDC",
            units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
          },
          balance: 1_000_000,
          value: 0,
        },
      ],
    });

    expect(data.hasBalance).toBe(true);
  });

  it("should always expose the all option first, followed by the defaults", () => {
    const { data } = build();

    expect(data.filterOptions[0].id).toBe(PAY_CARD_BALANCE_FILTER_ALL);
    expect(data.filterOptions.map(option => option.id)).toEqual(
      expect.arrayContaining([USDC.id, USDT.id]),
    );
  });
});
