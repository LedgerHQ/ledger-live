import {
  DEFAULT_PORTFOLIO_MODE,
  isPortfolioEnabled,
  PORTFOLIO_MODES,
  portfolioModeOf,
  portfolioModesFromCoinConfig,
} from "./mode";

describe("portfolioModeOf", () => {
  it.each(PORTFOLIO_MODES)("reads the %s mode a coin config sets", mode => {
    expect(portfolioModeOf({ status: { type: "active" }, portfolio: { mode } })).toBe(mode);
  });

  it.each([
    ["no coin config", undefined],
    ["a null coin config", null],
    ["no portfolio section", { status: { type: "active" } }],
    ["no mode", { portfolio: {} }],
    ["an unknown mode", { portfolio: { mode: "cloud" } }],
  ])("falls back to local for %s", (_, coinConfig) => {
    expect(portfolioModeOf(coinConfig)).toBe("local");
    expect(DEFAULT_PORTFOLIO_MODE).toBe("local");
  });

  it("falls back to the mode it is given", () => {
    expect(portfolioModeOf({}, "remote")).toBe("remote");
  });
});

describe("portfolioModesFromCoinConfig", () => {
  it("reads each network's mode from its coin config, sync or async", async () => {
    const configs: Record<string, unknown> = {
      bitcoin: { portfolio: { mode: "hybrid" } },
      ethereum: { portfolio: { mode: "remote" } },
    };
    const sync = portfolioModesFromCoinConfig(network => configs[network]);
    const async = portfolioModesFromCoinConfig(async network => configs[network]);
    expect(await sync("bitcoin")).toBe("hybrid");
    expect(await async("ethereum")).toBe("remote");
    expect(await async("solana")).toBe("local");
  });

  it("falls back when the coin config of a network cannot be read", async () => {
    const throwing = portfolioModesFromCoinConfig(() => {
      throw new Error("No currency configuration available for tezos");
    }, "remote");
    const rejecting = portfolioModesFromCoinConfig(() => Promise.reject(new Error("offline")));
    expect(await throwing("tezos")).toBe("remote");
    expect(await rejecting("tezos")).toBe("local");
  });
});

describe("isPortfolioEnabled", () => {
  it("routes a chain through the portfolio layer only when its coin config enables it", () => {
    expect(isPortfolioEnabled({ portfolio: { enabled: true, mode: "remote" } })).toBe(true);
  });

  it.each([
    ["no coin config", undefined],
    ["no portfolio section", { status: { type: "active" } }],
    ["a mode without the flag", { portfolio: { mode: "local" } }],
    ["the flag off", { portfolio: { enabled: false } }],
    ["a truthy flag that is not true", { portfolio: { enabled: "yes" } }],
  ])("keeps the legacy bridge for %s", (_, coinConfig) => {
    expect(isPortfolioEnabled(coinConfig)).toBe(false);
  });
});
