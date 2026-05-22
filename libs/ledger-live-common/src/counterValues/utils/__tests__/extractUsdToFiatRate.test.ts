import { extractUsdToFiatRate } from "../extractUsdToFiatRate";

describe("extractUsdToFiatRate", () => {
  it("returns the USD rate from the spot payload", () => {
    expect(extractUsdToFiatRate({ USD: 0.863051 })).toBe(0.863051);
    expect(extractUsdToFiatRate({ usd: 0.9 })).toBe(0.9);
  });

  it("is case-insensitive on the source currency key", () => {
    expect(extractUsdToFiatRate({ USD: 0.9 })).toBe(0.9);
    expect(extractUsdToFiatRate({ usd: 0.8 })).toBe(0.8);
  });

  it("returns null when the USD rate is missing", () => {
    expect(extractUsdToFiatRate({})).toBeNull();
    expect(extractUsdToFiatRate({ eur: 1.1 })).toBeNull();
  });

  it("returns null for non-finite rates", () => {
    expect(extractUsdToFiatRate({ USD: NaN })).toBeNull();
    expect(extractUsdToFiatRate({ USD: Infinity })).toBeNull();
  });
});
