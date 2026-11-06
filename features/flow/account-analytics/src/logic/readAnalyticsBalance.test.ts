import type { AnalyticsQueryContext, ReadAnalyticsPortfolio } from "../types";
import { readAnalyticsBalance, type ReadAnalyticsBalanceInput } from "./readAnalyticsBalance";
import {
  analyticsFiat,
  createMockAccount,
  createMockCountervalues,
  mockAmount,
  type MockAccount,
} from "../analyticsSources.mock";

const eth = createMockAccount("balance-eth");
const btc = createMockAccount("balance-btc", "bitcoin");
const positions = [eth, btc];
const countervalues = createMockCountervalues(positions);
const context: AnalyticsQueryContext = {
  assetId: null,
  accountId: null,
  fiatCurrencyId: analyticsFiat.ticker,
  positionIds: [eth.id, btc.id],
  period: "1m",
  metric: "balance",
};

function createReadPortfolio(positionIdsWithHistory = positions.map(position => position.id)) {
  return jest.fn<ReturnType<ReadAnalyticsPortfolio<MockAccount>>, [readonly MockAccount[], string]>(
    () => ({
      history: [
        { timestamp: 1, amount: 100 },
        { timestamp: 2, amount: 150 },
      ],
      positionIdsWithHistory,
      readVariation: (amount: number) => ({ amount: amount - 100, ratio: 0.5 }),
    }),
  );
}

function read(scope = context, overrides: Partial<ReadAnalyticsBalanceInput<MockAccount>> = {}) {
  return readAnalyticsBalance<MockAccount>(scope, {
    positions,
    countervalues,
    fiat: analyticsFiat,
    readPortfolio: createReadPortfolio(),
    ...overrides,
  });
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
    expect(readPortfolio).toHaveBeenCalledWith([eth, btc], "month");
  });

  it("should read only the priced positions when a held position has no price", () => {
    const readPortfolio = createReadPortfolio();
    read(context, { readPortfolio, countervalues: createMockCountervalues([btc]) });
    expect(readPortfolio).toHaveBeenCalledWith([btc], "month");
  });

  it("should report unavailable when every held position lacks a price", () => {
    expect(read(context, { countervalues: createMockCountervalues([]) }).status).toBe(
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
      history: [],
      positionIdsWithHistory: [eth.id, btc.id],
      readVariation: () => ({ amount: 0, ratio: null }),
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
});
