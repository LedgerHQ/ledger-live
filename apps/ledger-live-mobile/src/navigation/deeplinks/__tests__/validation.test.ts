import {
  validateLargeMoverCurrencyIds,
  validateLargeMoverLedgerIds,
  validateMarketCurrencyId,
} from "../validation";

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

describe("validateLargeMoverLedgerIds", () => {
  it("should return null when ledgerIds is null", () => {
    expect(validateLargeMoverLedgerIds(null)).toBeNull();
  });

  it("should return null when ledgerIds is empty string", () => {
    expect(validateLargeMoverLedgerIds("")).toBeNull();
  });

  it("should return null when ledgerIds is only whitespace", () => {
    expect(validateLargeMoverLedgerIds("   ")).toBeNull();
  });

  it("should lowercase and trim single ledger id", () => {
    expect(validateLargeMoverLedgerIds("ethereum/erc20/usd__coin")).toBe(
      "ethereum/erc20/usd__coin",
    );
    expect(validateLargeMoverLedgerIds("  bitcoin  ")).toBe("bitcoin");
  });

  it("should lowercase and trim multiple ledger ids", () => {
    expect(validateLargeMoverLedgerIds("ethereum/erc20/usd__coin,bitcoin")).toBe(
      "ethereum/erc20/usd__coin,bitcoin",
    );
  });

  it("should remove duplicates", () => {
    expect(validateLargeMoverLedgerIds("bitcoin,ethereum/erc20/usd__coin,bitcoin")).toBe(
      "bitcoin,ethereum/erc20/usd__coin",
    );
  });

  it("should filter out empty segments", () => {
    expect(validateLargeMoverLedgerIds("btc,,eth")).toBe("btc,eth");
  });
});

describe("validateMarketCurrencyId", () => {
  it("should return null when currencyId is null", () => {
    const result = validateMarketCurrencyId(null);
    expect(result).toBeNull();
  });

  it("should return null when currencyId is empty", () => {
    const result = validateMarketCurrencyId("");
    expect(result).toBeNull();
  });

  it("should return null for an unknown currencyId", () => {
    const result = validateMarketCurrencyId("unknown_coin");
    expect(result).toBeNull();
  });

  it("should normalize and return a valid currencyId", () => {
    const result = validateMarketCurrencyId("BiTcOiN");
    expect(result).toBe("bitcoin");
  });
});
