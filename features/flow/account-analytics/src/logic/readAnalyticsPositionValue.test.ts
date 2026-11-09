import BigNumber from "bignumber.js";
import { buildMultiCV } from "@domain/entity-market-countervalues/mock";
import { readAnalyticsPositionValue } from "../readAnalyticsPositionValue";
import {
  analyticsFiat,
  createAnalyticsAccount,
  createAnalyticsCountervalues,
} from "../../__fixtures__/analyticsFixtures";

const eth = createAnalyticsAccount("analytics-value-eth");

describe("readAnalyticsPositionValue", () => {
  it("should value a held position at its latest price", () => {
    expect(
      readAnalyticsPositionValue(eth, createAnalyticsCountervalues([eth]), analyticsFiat),
    ).toBe(20000);
  });

  it("should report a held position without a price as unpriced", () => {
    expect(readAnalyticsPositionValue(eth, buildMultiCV([]), analyticsFiat)).toBeNull();
  });

  it("should value a zero balance at zero without requiring its price", () => {
    const empty = { ...eth, balance: new BigNumber(0) };
    expect(readAnalyticsPositionValue(empty, buildMultiCV([]), analyticsFiat)).toBe(0);
  });
});
