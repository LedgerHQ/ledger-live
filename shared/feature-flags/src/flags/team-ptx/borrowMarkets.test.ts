import { borrowMarkets } from "./borrowMarkets";

describe("borrowMarkets", () => {
  it("should default to disabled with no market", () => {
    expect(borrowMarkets.parse(undefined)).toEqual({
      enabled: false,
      params: { markets: {} },
    });
  });

  it("should accept collateral lists keyed by stablecoin currency id", () => {
    const value = {
      enabled: true,
      params: {
        markets: {
          "ethereum/erc20/usd__coin": [
            "ethereum/erc20/coinbase_wrapped_btc",
            "ethereum/erc20/wrapped_bitcoin",
            "ethereum/erc20/wsteth",
          ],
          "ethereum/erc20/usd_tether__erc20_": [
            "ethereum/erc20/coinbase_wrapped_btc",
            "ethereum/erc20/wrapped_bitcoin",
            "ethereum/erc20/wsteth",
          ],
          "base/erc20/usd_coin": ["base/erc20/coinbase_wrapped_btc"],
        },
      },
    };

    expect(borrowMarkets.parse(value)).toEqual(value);
  });

  it.each([
    ["no market", {}],
    ["a stablecoin with no collateral", { "base/erc20/usd_coin": [] }],
  ])("should accept %s when enabled", (_, markets) => {
    expect(borrowMarkets.parse({ enabled: true, params: { markets } })).toEqual({
      enabled: true,
      params: { markets },
    });
  });

  it("should leave params undefined when only enabled is given", () => {
    expect(borrowMarkets.parse({ enabled: true })).toEqual({ enabled: true });
  });

  it.each([
    ["params without markets", {}],
    ["markets as an array", { markets: ["ethereum/erc20/usd__coin"] }],
    [
      "a collateral list as a string",
      { markets: { "base/erc20/usd_coin": "base/erc20/coinbase_wrapped_btc" } },
    ],
    ["a non-string collateral id", { markets: { "base/erc20/usd_coin": [42] } }],
  ])("should reject %s", (_, params) => {
    expect(() => borrowMarkets.parse({ enabled: true, params })).toThrow();
  });
});
