import { convertApiToken, type ApiTokenData } from "./api-token-converter";

describe("convertApiToken", () => {
  describe("Cardano transformation", () => {
    it("should reconstruct contractAddress from policyId + tokenIdentifier", () => {
      const apiToken: ApiTokenData = {
        id: "cardano/native/policyId.assetName",
        contractAddress: "policyId",
        name: "Test Token",
        ticker: "TEST",
        units: [{ code: "TEST", name: "Test Token", magnitude: 6 }],
        standard: "native",
        tokenIdentifier: ".assetName",
      };

      const result = convertApiToken(apiToken);

      expect(result?.contractAddress).toBe("policyId.assetName");
      expect(result?.tokenType).toBe("native");
    });

    it("should not reconstruct if tokenIdentifier is missing", () => {
      const apiToken: ApiTokenData = {
        id: "cardano/native/policyId",
        contractAddress: "policyId",
        name: "Test Token",
        ticker: "TEST",
        units: [{ code: "TEST", name: "Test Token", magnitude: 6 }],
        standard: "native",
      };

      const result = convertApiToken(apiToken);

      expect(result?.contractAddress).toBe("policyId");
    });
  });

  describe("Sui transformation", () => {
    it("should transform coin standard to sui for sui tokens", () => {
      const apiToken: ApiTokenData = {
        id: "sui/coin/0x2::sui::SUI",
        contractAddress: "0x2::sui::SUI",
        name: "Sui",
        ticker: "SUI",
        units: [{ code: "SUI", name: "Sui", magnitude: 9 }],
        standard: "coin",
      };

      const result = convertApiToken(apiToken);

      expect(result?.tokenType).toBe("sui");
    });

    it("should not transform coin standard for non-sui tokens", () => {
      const apiToken: ApiTokenData = {
        id: "aptos/coin/0x1::aptos_coin::AptosCoin",
        contractAddress: "0x1::aptos_coin::AptosCoin",
        name: "Aptos Coin",
        ticker: "APT",
        units: [{ code: "APT", name: "Aptos Coin", magnitude: 8 }],
        standard: "coin",
      };

      const result = convertApiToken(apiToken);

      expect(result?.tokenType).toBe("coin");
    });
  });

  describe("ledgerSignature handling", () => {
    it("should include ledgerSignature when provided", () => {
      const apiToken: ApiTokenData = {
        id: "ethereum/erc20/usdc",
        contractAddress: "0xA0b86",
        name: "USD Coin",
        ticker: "USDC",
        units: [{ code: "USDC", name: "USD Coin", magnitude: 6 }],
        standard: "erc20",
        ledgerSignature: "3045022100...",
      };

      const result = convertApiToken(apiToken);

      expect(result?.ledgerSignature).toBe("3045022100...");
    });

    it("should not include ledgerSignature when not provided", () => {
      const apiToken: ApiTokenData = {
        id: "ethereum/erc20/usdc",
        contractAddress: "0xA0b86",
        name: "USD Coin",
        ticker: "USDC",
        units: [{ code: "USDC", name: "USD Coin", magnitude: 6 }],
        standard: "erc20",
      };

      const result = convertApiToken(apiToken);

      expect(result?.ledgerSignature).toBeUndefined();
    });
  });

  describe("disableCountervalue handling", () => {
    it("should set disableCountervalue for testnet currencies", () => {
      const apiToken: ApiTokenData = {
        id: "ethereum_sepolia/erc20/usdc",
        contractAddress: "0x123",
        name: "USD Coin",
        ticker: "USDC",
        units: [{ code: "USDC", name: "USD Coin", magnitude: 6 }],
        standard: "erc20",
      };

      const result = convertApiToken(apiToken);

      expect(result?.disableCountervalue).toBe(true);
    });

    it("should respect explicit disableCountervalue flag", () => {
      const apiToken: ApiTokenData = {
        id: "ethereum/erc20/test",
        contractAddress: "0x123",
        name: "Test Token",
        ticker: "TEST",
        units: [{ code: "TEST", name: "Test Token", magnitude: 18 }],
        standard: "erc20",
        disableCountervalue: true,
      };

      const result = convertApiToken(apiToken);

      expect(result?.disableCountervalue).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("should return undefined for unknown parent currency", () => {
      const apiToken: ApiTokenData = {
        id: "unknowncurrency/erc20/test",
        contractAddress: "0x123",
        name: "Test",
        ticker: "TEST",
        units: [{ code: "TEST", name: "Test", magnitude: 18 }],
        standard: "erc20",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeUndefined();
    });

    it("should handle delisted tokens", () => {
      const apiToken: ApiTokenData = {
        id: "ethereum/erc20/old",
        contractAddress: "0x123",
        name: "Old Token",
        ticker: "OLD",
        units: [{ code: "OLD", name: "Old Token", magnitude: 18 }],
        standard: "erc20",
        delisted: true,
      };

      const result = convertApiToken(apiToken);

      expect(result?.delisted).toBe(true);
    });

    it("should handle empty units array", () => {
      const apiToken: ApiTokenData = {
        id: "ethereum/erc20/test",
        contractAddress: "0x123",
        name: "Test",
        ticker: "TEST",
        units: [],
        standard: "erc20",
      };

      const result = convertApiToken(apiToken);

      expect(result?.units).toEqual([]);
    });
  });

  describe("Standard token types", () => {
    it("should convert ERC20 token", () => {
      const apiToken: ApiTokenData = {
        id: "ethereum/erc20/usdc",
        contractAddress: "0xA0b86",
        name: "USD Coin",
        ticker: "USDC",
        units: [{ code: "USDC", name: "USD Coin", magnitude: 6 }],
        standard: "erc20",
      };

      const result = convertApiToken(apiToken);

      expect(result?.type).toBe("TokenCurrency");
      expect(result?.tokenType).toBe("erc20");
      expect(result?.parentCurrency?.id).toBe("ethereum");
    });

    it("should convert SPL token", () => {
      const apiToken: ApiTokenData = {
        id: "solana/spl/usdc",
        contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        name: "USD Coin",
        ticker: "USDC",
        units: [{ code: "USDC", name: "USD Coin", magnitude: 6 }],
        standard: "spl",
      };

      const result = convertApiToken(apiToken);

      expect(result?.tokenType).toBe("spl");
      expect(result?.parentCurrency?.id).toBe("solana");
    });

    it("should convert TRC20 token", () => {
      const apiToken: ApiTokenData = {
        id: "tron/trc20/usdt",
        contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        name: "Tether USD",
        ticker: "USDT",
        units: [{ code: "USDT", name: "Tether USD", magnitude: 6 }],
        standard: "trc20",
      };

      const result = convertApiToken(apiToken);

      expect(result?.tokenType).toBe("trc20");
    });

    it("should convert ASA token", () => {
      const apiToken: ApiTokenData = {
        id: "algorand/asa/31566704",
        contractAddress: "31566704",
        name: "USDC",
        ticker: "USDC",
        units: [{ code: "USDC", name: "USDC", magnitude: 6 }],
        standard: "asa",
      };

      const result = convertApiToken(apiToken);

      expect(result?.tokenType).toBe("asa");
    });
  });
});
