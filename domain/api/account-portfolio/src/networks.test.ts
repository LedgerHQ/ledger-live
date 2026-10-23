import { PORTFOLIO_NETWORKS, portfolioNetworkOf } from "./networks";

describe("portfolioNetworkOf", () => {
  it("keeps a currency id the service knows", () => {
    expect(portfolioNetworkOf("bitcoin")).toBe("bitcoin");
    expect(portfolioNetworkOf("ethereum_sepolia")).toBe("ethereum_sepolia");
  });

  it("renames a currency id the service names differently", () => {
    expect(portfolioNetworkOf("ripple")).toBe("xrp");
  });

  it.each(["axelar", "casper", "dydx", "injective", "internet_computer", "osmo", "stacks", "ton"])(
    "has no network for %s, which the service rejects",
    currencyId => {
      expect(portfolioNetworkOf(currencyId)).toBeUndefined();
    },
  );

  it("lists each network once", () => {
    expect(new Set(PORTFOLIO_NETWORKS).size).toBe(PORTFOLIO_NETWORKS.length);
  });
});
