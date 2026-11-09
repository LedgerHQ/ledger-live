import BigNumber from "bignumber.js";
import { selectPricedAnalyticsPositions } from "../selectPricedAnalyticsPositions";
import {
  analyticsFiat,
  createAnalyticsAccount,
  createAnalyticsCountervalues,
} from "../../__fixtures__/analyticsFixtures";

const eth = createAnalyticsAccount("analytics-priced-eth");
const btc = createAnalyticsAccount("analytics-priced-btc", "bitcoin");
const emptyEth = { ...eth, balance: new BigNumber(0), spendableBalance: new BigNumber(0) };
const btcOnly = createAnalyticsCountervalues([btc]);

describe("selectPricedAnalyticsPositions", () => {
  it("should keep the priced positions and sum their value", () => {
    expect(selectPricedAnalyticsPositions([eth, btc], btcOnly, analyticsFiat)).toEqual({
      priced: [btc],
      amount: 20000,
      hasOnlyUnpricedHoldings: false,
    });
  });

  it("should flag a selection whose only holdings lack a price", () => {
    expect(
      selectPricedAnalyticsPositions([eth], btcOnly, analyticsFiat).hasOnlyUnpricedHoldings,
    ).toBe(true);
  });

  it("should flag an unpriced holding next to empty priced positions", () => {
    const emptyBtc = { ...btc, balance: new BigNumber(0), spendableBalance: new BigNumber(0) };
    expect(
      selectPricedAnalyticsPositions([eth, emptyBtc], btcOnly, analyticsFiat)
        .hasOnlyUnpricedHoldings,
    ).toBe(true);
  });

  it("should keep an empty position without a price as a zero value", () => {
    expect(selectPricedAnalyticsPositions([emptyEth], btcOnly, analyticsFiat)).toEqual({
      priced: [emptyEth],
      amount: 0,
      hasOnlyUnpricedHoldings: false,
    });
  });
});
