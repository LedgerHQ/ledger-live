import { validateLargeMoverCurrencyIds } from "../validation";

describe("validateLargeMoverCurrencyIds", () => {
  it("should return null when currencyIds is null", () => {
    const result = validateLargeMoverCurrencyIds(null);
    expect(result).toBeNull();
  });

  it("should return null when currencyIds is undefined", () => {
    const result = validateLargeMoverCurrencyIds(null);
    expect(result).toBeNull();
  });

  it("should return null when currencyIds is an empty string", () => {
    const result = validateLargeMoverCurrencyIds("");
    expect(result).toBeNull();
  });

  it("should return null when currencyIds is only whitespace", () => {
    const result = validateLargeMoverCurrencyIds("   ");
    expect(result).toBeNull();
  });

  it("should uppercase single currencyId", () => {
    const result = validateLargeMoverCurrencyIds("btc");
    expect(result).toBe("BTC");
  });

  it("should uppercase multiple currencyIds separated by commas", () => {
    const result = validateLargeMoverCurrencyIds("btc,eth,xrp");
    expect(result).toBe("BTC,ETH,XRP");
  });

  it("should uppercase and trim currencyIds with whitespace", () => {
    const result = validateLargeMoverCurrencyIds("  btc,eth  ");
    expect(result).toBe("BTC,ETH");
  });

  it("should handle already uppercase currencyIds", () => {
    const result = validateLargeMoverCurrencyIds("BTC,ETH");
    expect(result).toBe("BTC,ETH");
  });

  it("should handle mixed case currencyIds", () => {
    const result = validateLargeMoverCurrencyIds("BtC,eTh,XrP");
    expect(result).toBe("BTC,ETH,XRP");
  });
});
