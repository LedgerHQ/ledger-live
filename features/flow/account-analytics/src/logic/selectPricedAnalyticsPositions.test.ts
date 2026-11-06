import { selectPricedAnalyticsPositions } from "./selectPricedAnalyticsPositions";
import {
  analyticsFiat,
  createMockAccount,
  createMockCountervalues,
  mockAmount,
} from "../analyticsSources.mock";

const eth = createMockAccount("priced-eth");
const btc = createMockAccount("priced-btc", "bitcoin");
const emptyEth = { ...eth, balance: mockAmount(0) };
const btcOnly = { countervalues: createMockCountervalues([btc]), fiat: analyticsFiat };

describe("selectPricedAnalyticsPositions", () => {
  it("should keep the priced positions and sum their value", () => {
    expect(selectPricedAnalyticsPositions([eth, btc], btcOnly)).toEqual({
      priced: [btc],
      amount: 20000,
      hasOnlyUnpricedHoldings: false,
    });
  });

  it("should flag a selection whose only holdings lack a price", () => {
    expect(selectPricedAnalyticsPositions([eth], btcOnly).hasOnlyUnpricedHoldings).toBe(true);
  });

  it("should flag an unpriced holding next to empty priced positions", () => {
    const emptyBtc = { ...btc, balance: mockAmount(0) };
    expect(selectPricedAnalyticsPositions([eth, emptyBtc], btcOnly).hasOnlyUnpricedHoldings).toBe(
      true,
    );
  });

  it("should keep an empty position without a price as a zero value", () => {
    expect(selectPricedAnalyticsPositions([emptyEth], btcOnly)).toEqual({
      priced: [emptyEth],
      amount: 0,
      hasOnlyUnpricedHoldings: false,
    });
  });
});
