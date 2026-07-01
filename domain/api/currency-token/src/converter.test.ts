import { convertApiToken } from "./converter";
import { buildApiTokenData } from "./fixtures";

describe("convertApiToken", () => {
  describe("Cardano transformation", () => {
    it("should not reconstruct if tokenIdentifier is missing", () => {
      const result = convertApiToken(
        buildApiTokenData({
          id: "cardano/native/policyId",
          contractAddress: "policyId",
          standard: "native",
        }),
      );

      expect(result?.contractAddress).toBe("policyId");
    });
  });

  describe("Sui passthrough", () => {
    it("should keep 'coin' standard as tokenType for sui tokens", () => {
      const result = convertApiToken(
        buildApiTokenData({
          id: "sui/coin/usdc_0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::usdc",
          contractAddress:
            "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
          standard: "coin",
        }),
      );

      expect(result?.tokenType).toBe("coin");
      expect(result?.parentCurrencyId).toBe("sui");
    });
  });

  describe("ledgerSignature handling", () => {
    it("should include ledgerSignature when provided", () => {
      const result = convertApiToken(buildApiTokenData({ ledgerSignature: "3045022100..." }));

      expect(result?.ledgerSignature).toBe("3045022100...");
    });

    it("should not include ledgerSignature when not provided", () => {
      const result = convertApiToken(buildApiTokenData());

      expect(result?.ledgerSignature).toBeUndefined();
    });
  });

  describe("disableCountervalue handling", () => {
    it("should set disableCountervalue for testnet currencies", () => {
      const result = convertApiToken(
        buildApiTokenData({ id: "ethereum_sepolia/erc20/usdc", contractAddress: "0x123" }),
      );

      expect(result?.disableCountervalue).toBe(true);
    });

    it("should respect explicit disableCountervalue flag", () => {
      const result = convertApiToken(
        buildApiTokenData({
          id: "ethereum/erc20/test",
          contractAddress: "0x123",
          disableCountervalue: true,
        }),
      );

      expect(result?.disableCountervalue).toBe(true);
    });

    it("should not disable countervalue for a mainnet currency without the flag", () => {
      const result = convertApiToken(buildApiTokenData());

      expect(result?.disableCountervalue).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should return undefined for unknown parent currency", () => {
      const result = convertApiToken(
        buildApiTokenData({ id: "unknowncurrency/erc20/test", contractAddress: "0x123" }),
      );

      expect(result).toBeUndefined();
    });

    it("should handle delisted tokens", () => {
      const result = convertApiToken(
        buildApiTokenData({ id: "ethereum/erc20/old", contractAddress: "0x123", delisted: true }),
      );

      expect(result?.delisted).toBe(true);
    });

    it("should handle empty units array", () => {
      const result = convertApiToken(
        buildApiTokenData({ id: "ethereum/erc20/test", contractAddress: "0x123", units: [] }),
      );

      expect(result?.units).toEqual([]);
    });
  });

  describe("Standard token types", () => {
    it("should convert ERC20 token", () => {
      const result = convertApiToken(buildApiTokenData());

      expect(result?.type).toBe("TokenCurrency");
      expect(result?.tokenType).toBe("erc20");
      expect(result?.parentCurrencyId).toBe("ethereum");
    });

    it("should convert SPL token", () => {
      const result = convertApiToken(
        buildApiTokenData({
          id: "solana/spl/usdc",
          contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          standard: "spl",
        }),
      );

      expect(result?.tokenType).toBe("spl");
      expect(result?.parentCurrencyId).toBe("solana");
    });

    it("should convert TRC20 token", () => {
      const result = convertApiToken(
        buildApiTokenData({
          id: "tron/trc20/usdt",
          contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
          standard: "trc20",
        }),
      );

      expect(result?.tokenType).toBe("trc20");
      expect(result?.parentCurrencyId).toBe("tron");
    });

    it("should convert ASA token", () => {
      const result = convertApiToken(
        buildApiTokenData({
          id: "algorand/asa/31566704",
          contractAddress: "31566704",
          standard: "asa",
        }),
      );

      expect(result?.tokenType).toBe("asa");
      expect(result?.parentCurrencyId).toBe("algorand");
    });
  });
});
