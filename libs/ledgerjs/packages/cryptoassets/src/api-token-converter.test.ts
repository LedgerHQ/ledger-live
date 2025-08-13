import { convertApiToken, type ApiTokenData } from "./api-token-converter";

describe("convertApiToken", () => {
  describe("ERC20 tokens", () => {
    it("should convert ERC20 token correctly", () => {
      const apiToken: ApiTokenData = {
        id: "ethereum/erc20/usdc",
        contractAddress: "0xA0b86a33E6441E6e96481a83b9ceaaA8d547B8cf",
        name: "USD Coin",
        ticker: "USDC",
        units: [{ code: "USDC", name: "USD Coin", magnitude: 6 }],
        standard: "erc20",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeDefined();
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.id).toBe("ethereum/erc20/usdc");
      expect(result?.contractAddress).toBe("0xA0b86a33E6441E6e96481a83b9ceaaA8d547B8cf");
      expect(result?.ticker).toBe("USDC");
      expect(result?.name).toBe("USD Coin");
      expect(result?.parentCurrency?.id).toBe("ethereum");
      expect(result?.tokenType).toBe("erc20");
    });

    it("should convert BEP20 token correctly", () => {
      const apiToken: ApiTokenData = {
        id: "bsc/bep20/usdt",
        contractAddress: "0x55d398326f99059fF775485246999027B3197955",
        name: "Tether USD",
        ticker: "USDT",
        units: [{ code: "USDT", name: "Tether USD", magnitude: 18 }],
        standard: "bep20",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeDefined();
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.parentCurrency?.id).toBe("bsc");
      expect(result?.tokenType).toBe("bep20");
    });
  });

  describe("SPL tokens", () => {
    it("should convert SPL token correctly", () => {
      const apiToken: ApiTokenData = {
        id: "solana/spl/usdc",
        contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        name: "USD Coin",
        ticker: "USDC",
        units: [{ code: "USDC", name: "USD Coin", magnitude: 6 }],
        standard: "spl",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeDefined();
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.parentCurrency?.id).toBe("solana");
      expect(result?.tokenType).toBe("spl");
    });
  });

  describe("Jetton tokens", () => {
    it("should convert Jetton token correctly", () => {
      const apiToken: ApiTokenData = {
        id: "ton/jetton/usdt",
        contractAddress: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
        name: "Tether USD",
        ticker: "USDT",
        units: [{ code: "USDT", name: "Tether USD", magnitude: 6 }],
        standard: "jetton",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeDefined();
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.parentCurrency?.id).toBe("ton");
      expect(result?.tokenType).toBe("jetton");
    });
  });

  describe("ASA tokens", () => {
    it("should convert ASA token correctly", () => {
      const apiToken: ApiTokenData = {
        id: "algorand/asa/31566704",
        contractAddress: "31566704",
        name: "USDC",
        ticker: "USDC",
        units: [{ code: "USDC", name: "USDC", magnitude: 6 }],
        standard: "asa",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeDefined();
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.id).toBe("algorand/asa/31566704");
      expect(result?.parentCurrency?.id).toBe("algorand");
      expect(result?.tokenType).toBe("asa");
    });
  });

  describe("ESDT tokens", () => {
    it("should convert ESDT token correctly", () => {
      const apiToken: ApiTokenData = {
        id: "elrond/esdt/USDC-c76f1f",
        contractAddress: "USDC-c76f1f",
        name: "WrappedUSDC",
        ticker: "USDC",
        units: [{ code: "USDC", name: "WrappedUSDC", magnitude: 6 }],
        standard: "esdt",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeDefined();
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.id).toBe("multiversx/esdt/USDC-c76f1f");
      expect(result?.parentCurrency?.id).toBe("elrond");
      expect(result?.tokenType).toBe("esdt");
    });
  });

  describe("TRON tokens", () => {
    it("should convert TRC20 token correctly", () => {
      const apiToken: ApiTokenData = {
        id: "tron/trc20/usdt",
        contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        name: "Tether USD",
        ticker: "USDT",
        units: [{ code: "USDT", name: "Tether USD", magnitude: 6 }],
        standard: "trc20",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeDefined();
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.id).toBe("tron/trc20/usdt");
      expect(result?.parentCurrency?.id).toBe("tron");
      expect(result?.tokenType).toBe("trc20");
    });

    it("should convert TRC10 token correctly", () => {
      const apiToken: ApiTokenData = {
        id: "tron/trc10/1002000",
        contractAddress: "1002000",
        name: "BitTorrent",
        ticker: "BTT",
        units: [{ code: "BTT", name: "BitTorrent", magnitude: 6 }],
        standard: "trc10",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeDefined();
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.id).toBe("tron/trc10/1002000");
      expect(result?.parentCurrency?.id).toBe("tron");
      expect(result?.tokenType).toBe("trc10");
    });
  });

  describe("VeChain tokens", () => {
    it("should convert VIP180 token correctly", () => {
      const apiToken: ApiTokenData = {
        id: "vechain/vip180/vtho",
        contractAddress: "0x0000000000000000000000000000456E65726779",
        name: "VeThor Token",
        ticker: "VTHO",
        units: [{ code: "VTHO", name: "VeThor Token", magnitude: 18 }],
        standard: "vip180",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeDefined();
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.id).toBe("vechain/vip180/vtho");
      expect(result?.parentCurrency?.id).toBe("vechain");
      expect(result?.tokenType).toBe("vip180");
    });
  });

  describe("Cardano native tokens", () => {
    it("should convert Cardano native token correctly", () => {
      const apiToken: ApiTokenData = {
        id: "cardano/native/f43a62fdc3965df486de8a0d32fe800963589c41b38946602a0dc535.41474958",
        contractAddress: "f43a62fdc3965df486de8a0d32fe800963589c41b38946602a0dc535.41474958",
        name: "AGIX",
        ticker: "AGIX",
        units: [{ code: "AGIX", name: "AGIX", magnitude: 8 }],
        standard: "native",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeDefined();
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.id).toBe(
        "cardano/native/f43a62fdc3965df486de8a0d32fe800963589c41b38946602a0dc53541474958",
      );
      expect(result?.parentCurrency?.id).toBe("cardano");
      expect(result?.tokenType).toBe("native");
    });

    it("should return undefined for non-cardano native tokens", () => {
      const apiToken: ApiTokenData = {
        id: "ethereum/native/test",
        contractAddress: "test",
        name: "Test Token",
        ticker: "TEST",
        units: [{ code: "TEST", name: "Test Token", magnitude: 18 }],
        standard: "native",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeUndefined();
    });
  });

  describe("Stellar tokens", () => {
    it("should convert Stellar token correctly", () => {
      const apiToken: ApiTokenData = {
        id: "stellar/asset/USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        contractAddress: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        name: "USD Coin",
        ticker: "USDC",
        units: [{ code: "USDC", name: "USD Coin", magnitude: 7 }],
        standard: "stellar",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeDefined();
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.id).toBe(
        "stellar/asset/USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      );
      expect(result?.parentCurrency?.id).toBe("stellar");
      expect(result?.tokenType).toBe("stellar");
    });
  });

  describe("Aptos tokens", () => {
    it("should convert Aptos coin token correctly", () => {
      const apiToken: ApiTokenData = {
        id: "aptos/coin/0x1::aptos_coin::AptosCoin",
        contractAddress: "0x1::aptos_coin::AptosCoin",
        name: "Aptos Coin",
        ticker: "APT",
        units: [{ code: "APT", name: "Aptos Coin", magnitude: 8 }],
        standard: "coin",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeDefined();
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.parentCurrency?.id).toBe("aptos");
      expect(result?.tokenType).toBe("coin");
    });

    it("should convert Aptos fungible asset correctly", () => {
      const apiToken: ApiTokenData = {
        id: "aptos/fungible_asset/0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
        contractAddress:
          "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
        name: "Tether USD",
        ticker: "USDT",
        units: [{ code: "USDT", name: "Tether USD", magnitude: 6 }],
        standard: "fungible_asset",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeDefined();
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.parentCurrency?.id).toBe("aptos");
      expect(result?.tokenType).toBe("fungible_asset");
    });
  });

  describe("Sui tokens", () => {
    it("should convert Sui token correctly", () => {
      const apiToken: ApiTokenData = {
        id: "sui/sui/0x2::sui::SUI",
        contractAddress: "0x2::sui::SUI",
        name: "Sui",
        ticker: "SUI",
        units: [{ code: "SUI", name: "Sui", magnitude: 9 }],
        standard: "sui",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeDefined();
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.parentCurrency?.id).toBe("sui");
      expect(result?.tokenType).toBe("sui");
    });
  });

  describe("Unknown token standards", () => {
    it("should create generic token for unknown standard", () => {
      const apiToken: ApiTokenData = {
        id: "ethereum/unknown/test",
        contractAddress: "0x123...",
        name: "Test Token",
        ticker: "TEST",
        units: [{ code: "TEST", name: "Test Token", magnitude: 18 }],
        standard: "unknown",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeDefined();
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.parentCurrency?.id).toBe("ethereum");
      expect(result?.tokenType).toBe("unknown");
    });

    it("should return undefined for unknown parent currency", () => {
      const apiToken: ApiTokenData = {
        id: "nonexistent/unknown/test",
        contractAddress: "0x123...",
        name: "Test Token",
        ticker: "TEST",
        units: [{ code: "TEST", name: "Test Token", magnitude: 18 }],
        standard: "unknown",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeUndefined();
    });
  });

  describe("Edge cases", () => {
    it("should handle delisted tokens", () => {
      const apiToken: ApiTokenData = {
        id: "ethereum/erc20/test",
        contractAddress: "0x123...",
        name: "Test Token",
        ticker: "TEST",
        units: [{ code: "TEST", name: "Test Token", magnitude: 18 }],
        standard: "erc20",
        delisted: true,
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeDefined();
      expect(result?.delisted).toBe(true);
    });

    it("should handle tokens with disableCountervalue", () => {
      const apiToken: ApiTokenData = {
        id: "ethereum/erc20/test",
        contractAddress: "0x123...",
        name: "Test Token",
        ticker: "TEST",
        units: [{ code: "TEST", name: "Test Token", magnitude: 18 }],
        standard: "erc20",
        disableCountervalue: true,
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeDefined();
      expect(result?.disableCountervalue).toBe(true);
    });

    it("should handle missing units gracefully", () => {
      const apiToken: ApiTokenData = {
        id: "ethereum/erc20/test",
        contractAddress: "0x123...",
        name: "Test Token",
        ticker: "TEST",
        units: [],
        standard: "erc20",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeDefined();
    });

    it("should handle complex token identifiers", () => {
      const apiToken: ApiTokenData = {
        id: "cardano/native/policy123.asset456",
        contractAddress: "policy123.asset456",
        name: "Complex Token",
        ticker: "COMPLEX",
        units: [{ code: "COMPLEX", name: "Complex Token", magnitude: 6 }],
        standard: "native",
      };

      const result = convertApiToken(apiToken);

      expect(result).toBeDefined();
      expect(result?.id).toBe("cardano/native/policy123asset456");
    });
  });
});
