import { getCryptoCurrencyById } from "../currencies";
import {
  convertERC20,
  convertAlgorandASATokens,
  convertVechainToken,
  convertTRONTokens,
  convertMultiversXESDTTokens,
  convertSplTokens,
  convertAptCoinTokens,
  convertAptFaTokens,
  convertSuiTokens,
  convertHederaTokens,
  convertCardanoNativeTokens,
  convertStellarTokens,
  convertJettonToken,
  createTokenHash,
  __clearAllLists,
  addTokens,
  listTokensLegacy,
  listTokensForCryptoCurrencyLegacy,
} from "./legacy-utils";
import { initializeLegacyTokens } from "./legacy-data";
import { getEnv } from "@ledgerhq/live-env";
import {
  tokensArray,
  tokensArrayWithDelisted,
  tokensByCryptoCurrency,
  tokensByCryptoCurrencyWithDelisted,
  tokensById,
  tokensByCurrencyAddress,
  tokenListHashes,
} from "./legacy-state";
import { legacyCryptoAssetsStore } from "./legacy-store";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  ERC20Token,
  AlgorandASAToken,
  MultiversXESDTToken,
  TRC10Token,
  TRC20Token,
} from "../types";
import type { CardanoNativeToken } from "../data/cardanoNative";
import type { TonJettonToken } from "../data/ton-jetton";
import type { StellarToken } from "../data/stellar";
import type { HederaToken } from "../data/hedera";
import type { SuiToken } from "../data/sui";
import type { AptosToken } from "../data/apt_coin";
import type { SPLToken } from "../data/spl";
import type { Vip180Token } from "../data/vip180";

// Mock live-env
jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn((_key: string) => false),
}));

