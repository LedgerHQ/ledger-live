import { AggregatedAssetIdSchema } from "@domain/entity-aggregated-asset";
import { MarketIdSchema, parseMarketRef, toMarketId } from "./market";

const marketIdOf = (raw: string) => toMarketId(parseMarketRef(raw));

describe("parseMarketRef", () => {
  it("parses an id containing a separator as an aggregated asset id", () => {
    expect(parseMarketRef("urn:crypto:meta-currency:usd_coin")).toBe(
      AggregatedAssetIdSchema.parse("urn:crypto:meta-currency:usd_coin"),
    );
  });

  it("parses an id without a separator as a market id", () => {
    expect(parseMarketRef("usd-coin")).toBe(MarketIdSchema.parse("usd-coin"));
  });
});

describe("toMarketId", () => {
  it("returns a market id unchanged", () => {
    expect(toMarketId(MarketIdSchema.parse("bitcoin"))).toBe("bitcoin");
  });

  it("maps an aggregated asset id to the market id of its last segment", () => {
    expect(toMarketId(AggregatedAssetIdSchema.parse("urn:crypto:meta-currency:usd_coin"))).toBe(
      "usd-coin",
    );
  });
});

describe("toMarketId of a raw id", () => {
  it("returns a plain crypto id unchanged", () => {
    expect(marketIdOf("bitcoin")).toBe("bitcoin");
  });

  it("strips the chain prefix and keeps the last segment", () => {
    expect(marketIdOf("ethereum:usd-coin")).toBe("usd-coin");
  });

  it("replaces underscores with dashes in the last segment", () => {
    expect(marketIdOf("ethereum:usd_coin")).toBe("usd-coin");
  });

  it("keeps only the last segment of a token id", () => {
    expect(marketIdOf("ethereum:erc20:usd_tether")).toBe("usd-tether");
  });

  it("converts every underscore to a hyphen, which is what the market api expects", () => {
    expect(marketIdOf("solana:spl:jupiter_perps_lp")).toBe("jupiter-perps-lp");
  });

  it("leaves a last segment without underscores alone", () => {
    expect(marketIdOf("ethereum:erc20:dai")).toBe("dai");
  });

  it("does not touch underscores when there is no separator", () => {
    expect(marketIdOf("usd_tether")).toBe("usd_tether");
  });

  it("yields an empty id for a trailing separator", () => {
    expect(marketIdOf("ethereum:erc20:")).toBe("");
  });

  it("returns an empty string unchanged", () => {
    expect(marketIdOf("")).toBe("");
  });
});
