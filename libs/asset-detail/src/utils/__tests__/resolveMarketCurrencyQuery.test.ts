import {
  buildMarketCurrencyQueryArgs,
  getMarketLedgerIdsForQuery,
  isCoingeckoStyleMarketId,
  MAX_MARKET_LEDGER_IDS,
  resolveCoingeckoIdForIdsQuery,
} from "../resolveMarketCurrencyQuery";

describe("isCoingeckoStyleMarketId", () => {
  it("returns true for plain market slugs", () => {
    expect(isCoingeckoStyleMarketId("shiba-inu")).toBe(true);
    expect(isCoingeckoStyleMarketId("bitcoin")).toBe(true);
  });

  it("returns false for ledger ids and DADA urns", () => {
    expect(isCoingeckoStyleMarketId("ethereum/erc20/shiba_inu")).toBe(false);
    expect(isCoingeckoStyleMarketId("urn:crypto:meta-currency:shiba_inu")).toBe(false);
  });
});

describe("resolveCoingeckoIdForIdsQuery", () => {
  it("returns coingecko ids as-is", () => {
    expect(resolveCoingeckoIdForIdsQuery("shiba-inu")).toBe("shiba-inu");
  });

  it("converts DADA urns to coingecko slugs for the legacy ids filter", () => {
    expect(resolveCoingeckoIdForIdsQuery("urn:crypto:meta-currency:shiba_inu")).toBe("shiba-inu");
  });

  it("returns undefined for ledger ids that cannot be mapped to a coingecko slug", () => {
    expect(resolveCoingeckoIdForIdsQuery("ethereum/erc20/shiba_inu")).toBeUndefined();
    expect(resolveCoingeckoIdForIdsQuery("solana/spl/bonk")).toBeUndefined();
  });
});

describe("getMarketLedgerIdsForQuery", () => {
  it("caps the number of ledger ids sent in the query string", () => {
    const ledgerIds = Array.from(
      { length: MAX_MARKET_LEDGER_IDS + 3 },
      (_, index) => `id-${index}`,
    );
    expect(getMarketLedgerIdsForQuery(ledgerIds)).toHaveLength(MAX_MARKET_LEDGER_IDS);
    expect(getMarketLedgerIdsForQuery(ledgerIds)[0]).toBe("id-0");
  });
});

describe("buildMarketCurrencyQueryArgs", () => {
  it("uses ledgerIds whenever they are known, even for coingecko-style ids", () => {
    expect(
      buildMarketCurrencyQueryArgs({
        marketApiId: "bitcoin",
        knownLedgerIds: ["bitcoin"],
        counterCurrency: "usd",
      }),
    ).toEqual({
      args: { ledgerIds: ["bitcoin"], counterCurrency: "usd" },
      skip: false,
    });
  });

  it("uses ledgerIds for a DADA slug that is not a coingecko id", () => {
    expect(
      buildMarketCurrencyQueryArgs({
        marketApiId: "avalanche",
        knownLedgerIds: ["avalanche_c_chain"],
        counterCurrency: "usd",
      }),
    ).toEqual({
      args: { ledgerIds: ["avalanche_c_chain"], counterCurrency: "usd" },
      skip: false,
    });
  });

  it("falls back to the legacy ids filter when no ledger id is known", () => {
    expect(
      buildMarketCurrencyQueryArgs({
        marketApiId: "urn:crypto:meta-currency:shiba_inu",
        counterCurrency: "eur",
      }),
    ).toEqual({
      args: { id: "shiba-inu", counterCurrency: "eur" },
      skip: false,
    });
  });

  it("skips the query when no market id can be resolved", () => {
    expect(
      buildMarketCurrencyQueryArgs({
        counterCurrency: "usd",
      }),
    ).toEqual({
      args: { id: "", counterCurrency: "usd" },
      skip: true,
    });
  });
});
