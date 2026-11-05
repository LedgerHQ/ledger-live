import { readAnalyticsCurrentBalance } from "../readAnalyticsCurrentBalance";
import {
  analyticsFiat,
  createAnalyticsAccount,
  createAnalyticsCountervalues,
  createAnalyticsToken,
} from "../../__fixtures__/analyticsFixtures";

const eth = createAnalyticsAccount("analytics-current-eth");
const token = createAnalyticsToken(eth);
const btc = createAnalyticsAccount("analytics-current-btc", "bitcoin");

describe("readAnalyticsCurrentBalance", () => {
  it("should sum the latest value of every selected position", () => {
    const countervalues = createAnalyticsCountervalues([eth, token]);
    expect(readAnalyticsCurrentBalance([eth, token], countervalues, analyticsFiat)).toEqual({
      status: "ready",
      data: 20000 + 1000,
    });
  });

  it("should report unavailable instead of a partial sum when a held position has no price", () => {
    const btcOnly = createAnalyticsCountervalues([btc]);
    expect(readAnalyticsCurrentBalance([eth, btc], btcOnly, analyticsFiat)).toEqual({
      status: "unavailable",
    });
  });
});
