import { dadaIdToMarketId } from "./market";

describe("dadaIdToMarketId", () => {
  it("returns a plain crypto id unchanged", () => {
    expect(dadaIdToMarketId("bitcoin")).toBe("bitcoin");
  });

  it("keeps the last segment of a token id", () => {
    expect(dadaIdToMarketId("ethereum:erc20:usd_tether")).toBe("usd-tether");
  });

  it("converts underscores to hyphens, which is what the market api expects", () => {
    expect(dadaIdToMarketId("solana:spl:jupiter_perps_lp")).toBe("jupiter-perps-lp");
  });

  it("leaves an id without underscores alone", () => {
    expect(dadaIdToMarketId("ethereum:erc20:dai")).toBe("dai");
  });

  it("does not touch underscores when there is no separator", () => {
    expect(dadaIdToMarketId("usd_tether")).toBe("usd_tether");
  });

  it("yields an empty id for a trailing separator", () => {
    expect(dadaIdToMarketId("ethereum:erc20:")).toBe("");
  });

  it("returns an empty string unchanged", () => {
    expect(dadaIdToMarketId("")).toBe("");
  });
});
