import { mockMarketItemResponse } from "@domain/api-market-currency/mock";
import { formatMarketPerformer } from "./transforms";

describe("formatMarketPerformer", () => {
  it("keeps the fields a performer shows and drops the rest", () => {
    const performer = formatMarketPerformer(mockMarketItemResponse());

    expect(performer).toEqual({
      id: "bitcoin",
      ledgerIds: ["bitcoin"],
      name: "Bitcoin",
      image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
      ticker: "BTC",
      priceChangePercentage1h: 0.12,
      priceChangePercentage24h: -0.64,
      priceChangePercentage7d: 1.9,
      priceChangePercentage30d: 4.3,
      priceChangePercentage1y: 48.2,
      price: 63_250,
    });
    expect(performer).not.toHaveProperty("marketCap");
    expect(performer).not.toHaveProperty("sparkline");
  });
});
