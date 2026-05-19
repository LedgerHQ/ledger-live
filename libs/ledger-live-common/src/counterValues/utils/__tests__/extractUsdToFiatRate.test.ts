import { extractUsdToFiatRate } from "../extractUsdToFiatRate";

describe("extractUsdToFiatRate", () => {
  const payload = { usd: { eur: 0.9, gbp: 0.8 } };

  it("returns the rate for a known fiat", () => {
    expect(extractUsdToFiatRate(payload, "eur")).toBe(0.9);
    expect(extractUsdToFiatRate(payload, "gbp")).toBe(0.8);
  });

  it("is case-insensitive on the target ticker", () => {
    expect(extractUsdToFiatRate(payload, "EUR")).toBe(0.9);
    expect(extractUsdToFiatRate(payload, "Gbp")).toBe(0.8);
  });

  it("returns null for a missing fiat", () => {
    expect(extractUsdToFiatRate(payload, "jpy")).toBeNull();
  });

  it("returns null when the usd key is missing", () => {
    expect(extractUsdToFiatRate({}, "eur")).toBeNull();
    expect(extractUsdToFiatRate({ eur: { usd: 1.1 } }, "eur")).toBeNull();
  });
});