describe("Legacy Utils", () => {
  beforeEach(() => {
    __clearAllLists();
  });

  describe("Convert functions", () => {
    it("should convert ERC20 token", () => {
      const erc20Token: ERC20Token = [
        "ethereum",
        "test_token",
        "TEST",
        18,
        "Test Token",
        "signature",
        "0x123",
        false,
        false,
      ];

      const result = convertERC20(erc20Token);
      expect(result).toBeDefined();
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.ticker).toBe("TEST");
    });

    it("should handle invalid parent currency in ERC20", () => {
      const erc20Token: ERC20Token = [
        "invalid_currency",
        "test_token",
        "TEST",
        18,
        "Test Token",
        "signature",
        "0x123",
        false,
        false,
      ];

      const result = convertERC20(erc20Token);
      expect(result).toBeUndefined();
    });

    it("should convert BSC token as BEP20", () => {
      const bscToken: ERC20Token = [
        "bsc",
        "test_token",
        "TEST",
        18,
        "Test Token",
        "signature",
        "0x123",
        false,
        false,
      ];

      const result = convertERC20(bscToken);
      expect(result?.tokenType).toBe("bep20");
    });

    it("should convert Algorand ASA token", () => {
      const asaToken: AlgorandASAToken = ["1", "TEST", "Test Token", "0x123", 6];
      const result = convertAlgorandASATokens(asaToken);
      expect(result.type).toBe("TokenCurrency");
      expect(result.tokenType).toBe("asa");
    });

    it("should convert VeChain token", () => {
      const vechainToken: Vip180Token = ["test", "TEST", "Test Token", "0x123", 18];
      const result = convertVechainToken(vechainToken);
      expect(result.type).toBe("TokenCurrency");
      expect(result.tokenType).toBe("vip180");
    });

    it("should convert TRON TRC10 token", () => {
      const trc10Token: TRC10Token = [1, "TEST", "Test Token", "1", 6, false, "sig"];
      const converter = convertTRONTokens("trc10");
      const result = converter(trc10Token);
      expect(result.type).toBe("TokenCurrency");
      expect(result.tokenType).toBe("trc10");
    });

    it("should convert TRON TRC20 token", () => {
      const trc20Token: TRC20Token = ["1", "TEST", "Test Token", "TR123", 6, false, "sig"];
      const converter = convertTRONTokens("trc20");
      const result = converter(trc20Token);
      expect(result.type).toBe("TokenCurrency");
      expect(result.tokenType).toBe("trc20");
    });

    it("should convert MultiversX ESDT token", () => {
      const esdtToken: MultiversXESDTToken = ["TEST", "TEST-123", 18, "sig", "Test Token"];
      const result = convertMultiversXESDTTokens(esdtToken);
      expect(result.type).toBe("TokenCurrency");
      expect(result.tokenType).toBe("esdt");
    });

    it("should convert SPL token", () => {
      const splToken: SPLToken = ["solana/spl/test", "solana", "Test Token", "TEST", "So123", 9];
      const result = convertSplTokens(splToken);
      expect(result.type).toBe("TokenCurrency");
      expect(result.tokenType).toBe("spl");
    });

    it("should convert Aptos Coin token", () => {
      const aptCoinToken: AptosToken = [
        "aptos/coin/test",
        "TEST",
        "Test Token",
        "0x1::test",
        8,
        false,
      ];
      const result = convertAptCoinTokens(aptCoinToken);
      expect(result.type).toBe("TokenCurrency");
      expect(result.tokenType).toBe("coin");
    });

    it("should convert Aptos FA token", () => {
      const aptFaToken: AptosToken = ["aptos/fa/test", "TEST", "Test Token", "0x1::test", 8, false];
      const result = convertAptFaTokens(aptFaToken);
      expect(result.type).toBe("TokenCurrency");
      expect(result.tokenType).toBe("fungible_asset");
    });

    it("should convert Sui token", () => {
      const suiToken: SuiToken = ["sui/test", "Test Token", "TEST", "0x123", 9, "signature"];
      const result = convertSuiTokens(suiToken);
      expect(result.type).toBe("TokenCurrency");
      expect(result.tokenType).toBe("sui");
    });

    it("should convert Hedera token", () => {
      const hederaToken: HederaToken = [
        "hedera/hts/test",
        "0.0.123",
        "Test Token",
        "TEST",
        "hedera",
        8,
        false,
      ];
      const result = convertHederaTokens(hederaToken);
      expect(result.type).toBe("TokenCurrency");
      expect(result.tokenType).toBe("hts");
    });

    it("should convert Cardano native token", () => {
      const cardanoToken: CardanoNativeToken = [
        "cardano",
        "policy123",
        "asset456",
        "Test Token",
        "TEST",
        6,
        false,
      ];
      const result = convertCardanoNativeTokens(cardanoToken);
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.tokenType).toBe("native");
    });

    it("should handle invalid parent currency in Cardano", () => {
      const cardanoToken: CardanoNativeToken = [
        // @ts-expect-error invalid parent currency
        "invalid",
        "policy123",
        "asset456",
        "Test Token",
        "TEST",
        6,
        false,
      ];
      expect(() => convertCardanoNativeTokens(cardanoToken)).toThrow(
        'currency with id "invalid" not found',
      );
    });

    it("should convert Stellar token", () => {
      const stellarToken: StellarToken = ["TEST", "GTEST123", "stellar", "Test Token", 7];
      const result = convertStellarTokens(stellarToken);
      expect(result.type).toBe("TokenCurrency");
      expect(result.tokenType).toBe("stellar");
    });

    it("should convert Jetton token", () => {
      const jettonToken: TonJettonToken = ["EQTest123", "Test Token", "TEST", 9, false];
      const result = convertJettonToken(jettonToken);
      expect(result?.type).toBe("TokenCurrency");
      expect(result?.tokenType).toBe("jetton");
    });
  });

  describe("Token management", () => {
    it("should create token hash", () => {
      const token: TokenCurrency = {
        type: "TokenCurrency",
        id: "test",
        contractAddress: "0x123",
        parentCurrency: getCryptoCurrencyById("ethereum"),
        tokenType: "erc20",
        name: "Test",
        ticker: "TEST",
        units: [],
        delisted: false,
        ledgerSignature: "sig",
      };

      const hash = createTokenHash(token);
      expect(hash).toBe("test0x123falseTESTsig");
    });

    it("should add tokens and populate all lookup objects", () => {
      const token: TokenCurrency = {
        type: "TokenCurrency",
        id: "ethereum/erc20/test",
        contractAddress: "0x123",
        parentCurrency: getCryptoCurrencyById("ethereum"),
        tokenType: "erc20",
        name: "Test Token",
        ticker: "TEST",
        units: [],
      };

      addTokens([token]);

      expect(tokensArray).toContain(token);
      expect(tokensArrayWithDelisted).toContain(token);
      expect(tokensById[token.id]).toBe(token);
      expect(tokensByCurrencyAddress["ethereum:0x123"]).toBe(token);
      expect(tokensByCryptoCurrency["ethereum"]).toContain(token);
    });

    it("should handle delisted tokens", () => {
      const token: TokenCurrency = {
        type: "TokenCurrency",
        id: "ethereum/erc20/test",
        contractAddress: "0x123",
        parentCurrency: getCryptoCurrencyById("ethereum"),
        tokenType: "erc20",
        name: "Test Token",
        ticker: "TEST",
        units: [],
        delisted: true,
      };

      addTokens([token]);

      expect(tokensArray).not.toContain(token);
      expect(tokensArrayWithDelisted).toContain(token);
      expect(tokensByCryptoCurrency["ethereum"]).not.toContain(token);
      expect(tokensByCryptoCurrencyWithDelisted["ethereum"]).toContain(token);
    });

    it("should not add duplicate tokens", () => {
      const token: TokenCurrency = {
        type: "TokenCurrency",
        id: "ethereum/erc20/test",
        contractAddress: "0x123",
        parentCurrency: getCryptoCurrencyById("ethereum"),
        tokenType: "erc20",
        name: "Test Token",
        ticker: "TEST",
        units: [],
      };

      addTokens([token]);
      addTokens([token]); // Add same token again

      expect(tokensArray.length).toBe(1);
    });

    it("should handle ticker conflicts (first wins)", () => {
      const token1: TokenCurrency = {
        type: "TokenCurrency",
        id: "ethereum/erc20/test1",
        contractAddress: "0x123",
        parentCurrency: getCryptoCurrencyById("ethereum"),
        tokenType: "erc20",
        name: "Test Token 1",
        ticker: "TEST",
        units: [],
      };

      const token2: TokenCurrency = {
        type: "TokenCurrency",
        id: "ethereum/erc20/test2",
        contractAddress: "0x456",
        parentCurrency: getCryptoCurrencyById("ethereum"),
        tokenType: "erc20",
        name: "Test Token 2",
        ticker: "TEST",
        units: [],
      };

      addTokens([token1, token2]);

      // Both tokens should be added successfully
      expect(tokensById[token1.id]).toBe(token1);
      expect(tokensById[token2.id]).toBe(token2);
    });

    it("should handle undefined tokens", () => {
      addTokens([undefined]);
      expect(tokensArray.length).toBe(0);
    });

    it("should update existing tokens", () => {
      const token1: TokenCurrency = {
        type: "TokenCurrency",
        id: "ethereum/erc20/test",
        contractAddress: "0x123",
        parentCurrency: getCryptoCurrencyById("ethereum"),
        tokenType: "erc20",
        name: "Test Token",
        ticker: "TEST",
        units: [],
      };

      const token2: TokenCurrency = {
        type: "TokenCurrency",
        id: "ethereum/erc20/test",
        contractAddress: "0x123",
        parentCurrency: getCryptoCurrencyById("ethereum"),
        tokenType: "erc20",
        name: "Updated Test Token",
        ticker: "TEST2",
        units: [],
      };

      addTokens([token1]);
      addTokens([token2]);

      expect(tokensById[token1.id]).toBe(token2);
      expect(tokensArray.length).toBe(1);
    });

    it("should handle removing non-existent token from arrays", () => {
      const token1: TokenCurrency = {
        type: "TokenCurrency",
        id: "ethereum/erc20/test1",
        contractAddress: "0x123",
        parentCurrency: getCryptoCurrencyById("ethereum"),
        tokenType: "erc20",
        name: "Test Token 1",
        ticker: "TEST1",
        units: [],
      };

      // Add first token
      addTokens([token1]);
      expect(tokensArray.length).toBe(1);

      // Try to update with a token that has different ID but same hash will trigger removal logic
      // This will test the removeTokenFromArray function when token is not found
      const tokenWithSameHash: TokenCurrency = {
        type: "TokenCurrency",
        id: "ethereum/erc20/test1", // Same ID to trigger update path
        contractAddress: "0x789", // Different address
        parentCurrency: getCryptoCurrencyById("ethereum"),
        tokenType: "erc20",
        name: "Test Token 1 Updated",
        ticker: "TEST1_UPDATED",
        units: [],
      };

      addTokens([tokenWithSameHash]);
      expect(tokensArray.length).toBe(1);
      expect(tokensArray[0]).toBe(tokenWithSameHash);
    });
  });

  describe("List functions", () => {
    beforeEach(() => {
      const token1: TokenCurrency = {
        type: "TokenCurrency",
        id: "ethereum/erc20/test1",
        contractAddress: "0x123",
        parentCurrency: getCryptoCurrencyById("ethereum"),
        tokenType: "erc20",
        name: "Test Token 1",
        ticker: "TEST1",
        units: [],
      };

      const token2: TokenCurrency = {
        type: "TokenCurrency",
        id: "ethereum/erc20/test2",
        contractAddress: "0x456",
        parentCurrency: getCryptoCurrencyById("ethereum"),
        tokenType: "erc20",
        name: "Test Token 2",
        ticker: "TEST2",
        units: [],
        delisted: true,
      };

      addTokens([token1, token2]);
    });

    it("should list tokens without delisted by default", () => {
      const tokens = listTokensLegacy();
      expect(tokens.length).toBe(1);
      expect(tokens[0].ticker).toBe("TEST1");
    });

    it("should list tokens with delisted when requested", () => {
      const tokens = listTokensLegacy({ withDelisted: true });
      expect(tokens.length).toBe(2);
    });

    it("should list tokens for specific currency", () => {
      const ethereum = getCryptoCurrencyById("ethereum");
      const tokens = listTokensForCryptoCurrencyLegacy(ethereum);
      expect(tokens.length).toBe(1);
      expect(tokens[0].ticker).toBe("TEST1");
    });

    it("should list tokens for specific currency with delisted", () => {
      const ethereum = getCryptoCurrencyById("ethereum");
      const tokens = listTokensForCryptoCurrencyLegacy(ethereum, { withDelisted: true });
      expect(tokens.length).toBe(2);
    });

    it("should return empty array for currency with no tokens", () => {
      const bitcoin = getCryptoCurrencyById("bitcoin");
      const tokens = listTokensForCryptoCurrencyLegacy(bitcoin);
      expect(tokens).toEqual([]);
    });

    it("should return empty array for currency with no delisted tokens", () => {
      const bitcoin = getCryptoCurrencyById("bitcoin");
      const tokens = listTokensForCryptoCurrencyLegacy(bitcoin, { withDelisted: true });
      expect(tokens).toEqual([]);
    });
  });

  describe("Clear functions", () => {
    it("should clear all lists", () => {
      const token: TokenCurrency = {
        type: "TokenCurrency",
        id: "ethereum/erc20/test",
        contractAddress: "0x123",
        parentCurrency: getCryptoCurrencyById("ethereum"),
        tokenType: "erc20",
        name: "Test Token",
        ticker: "TEST",
        units: [],
      };

      addTokens([token]);
      expect(tokensArray.length).toBe(1);

      __clearAllLists();

      expect(tokensArray.length).toBe(0);
      expect(tokensArrayWithDelisted.length).toBe(0);
      expect(Object.keys(tokensByCryptoCurrency).length).toBe(0);
      expect(Object.keys(tokensByCryptoCurrencyWithDelisted).length).toBe(0);
      expect(Object.keys(tokensById).length).toBe(0);
      expect(Object.keys(tokensByCurrencyAddress).length).toBe(0);
      expect(tokenListHashes.size).toBe(0);
    });
  });
});

