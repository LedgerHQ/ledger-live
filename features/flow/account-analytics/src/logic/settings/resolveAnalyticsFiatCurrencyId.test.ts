import { resolveAnalyticsFiatCurrencyId } from "./resolveAnalyticsFiatCurrencyId";

describe("resolveAnalyticsFiatCurrencyId", () => {
  it("should keep a supported fiat ticker", () => {
    expect(resolveAnalyticsFiatCurrencyId("EUR")).toBe("EUR");
  });

  it("should read an unknown ticker as USD", () => {
    expect(resolveAnalyticsFiatCurrencyId("ZZZ")).toBe("USD");
  });
});
