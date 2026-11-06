import { readAnalyticsCurrentBalance } from "./readAnalyticsCurrentBalance";
import {
  analyticsFiat,
  createMockAccount,
  createMockCountervalues,
  createMockToken,
} from "../analyticsSources.mock";

const eth = createMockAccount("current-eth");
const token = createMockToken(eth);
const btc = createMockAccount("current-btc", "bitcoin");
const fiat = analyticsFiat;

describe("readAnalyticsCurrentBalance", () => {
  it("should sum the latest value of every selected position", () => {
    const countervalues = createMockCountervalues([eth, token]);
    expect(readAnalyticsCurrentBalance([eth, token], { countervalues, fiat })).toEqual({
      status: "ready",
      data: 20000 + 1000,
    });
  });

  it("should leave out a held position without a price", () => {
    const countervalues = createMockCountervalues([btc]);
    expect(readAnalyticsCurrentBalance([eth, btc], { countervalues, fiat })).toEqual({
      status: "ready",
      data: 20000,
    });
  });

  it("should report unavailable when every held position lacks a price", () => {
    const countervalues = createMockCountervalues([btc]);
    expect(readAnalyticsCurrentBalance([eth, token], { countervalues, fiat })).toEqual({
      status: "unavailable",
    });
  });
});
