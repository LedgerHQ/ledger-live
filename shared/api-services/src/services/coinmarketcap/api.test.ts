import { coinMarketCapApi, coinMarketCapApiExtra, getCoinMarketCapExtra } from "./api";

const valid = { coinMarketCapApiUrl: "https://cmc.test" };

describe("coinMarketCapApi", () => {
  it("has the correct reducer path", () => {
    expect(coinMarketCapApi.reducerPath).toBe("coinMarketCapApi");
  });

  it("declares no endpoints of its own", () => {
    expect(Object.keys(coinMarketCapApi.endpoints)).toHaveLength(0);
  });
});

describe("coinMarketCapApiExtra", () => {
  it("returns the validated config", () => {
    expect(coinMarketCapApiExtra(valid)).toEqual(valid);
  });

  it("throws when the url is missing or empty", () => {
    // @ts-expect-error — coinMarketCapApiUrl is required
    expect(() => coinMarketCapApiExtra({})).toThrow();
    expect(() => coinMarketCapApiExtra({ coinMarketCapApiUrl: "" })).toThrow();
  });
});

describe("getCoinMarketCapExtra", () => {
  it("reads the config off the thunk extraArgument", () => {
    expect(getCoinMarketCapExtra({ extra: valid })).toBe(valid);
  });
});
