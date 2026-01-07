import {
  convertApiAsset,
  convertApiAssets,
  type ApiTokenCurrency,
  type ApiCryptoCurrency,
  type ApiAsset,
} from "./api-asset-converter";

describe("convertApiAsset", () => {
  describe("Crypto currencies", () => {
    it("should convert known crypto currency correctly", () => {
      const apiCrypto: ApiCryptoCurrency = {
        type: "crypto_currency",
        id: "bitcoin",
        name: "Bitcoin",
        ticker: "BTC",
        units: [{ code: "BTC", name: "Bitcoin", magnitude: 8 }],
        family: "bitcoin",
        hasSegwit: true,
        hasTokens: false,
      };

      const result = convertApiAsset(apiCrypto);

      expect(result).toBeDefined();
      expect(result?.type).toBe("CryptoCurrency");
      expect(result?.id).toBe("bitcoin");
      expect(result?.name).toBe("Bitcoin");
      expect(result?.ticker).toBe("BTC");
    });

    it("should create dynamic crypto currency for unknown crypto currency", () => {
      const apiCrypto: ApiCryptoCurrency = {
        type: "crypto_currency",
        id: "nonexistent_coin",
        name: "Nonexistent Coin",
        ticker: "NONE",
        units: [{ code: "NONE", name: "Nonexistent Coin", magnitude: 18 }],
      };

      const result = convertApiAsset(apiCrypto);

      expect(result).toBeDefined();
      expect(result?.type).toBe("CryptoCurrency");
      expect(result?.id).toBe("nonexistent_coin");
      expect(result?.name).toBe("Nonexistent Coin");
      expect(result?.ticker).toBe("NONE");
      // Check default/placeholder values
      if (result?.type === "CryptoCurrency") {
        expect(result.managerAppName).toBe("Nonexistent Coin");
        expect(result.coinType).toBe(0);
        expect(result.scheme).toBe("nonexistent_coin");
        expect(result.color).toBe("#999999");
        expect(result.family).toBe("nonexistent_coin");
        expect(result.explorerViews).toEqual([]);
      }
    });

    it("should handle crypto currency with all optional fields", () => {
      const apiCrypto: ApiCryptoCurrency = {
        type: "crypto_currency",
        id: "ethereum",
        name: "Ethereum",
        ticker: "ETH",
        units: [{ code: "ETH", name: "Ethereum", magnitude: 18 }],
        chainId: "1",
        confirmationsNeeded: 12,
        symbol: "ETH",
        coinType: 60,
        family: "ethereum",
        hasSegwit: false,
        hasTokens: true,
        hrp: null,
      };

      const result = convertApiAsset(apiCrypto);

      expect(result).toBeDefined();
      expect(result?.type).toBe("CryptoCurrency");
      expect(result?.id).toBe("ethereum");
    });
  });

  describe("Token currencies", () => {
    it("should convert ERC20 token correctly", () => {
      const apiToken: ApiTokenCurrency = {
        type: "token_currency",
        id: "ethereum/erc20/usdc",
        contractAddress: "0xA0b86a33E6441E6e96481a83b9ceaaA8d547B8cf",
        name: "USD Coin",
        ticker: "USDC",
        units: [{ code: "USDC", name: "USD Coin", magnitude: 6 }],
        standard: "erc20",
        parentCurrency: "ethereum",
      };

      const result = convertApiAsset(apiToken);

      expect(result).toBeDefined();
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.id).toBe("ethereum/erc20/usdc");
      if (result?.type === "TokenCurrency") {
        expect(result.contractAddress).toBe("0xA0b86a33E6441E6e96481a83b9ceaaA8d547B8cf");
      }
      expect(result?.ticker).toBe("USDC");
    });

    it("should convert token with all optional fields", () => {
      const apiToken: ApiTokenCurrency = {
        type: "token_currency",
        id: "ethereum/erc20/test",
        contractAddress: "0x123...",
        name: "Test Token",
        ticker: "TEST",
        units: [{ code: "TEST", name: "Test Token", magnitude: 18 }],
        standard: "erc20",
        parentCurrency: "ethereum",
        tokenIdentifier: "test",
        symbol: "TEST",
        delisted: true,
        descriptor: { some: "data" },
      };

      const result = convertApiAsset(apiToken);

      expect(result).toBeDefined();
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.delisted).toBe(true);
    });

    it("should return undefined for unsupported token", () => {
      const apiToken: ApiTokenCurrency = {
        type: "token_currency",
        id: "unsupported/unknown/token",
        contractAddress: "0x123...",
        name: "Unsupported Token",
        ticker: "UNSUP",
        units: [{ code: "UNSUP", name: "Unsupported Token", magnitude: 18 }],
        standard: "unknown_standard",
      };

      const result = convertApiAsset(apiToken);

      expect(result).toBeUndefined();
    });
  });

  describe("Invalid assets", () => {
    it("should return undefined for invalid asset type", () => {
      const invalidAsset: ApiAsset = {
        type: "crypto_currency",
        id: "test",
        name: "Test",
        ticker: "TEST",
        units: [],
      };

      Object.defineProperty(invalidAsset, "type", {
        value: "invalid_type",
        writable: false,
      });

      const result = convertApiAsset(invalidAsset);

      expect(result).toBeUndefined();
    });
  });
});

