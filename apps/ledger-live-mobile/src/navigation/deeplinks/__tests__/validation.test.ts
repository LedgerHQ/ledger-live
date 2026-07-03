import {
  validateLargeMoverCurrencyIds,
  validateLargeMoverLedgerIds,
  validateMarketAssetPath,
  validateMarketCurrencyId,
  validateMarketListCategory,
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

describe("validateMarketAssetPath", () => {
  it("should return null when pathname is null", () => {
    expect(validateMarketAssetPath(null)).toBeNull();
  });

  it("should return null when pathname is empty", () => {
    expect(validateMarketAssetPath("")).toBeNull();
  });

  it("should return a canonical currency id for a coin path", () => {
    expect(validateMarketAssetPath("/BiTcOiN")).toEqual({
      currencyId: "bitcoin",
      assetId: "bitcoin",
    });
  });

  it("should return the full Ledger token id for a token path", () => {
    expect(validateMarketAssetPath("/ethereum/erc20/usd_tether__erc20_")).toEqual({
      currencyId: "ethereum",
      assetId: "ethereum/erc20/usd_tether__erc20_",
      ledgerIds: ["ethereum/erc20/usd_tether__erc20_"],
    });
  });

  it("should support Ledger token id characters beyond underscores", () => {
    expect(validateMarketAssetPath("/ethereum/erc20/uniswap_(bridged)")).toEqual({
      currencyId: "ethereum",
      assetId: "ethereum/erc20/uniswap_(bridged)",
      ledgerIds: ["ethereum/erc20/uniswap_(bridged)"],
    });
    expect(validateMarketAssetPath("/stellar/asset/usdc:ga5z")).toEqual({
      currencyId: "stellar",
      assetId: "stellar/asset/usdc:ga5z",
      ledgerIds: ["stellar/asset/usdc:ga5z"],
    });
  });

  it("should return null when the parent currency is unknown", () => {
    expect(validateMarketAssetPath("/unknown/erc20/usd_tether__erc20_")).toBeNull();
  });

  it("should return null when the path contains an empty segment", () => {
    expect(validateMarketAssetPath("/ethereum//erc20/usd_tether__erc20_")).toBeNull();
  });

  it("should return null when a segment contains unsupported characters", () => {
    expect(validateMarketAssetPath("/ethereum/erc20/<script>")).toBeNull();
  });

  it("should return null when a segment contains an encoded slash", () => {
    expect(validateMarketAssetPath("/ethereum%2Ferc20")).toBeNull();
  });

  it("should decode supported percent-encoded segment characters", () => {
    expect(validateMarketAssetPath("/ethereum/erc20/usd_tether%5F%5Ferc20%5F")).toEqual({
      currencyId: "ethereum",
      assetId: "ethereum/erc20/usd_tether__erc20_",
      ledgerIds: ["ethereum/erc20/usd_tether__erc20_"],
    });
  });
});

describe("validateMarketListCategory", () => {
  it("should return undefined when category is null", () => {
    expect(validateMarketListCategory(null)).toBeUndefined();
  });

  it("should return undefined when category is empty", () => {
    expect(validateMarketListCategory("")).toBeUndefined();
  });

  it("should return undefined for an unknown category", () => {
    expect(validateMarketListCategory("stable")).toBeUndefined();
  });

  it("should normalize and return a valid category", () => {
    expect(validateMarketListCategory(" Stocks ")).toBe("stocks");
    expect(validateMarketListCategory("STARRED")).toBe("starred");
    expect(validateMarketListCategory("all")).toBe("all");
  });
});
