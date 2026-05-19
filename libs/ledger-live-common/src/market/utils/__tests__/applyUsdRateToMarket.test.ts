import { applyUsdRateToMarket } from "../applyUsdRateToMarket";
import { createMockMarketCurrencyData } from "../fixtures";

describe("applyUsdRateToMarket", () => {
  it("returns the input unchanged when rate === 1 (USD)", () => {
    const data = createMockMarketCurrencyData();
    expect(applyUsdRateToMarket(data, 1)).toBe(data);
  });

  describe("rate !== 1", () => {
    const data = createMockMarketCurrencyData();
    const rate = 0.9;
    const out = applyUsdRateToMarket(data, rate);

    it("multiplies every USD-denominated field by the rate", () => {
      expect(out.price).toBe(data.price * rate);
      expect(out.marketcap).toBe((data.marketcap as number) * rate);
      expect(out.totalVolume).toBe(data.totalVolume * rate);
      expect(out.high24h).toBe(data.high24h * rate);
      expect(out.low24h).toBe(data.low24h * rate);
      expect(out.ath).toBe(data.ath * rate);
      expect(out.atl).toBe(data.atl * rate);
    });

    it("preserves non-USD numeric fields verbatim", () => {
      expect(out.marketcapRank).toBe(data.marketcapRank);
      expect(out.marketCapChangePercentage24h).toBe(data.marketCapChangePercentage24h);
      expect(out.circulatingSupply).toBe(data.circulatingSupply);
      expect(out.totalSupply).toBe(data.totalSupply);
      expect(out.maxSupply).toBe(data.maxSupply);
    });

    it("preserves percentages, dates, sparkline and chartData verbatim", () => {
      expect(out.priceChangePercentage).toEqual(data.priceChangePercentage);
      expect(out.athDate).toBe(data.athDate);
      expect(out.atlDate).toBe(data.atlDate);
      expect(out.sparklineIn7d).toBe(data.sparklineIn7d);
      expect(out.chartData).toBe(data.chartData);
    });

    it("preserves identity fields (id, name, ticker, image, ledgerIds)", () => {
      expect(out.id).toBe(data.id);
      expect(out.name).toBe(data.name);
      expect(out.ticker).toBe(data.ticker);
      expect(out.image).toBe(data.image);
      expect(out.ledgerIds).toBe(data.ledgerIds);
    });
  });

  it("keeps `marketcap` as undefined when it is undefined on the input", () => {
    const data = createMockMarketCurrencyData({ marketcap: undefined });
    const out = applyUsdRateToMarket(data, 2);
    expect(out.marketcap).toBeUndefined();
  });
});
