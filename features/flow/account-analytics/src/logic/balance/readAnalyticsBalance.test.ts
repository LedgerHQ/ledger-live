import type { AnalyticsQueryContext, ReadAnalyticsPortfolio } from "../../types";
import { readAnalyticsBalance } from "./readAnalyticsBalance";
import {
  analyticsFiat,
  createAnalyticsAccount,
  createAnalyticsCountervalues,
  mockAmount,
  type MockAccount,
} from "../../analyticsSources.mock";

const eth = createAnalyticsAccount("balance-eth");
const btc = createAnalyticsAccount("balance-btc", "bitcoin");
const positions = [eth, btc];
const countervalues = createAnalyticsCountervalues(positions);
const context: AnalyticsQueryContext = {
  assetId: null,
  accountId: null,
  fiatCurrencyId: analyticsFiat.ticker,
  positionIds: [eth.id, btc.id],
  period: "1m",
  metric: "balance",
};

function createReadPortfolio(positionIdsWithHistory = positions.map(position => position.id)) {
  return jest.fn<
    ReturnType<ReadAnalyticsPortfolio<MockAccount>>,
    Parameters<ReadAnalyticsPortfolio<MockAccount>>
  >(() => ({
    balanceHistory: [
      { date: new Date(1), value: 100 },
      { date: new Date(2), value: 150 },
    ],
    availableAccounts: positionIdsWithHistory.map(id => ({ id })),
    readVariation: (currentBalance: number) => ({ value: currentBalance - 100, percentage: 0.5 }),
  }));
}

type ReadInput = Readonly<{
  positions: readonly MockAccount[];
  countervalues: ReturnType<typeof createAnalyticsCountervalues>;
  readPortfolio: ReadAnalyticsPortfolio<MockAccount>;
}>;

function read(scope = context, overrides: Partial<ReadInput> = {}) {
  const input: ReadInput = {
    positions,
    countervalues,
    readPortfolio: createReadPortfolio(),
    ...overrides,
  };
  return readAnalyticsBalance(
    scope,
    input.positions,
    input.countervalues,
    analyticsFiat,
    input.readPortfolio,
  );
}

describe("readAnalyticsBalance", () => {
  it("should read the selected positions over the portfolio range of the period", () => {
    const readPortfolio = createReadPortfolio();
    expect(read(context, { readPortfolio })).toEqual({
      status: "ready",
      data: {
        amount: 150,
        variation: { amount: 50, ratio: 0.5 },
        history: [
          { timestamp: 1, amount: 100 },
          { timestamp: 2, amount: 150 },
        ],
      },
    });
    expect(readPortfolio).toHaveBeenCalledWith([eth, btc], "month", countervalues, analyticsFiat);
  });

  it("should read only the priced positions when a held position has no price", () => {
    const readPortfolio = createReadPortfolio();
    read(context, { readPortfolio, countervalues: createAnalyticsCountervalues([btc]) });
    expect(readPortfolio).toHaveBeenCalledWith([btc], "month", expect.anything(), analyticsFiat);
  });

  it("should report unavailable when every held position lacks a price", () => {
    expect(read(context, { countervalues: createAnalyticsCountervalues([]) }).status).toBe(
      "unavailable",
    );
  });

  it("should report unavailable when a held position has no balance history", () => {
    expect(read(context, { readPortfolio: createReadPortfolio([btc.id]) }).status).toBe(
      "unavailable",
    );
  });

  it("should accept an empty position without history", () => {
    const empty = { ...eth, balance: mockAmount(0) };
    expect(
      read(context, { positions: [empty, btc], readPortfolio: createReadPortfolio([btc.id]) })
        .status,
    ).toBe("ready");
  });

  it("should read a zero amount from an empty history", () => {
    const readPortfolio = jest.fn(() => ({
      balanceHistory: [],
      availableAccounts: [{ id: eth.id }, { id: btc.id }],
      readVariation: () => ({ value: 0, percentage: null }),
    }));
    const result = read(context, { readPortfolio });
    expect(result).toEqual({
      status: "ready",
      data: { amount: 0, variation: { amount: 0, ratio: null }, history: [] },
    });
  });

  it("should report unavailable for a removed position", () => {
    expect(read({ ...context, positionIds: ["removed"] }).status).toBe("unavailable");
  });

  it("should reject an unsupported metric or another fiat", () => {
    expect(read({ ...context, metric: "total-return" }).status).toBe("unavailable");
    expect(
      read({ ...context, fiatCurrencyId: "EUR" as AnalyticsQueryContext["fiatCurrencyId"] }).status,
    ).toBe("unavailable");
  });

  it.each([
    ["1d", "day"],
    ["1w", "week"],
    ["1y", "year"],
    ["all", "all"],
  ] as const)("should read the %s period over the %s portfolio range", (period, range) => {
    const readPortfolio = createReadPortfolio();
    read({ ...context, period }, { readPortfolio });
    expect(readPortfolio).toHaveBeenCalledWith(positions, range, countervalues, analyticsFiat);
  });
});