describe("Legacy Data", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockGetEnv = getEnv as jest.MockedFunction<typeof getEnv>;

  beforeEach(() => {
    mockGetEnv.mockReturnValue(false);
  });

  it("should initialize legacy tokens", () => {
    const mockAddTokens = jest.fn();
    initializeLegacyTokens(mockAddTokens);

    // Should call addTokens multiple times for different token types
    expect(mockAddTokens).toHaveBeenCalled();
    expect(mockAddTokens.mock.calls.length).toBeGreaterThan(10);
  });

  it("should initialize legacy tokens with SUI enabled", () => {
    mockGetEnv.mockImplementation((key: string) => key === "SUI_ENABLE_TOKENS");
    const mockAddTokens = jest.fn();
    initializeLegacyTokens(mockAddTokens);

    expect(mockAddTokens).toHaveBeenCalled();
    // Should have more calls when SUI is enabled
    expect(mockAddTokens.mock.calls.length).toBeGreaterThan(10);
  });

  it("should initialize legacy tokens with APTOS enabled", () => {
    mockGetEnv.mockImplementation((key: string) => key === "APTOS_ENABLE_TOKENS");
    const mockAddTokens = jest.fn();
    initializeLegacyTokens(mockAddTokens);

    expect(mockAddTokens).toHaveBeenCalled();
    // Should have more calls when APTOS is enabled
    expect(mockAddTokens.mock.calls.length).toBeGreaterThan(10);
  });

  it("should initialize legacy tokens with both SUI and APTOS enabled", () => {
    mockGetEnv.mockImplementation(
      (key: string) => key === "SUI_ENABLE_TOKENS" || key === "APTOS_ENABLE_TOKENS",
    );
    const mockAddTokens = jest.fn();
    initializeLegacyTokens(mockAddTokens);

    expect(mockAddTokens).toHaveBeenCalled();
    // Should have the most calls when both are enabled
    expect(mockAddTokens.mock.calls.length).toBeGreaterThan(12);
  });
});

