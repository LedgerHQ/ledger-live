import { MarketItemPerformerSchema } from "./schema";

const performer = {
  id: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  priceChangePercentage1h: 0.1,
  priceChangePercentage24h: 1.2,
  priceChangePercentage7d: -3.4,
  priceChangePercentage30d: 5.6,
  priceChangePercentage1y: 80,
  image: "https://cdn.test/bitcoin.png",
  price: 60000,
  ledgerIds: ["crypto_bitcoin"],
};

describe("MarketItemPerformerSchema", () => {
  it("validates a well-formed performer", () => {
    expect(MarketItemPerformerSchema.parse(performer)).toEqual(performer);
  });

  it("rejects a performer without a price", () => {
    const { price: _price, ...withoutPrice } = performer;

    expect(MarketItemPerformerSchema.safeParse(withoutPrice).success).toBe(false);
  });

  it("rejects ledgerIds that are not a list", () => {
    expect(
      MarketItemPerformerSchema.safeParse({ ...performer, ledgerIds: "crypto_bitcoin" }).success,
    ).toBe(false);
  });
});
