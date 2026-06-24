import { pickBestMarketSearchMatch } from "./pickBestMarketSearchMatch";
import { createMockMarketItemResponse } from "./fixtures";

const item = (overrides: Parameters<typeof createMockMarketItemResponse>[0]) =>
  createMockMarketItemResponse(overrides);

describe("pickBestMarketSearchMatch", () => {
  it("returns undefined when no result carries ledgerIds", () => {
    const results = [
      item({ id: "junk-1", ticker: "wlfi", ledgerIds: [] }),
      item({ id: "junk-2", ticker: "wlfi", ledgerIds: [] }),
    ];
    expect(pickBestMarketSearchMatch(results, "wlfi")).toBeUndefined();
  });

  it("returns undefined for an empty list", () => {
    expect(pickBestMarketSearchMatch([], "wlfi")).toBeUndefined();
  });

  it("skips ledgerless junk and prefers the exact ticker match", () => {
    const results = [
      item({ id: "we-lack-financial-intelligence", ticker: "wlfi", ledgerIds: [] }),
      item({ id: "baby-world-liberty-financial", ticker: "babywlfi", ledgerIds: ["ethereum/erc20/baby"] }),
      item({
        id: "world-liberty-financial",
        ticker: "wlfi",
        ledgerIds: ["ethereum/erc20/world_liberty_financial"],
      }),
    ];
    expect(pickBestMarketSearchMatch(results, "WLFI")?.id).toBe("world-liberty-financial");
  });

  it("falls back to an exact name match when no ticker matches", () => {
    const results = [
      item({ id: "other", ticker: "abc", name: "Other", ledgerIds: ["ethereum/erc20/other"] }),
      item({ id: "hedera-hashgraph", ticker: "hbar", name: "Hedera", ledgerIds: ["hedera"] }),
    ];
    expect(pickBestMarketSearchMatch(results, "hedera")?.id).toBe("hedera-hashgraph");
  });

  it("falls back to the first usable (highest market-cap) row", () => {
    const results = [
      item({ id: "junk", ticker: "x", name: "X", ledgerIds: [] }),
      item({ id: "top-cap", ticker: "a", name: "A", ledgerIds: ["ethereum/erc20/a"] }),
      item({ id: "lower-cap", ticker: "b", name: "B", ledgerIds: ["ethereum/erc20/b"] }),
    ];
    expect(pickBestMarketSearchMatch(results, "no-match")?.id).toBe("top-cap");
  });
});