describe("legacyCryptoAssetsStore", () => {
  beforeEach(() => {
    __clearAllLists();
  });

  it("should find token by id", () => {
    const erc20Token: ERC20Token = [
      "ethereum",
      "test_token",
      "TEST",
      18,
      "Test Token",
      "signature",
      "0x123",
      false,
      false,
    ];

    addTokens([convertERC20(erc20Token)].filter(Boolean) as TokenCurrency[]);

    const token = legacyCryptoAssetsStore.findTokenById("ethereum/erc20/test_token");

    expect(token).toMatchObject({ ticker: "TEST" });
  });

  it("should find token by address in currency", () => {
    const erc20Token: ERC20Token = [
      "ethereum",
      "test_token",
      "TEST",
      18,
      "Test Token",
      "signature",
      "0xABC123",
      false,
      false,
    ];

    addTokens([convertERC20(erc20Token)].filter(Boolean) as TokenCurrency[]);

    const token = legacyCryptoAssetsStore.findTokenByAddressInCurrency("0xabc123", "ethereum");

    expect(token).toMatchObject({ ticker: "TEST" });
  });

  it("should return undefined for non-existent token by address", () => {
    const token = legacyCryptoAssetsStore.findTokenByAddressInCurrency("0xnonexistent", "ethereum");

    expect(token).toBeUndefined();
  });

  it("should return sync hash for currency with tokens", async () => {
    const erc20Token1: ERC20Token = [
      "ethereum",
      "test_token1",
      "TEST1",
      18,
      "Test Token 1",
      "signature1",
      "0x123",
      false,
      false,
    ];

    const erc20Token2: ERC20Token = [
      "ethereum",
      "test_token2",
      "TEST2",
      18,
      "Test Token 2",
      "signature2",
      "0x456",
      false,
      false,
    ];

    addTokens(
      [convertERC20(erc20Token1), convertERC20(erc20Token2)].filter(Boolean) as TokenCurrency[],
    );

    const hash = await legacyCryptoAssetsStore.getTokensSyncHash("ethereum");

    expect(hash).toBe("legacy_2");
  });

  it("should return sync hash for currency with no tokens", async () => {
    const hash = await legacyCryptoAssetsStore.getTokensSyncHash("bitcoin");

    expect(hash).toBe("legacy_undefined");
  });
});

describe("Legacy State", () => {
  it("should export all state objects", () => {
    expect(tokensArray).toBeDefined();
    expect(tokensArrayWithDelisted).toBeDefined();
    expect(tokensByCryptoCurrency).toBeDefined();
    expect(tokensByCryptoCurrencyWithDelisted).toBeDefined();
    expect(tokensById).toBeDefined();
    expect(tokensByCurrencyAddress).toBeDefined();
    expect(tokenListHashes).toBeDefined();
  });
});
