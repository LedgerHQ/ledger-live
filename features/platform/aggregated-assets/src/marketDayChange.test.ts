import { marketDayChangeByCurrencyId } from "./marketDayChange";

describe("marketDayChangeByCurrencyId", () => {
  it("reads the 24h change from a market keyed by currency id", () => {
    const map = marketDayChangeByCurrencyId({
      markets: { bitcoin: { priceChangePercentage24h: 1.5 } },
    });

    expect(map.get("bitcoin")).toBe(1.5);
  });

  it("indexes a meta-currency market by each ledger currency id", () => {
    const map = marketDayChangeByCurrencyId({
      markets: {
        "urn:crypto:meta-currency:applex": { priceChangePercentage24h: -2.5 },
      },
      cryptoAssets: {
        "urn:crypto:meta-currency:applex": {
          assetsIds: { solana: "solana/spl/applex" },
        },
      },
    });

    expect(map.get("urn:crypto:meta-currency:applex")).toBe(-2.5);
    expect(map.get("solana/spl/applex")).toBe(-2.5);
  });

  it("indexes the market currency id and its ledger ids", () => {
    const map = marketDayChangeByCurrencyId({
      markets: {
        "urn:crypto:meta-currency:applex": {
          priceChangePercentage24h: 4,
          currencyId: "solana/spl/applex",
          ledgerIds: ["ethereum/erc20/applex"],
        },
      },
    });

    expect(map.get("solana/spl/applex")).toBe(4);
    expect(map.get("ethereum/erc20/applex")).toBe(4);
  });

  it("keeps a 0% change and ignores a missing one", () => {
    const map = marketDayChangeByCurrencyId(
      { markets: { bitcoin: { priceChangePercentage24h: 0 } } },
      { markets: { ethereum: { priceChangePercentage24h: null } } },
      undefined,
    );

    expect(map.get("bitcoin")).toBe(0);
    expect(map.has("ethereum")).toBe(false);
  });

  it("lets a later source replace the same currency", () => {
    const map = marketDayChangeByCurrencyId(
      { markets: { bitcoin: { priceChangePercentage24h: 1 } } },
      { markets: { bitcoin: { priceChangePercentage24h: 3 } } },
    );

    expect(map.get("bitcoin")).toBe(3);
  });
});