describe("convertApiAssets", () => {
  it("should convert multiple assets correctly", () => {
    const apiAssets: Record<string, ApiAsset> = {
      btc: {
        type: "crypto_currency",
        id: "bitcoin",
        name: "Bitcoin",
        ticker: "BTC",
        units: [{ code: "BTC", name: "Bitcoin", magnitude: 8 }],
      },
      usdc: {
        type: "token_currency",
        id: "ethereum/erc20/usdc",
        contractAddress: "0xA0b86a33E6441E6e96481a83b9ceaaA8d547B8cf",
        name: "USD Coin",
        ticker: "USDC",
        units: [{ code: "USDC", name: "USD Coin", magnitude: 6 }],
        standard: "erc20",
      },
      eth: {
        type: "crypto_currency",
        id: "ethereum",
        name: "Ethereum",
        ticker: "ETH",
        units: [{ code: "ETH", name: "Ethereum", magnitude: 18 }],
      },
    };

    const result = convertApiAssets(apiAssets);

    expect(Object.keys(result)).toHaveLength(3);
    expect(result.btc).toBeDefined();
    expect(result.btc?.id).toBe("bitcoin");
    expect(result.usdc).toBeDefined();
    expect(result.usdc?.id).toBe("ethereum/erc20/usdc");
    expect(result.eth).toBeDefined();
    expect(result.eth?.id).toBe("ethereum");
  });

  it("should convert known crypto and create dynamic crypto, but skip unsupported tokens", () => {
    const apiAssets: Record<string, ApiAsset> = {
      valid: {
        type: "crypto_currency",
        id: "bitcoin",
        name: "Bitcoin",
        ticker: "BTC",
        units: [{ code: "BTC", name: "Bitcoin", magnitude: 8 }],
      },
      invalid_crypto: {
        type: "crypto_currency",
        id: "nonexistent",
        name: "Nonexistent",
        ticker: "NONE",
        units: [{ code: "NONE", name: "Nonexistent", magnitude: 18 }],
      },
      invalid_token: {
        type: "token_currency",
        id: "invalid/token/test",
        contractAddress: "0x123...",
        name: "Invalid Token",
        ticker: "INVALID",
        units: [{ code: "INVALID", name: "Invalid Token", magnitude: 18 }],
        standard: "unsupported",
      },
    };

    const result = convertApiAssets(apiAssets);

    // Now converts both known and unknown cryptocurrencies, but skips unsupported tokens
    expect(Object.keys(result)).toHaveLength(2);
    expect(result.valid).toBeDefined();
    expect(result.valid?.id).toBe("bitcoin");
    expect(result.invalid_crypto).toBeDefined();
    expect(result.invalid_crypto?.type).toBe("CryptoCurrency");
    expect(result.invalid_crypto?.id).toBe("nonexistent");
    expect(result.invalid_token).toBeUndefined();
  });

  it("should handle empty assets object", () => {
    const result = convertApiAssets({});

    expect(result).toEqual({});
  });

  it("should handle mixed valid and invalid assets", () => {
    const apiAssets: Record<string, ApiAsset> = {
      algo_asa: {
        type: "token_currency",
        id: "algorand/asa/31566704",
        contractAddress: "31566704",
        name: "USDC",
        ticker: "USDC",
        units: [{ code: "USDC", name: "USDC", magnitude: 6 }],
        standard: "asa",
      },
      ton_jetton: {
        type: "token_currency",
        id: "ton/jetton/usdt",
        contractAddress: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
        name: "Tether USD",
        ticker: "USDT",
        units: [{ code: "USDT", name: "Tether USD", magnitude: 6 }],
        standard: "jetton",
      },
      bitcoin: {
        type: "crypto_currency",
        id: "bitcoin",
        name: "Bitcoin",
        ticker: "BTC",
        units: [{ code: "BTC", name: "Bitcoin", magnitude: 8 }],
      },
    };

    const result = convertApiAssets(apiAssets);

    expect(Object.keys(result)).toHaveLength(3);
    expect(result.algo_asa).toBeDefined();
    expect(result.algo_asa?.type).toBe("TokenCurrency");
    expect(result.ton_jetton).toBeDefined();
    expect(result.ton_jetton?.type).toBe("TokenCurrency");
    expect(result.bitcoin).toBeDefined();
    expect(result.bitcoin?.type).toBe("CryptoCurrency");
  });
});
