import { transformAltcoinSeasonIndexResponse } from "./transforms";

const rawResponse = {
  data: {
    altcoin_index: 42,
    altcoin_marketcap: 1234567890,
  },
  status: {
    timestamp: "2026-01-07T15:08:19.975Z",
    error_code: "0",
    error_message: null,
    elapsed: 10,
    credit_count: 0,
    notice: null,
  },
};

describe("transformAltcoinSeasonIndexResponse", () => {
  it("maps the raw CMC response to the canonical index", () => {
    expect(transformAltcoinSeasonIndexResponse(rawResponse)).toEqual({
      value: 42,
      altcoinMarketcap: 1234567890,
    });
  });

  it("throws on an invalid payload", () => {
    expect(() => transformAltcoinSeasonIndexResponse({ data: { altcoin_index: 42 } })).toThrow();
    expect(() => transformAltcoinSeasonIndexResponse(null)).toThrow();
  });
});
