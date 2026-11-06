import { buildMultiCV } from "@domain/entity-market-countervalues/mock";
import { readAnalyticsPositionValue } from "./readAnalyticsPositionValue";
import {
  analyticsFiat,
  createMockAccount,
  createMockCountervalues,
  createMockToken,
  mockAmount,
} from "../analyticsSources.mock";

const eth = createMockAccount("value-eth");
const fiat = analyticsFiat;

describe("readAnalyticsPositionValue", () => {
  it("should value a held position at its latest price", () => {
    expect(
      readAnalyticsPositionValue(eth, { countervalues: createMockCountervalues([eth]), fiat }),
    ).toBe(20000);
  });

  it("should value a token with its token currency", () => {
    const token = createMockToken(eth);
    expect(
      readAnalyticsPositionValue(token, { countervalues: createMockCountervalues([token]), fiat }),
    ).toBe(1000);
  });

  it("should report a held position without a price as unpriced", () => {
    expect(readAnalyticsPositionValue(eth, { countervalues: buildMultiCV([]), fiat })).toBeNull();
  });

  it("should value a zero balance at zero without requiring its price", () => {
    const empty = { ...eth, balance: mockAmount(0) };
    expect(readAnalyticsPositionValue(empty, { countervalues: buildMultiCV([]), fiat })).toBe(0);
  });
});
