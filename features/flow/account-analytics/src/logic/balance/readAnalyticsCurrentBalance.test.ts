import { readAnalyticsCurrentBalance } from "./readAnalyticsCurrentBalance";
import {
  analyticsFiat,
  createAnalyticsAccount,
  createAnalyticsCountervalues,
  createAnalyticsToken,
} from "../../analyticsSources.mock";

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

  it("should leave out a held position without a price", () => {
    const btcOnly = createAnalyticsCountervalues([btc]);
    expect(readAnalyticsCurrentBalance([eth, btc], btcOnly, analyticsFiat)).toEqual({
      status: "ready",
      data: 20000,
    });
  });

  it("should report unavailable when every held position lacks a price", () => {
    const btcOnly = createAnalyticsCountervalues([btc]);
    expect(readAnalyticsCurrentBalance([eth, token], btcOnly, analyticsFiat)).toEqual({
      status: "unavailable",
    });
  });
});
