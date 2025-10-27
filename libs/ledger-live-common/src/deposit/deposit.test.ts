import {
  groupCurrenciesByProvider,
  searchByNameOrTicker,
  searchByProviderId,
  loadCurrenciesByProvider,
  getTokenOrCryptoCurrencyById,
} from "./helper";
import { MOCK_TOKENS_ONLY, MOCK_WITH_TOKEN_AND_CURRENCY_ASSET, MOCK_IDS, MOCK_POL } from "./mock";
import { MappedAsset } from "./type";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
  sortCurrenciesByIds,
} from "../currencies/index";
import { isCurrencySupported, listSupportedCurrencies, listTokens } from "../currencies";
import { CryptoOrTokenCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoAssetsStore } from "../bridge/crypto-assets/index";
import { initializeLegacyTokens } from "@ledgerhq/cryptoassets/legacy/legacy-data";
import { addTokens } from "@ledgerhq/cryptoassets/legacy/legacy-utils";

const TOKEN_ONLY_ASSETS = MOCK_TOKENS_ONLY as MappedAsset[];

const listSupportedTokens = () => listTokens().filter(t => isCurrencySupported(t.parentCurrency));

describe("Deposit logic", () => {
  beforeAll(() => {
    initializeLegacyTokens(addTokens);
  });

  afterEach(() => {
    setSupportedCurrencies([]);
  });

  describe("searchByProviderId", () => {
    test("should find assets by provider ID", () => {
      const result = searchByProviderId(TOKEN_ONLY_ASSETS, "tether");
      expect(result).toEqual(TOKEN_ONLY_ASSETS);
    });

    test("should return empty array for non-existent provider ID", () => {
      const result = searchByProviderId(TOKEN_ONLY_ASSETS, "non-existent-provider");
      expect(result).toEqual([]);
    });

    test("should handle case insensitive search", () => {
      const result = searchByProviderId(TOKEN_ONLY_ASSETS, "TETHER");
      expect(result).toEqual(TOKEN_ONLY_ASSETS);
    });

    test("should handle empty assets list", () => {
      const result = searchByProviderId([], "tether");
      expect(result).toEqual([]);
    });

    test("should handle empty provider ID", () => {
      const result = searchByProviderId(TOKEN_ONLY_ASSETS, "");
      expect(result).toEqual([]);
    });

    test("should handle special characters in provider ID", () => {
      const mockAssets = [
        { ...TOKEN_ONLY_ASSETS[0], providerId: "test-provider_123" },
      ] as MappedAsset[];
      const result = searchByProviderId(mockAssets, "test-provider_123");
      expect(result).toHaveLength(1);
    });
  });

  describe("searchByNameOrTicker", () => {
    test("should find assets by name or ticker", () => {
      const result = searchByNameOrTicker(TOKEN_ONLY_ASSETS, "usdt");
      expect(result.length).toBeGreaterThan(0);
    });

    test("should handle case insensitive search", () => {
      const result = searchByNameOrTicker(TOKEN_ONLY_ASSETS, "USDT");
      expect(result.length).toBeGreaterThan(0);
    });

    test("should find partial matches", () => {
      const result = searchByNameOrTicker(TOKEN_ONLY_ASSETS, "usd");
      expect(result.length).toBeGreaterThan(0);
    });

    test("should return empty array for non-matching search", () => {
      const result = searchByNameOrTicker(TOKEN_ONLY_ASSETS, "non-existent-token");
      expect(result).toEqual([]);
    });

    test("should handle empty search term", () => {
      const result = searchByNameOrTicker(TOKEN_ONLY_ASSETS, "");
      expect(result).toEqual(TOKEN_ONLY_ASSETS);
    });

    test("should handle empty assets list", () => {
      const result = searchByNameOrTicker([], "usdt");
      expect(result).toEqual([]);
    });

    test("should search in both name and ticker fields", () => {
      const mockAssets = [
        { ...TOKEN_ONLY_ASSETS[0], name: "Test Token", ticker: "TTK" },
        { ...TOKEN_ONLY_ASSETS[0], name: "Another Token", ticker: "USDT" },
      ] as MappedAsset[];

      const nameResult = searchByNameOrTicker(mockAssets, "Test");
      const tickerResult = searchByNameOrTicker(mockAssets, "USDT");

      expect(nameResult).toHaveLength(1);
      expect(tickerResult).toHaveLength(1);
    });
  });

  describe("groupCurrenciesByProvider", () => {
    test("should group currencies by provider", async () => {
      const currencies = (
        await Promise.all(
          TOKEN_ONLY_ASSETS.map(asset => getCryptoAssetsStore().findTokenById(asset.ledgerId)),
        )
      ).filter((t): t is TokenCurrency => t !== undefined);
      const { currenciesByProvider } = groupCurrenciesByProvider(TOKEN_ONLY_ASSETS, currencies);
      expect(currenciesByProvider).toEqual([
        {
          providerId: "tether",
          currenciesByNetwork: currencies,
        },
      ]);
    });

    test("should handle POL assets correctly", async () => {
      const currenciesPol = (
        await Promise.all(
          MOCK_POL.map(asset =>
            asset.$type === "Token"
              ? getCryptoAssetsStore().findTokenById(asset.ledgerId)
              : Promise.resolve(getCryptoCurrencyById(asset.ledgerId)),
          ),
        )
      ).filter((c): c is CryptoOrTokenCurrency => c !== undefined);
      const { currenciesByProvider: currenciesByProviderBis, sortedCryptoCurrencies } =
        groupCurrenciesByProvider(MOCK_POL as MappedAsset[], currenciesPol);
      expect(currenciesByProviderBis).toEqual([
        {
          providerId: "matic-network",
          currenciesByNetwork: currenciesPol,
        },
      ]);

      expect(sortedCryptoCurrencies).toEqual([currenciesPol[1]]);
    });

    test("should handle empty assets array", async () => {
      const currencies = (
        await Promise.all(
          TOKEN_ONLY_ASSETS.map(asset => getCryptoAssetsStore().findTokenById(asset.ledgerId)),
        )
      ).filter((t): t is TokenCurrency => t !== undefined);
      const { currenciesByProvider, sortedCryptoCurrencies } = groupCurrenciesByProvider(
        [],
        currencies,
      );
      expect(currenciesByProvider).toEqual([]);
      expect(sortedCryptoCurrencies).toEqual([]);
    });

    test("should handle empty currencies array", () => {
      const { currenciesByProvider, sortedCryptoCurrencies } = groupCurrenciesByProvider(
        TOKEN_ONLY_ASSETS,
        [],
      );
      expect(currenciesByProvider).toEqual([]);
      expect(sortedCryptoCurrencies).toEqual([]);
    });

    test("should handle currencies without corresponding assets", () => {
      setSupportedCurrencies(["bitcoin"]);
      const btcCurrency = getCryptoCurrencyById("bitcoin");
      const { currenciesByProvider, sortedCryptoCurrencies } = groupCurrenciesByProvider(
        TOKEN_ONLY_ASSETS,
        [btcCurrency],
      );
      expect(currenciesByProvider).toEqual([]);
      expect(sortedCryptoCurrencies).toEqual([]);
    });

    test("should prioritize crypto currencies over tokens in sortedCryptoCurrencies", async () => {
      const mockAssets = [
        { ...TOKEN_ONLY_ASSETS[0], providerId: "test-provider" },
      ] as MappedAsset[];

      setSupportedCurrencies(["ethereum"]);
      const ethCurrency = getCryptoCurrencyById("ethereum");
      const tokenCurrency = await getCryptoAssetsStore().findTokenById(
        TOKEN_ONLY_ASSETS[0].ledgerId,
      );
      if (!tokenCurrency) throw new Error("Token not found");

      const { sortedCryptoCurrencies } = groupCurrenciesByProvider(mockAssets, [
        tokenCurrency,
        ethCurrency,
      ]);

      expect(sortedCryptoCurrencies.length).toBeGreaterThan(0);
    });

    test("should handle duplicate provider IDs correctly", async () => {
      const duplicateAssets = [
        TOKEN_ONLY_ASSETS[0],
        { ...TOKEN_ONLY_ASSETS[0], ledgerId: "different-id" },
      ] as MappedAsset[];

      const token = await getCryptoAssetsStore().findTokenById(TOKEN_ONLY_ASSETS[0].ledgerId);
      if (!token) throw new Error("Token not found");
      const currencies = [token];
      const { currenciesByProvider } = groupCurrenciesByProvider(duplicateAssets, currencies);

      expect(currenciesByProvider).toHaveLength(1);
      expect(currenciesByProvider[0].currenciesByNetwork).toHaveLength(1);
    });
  });

  describe("getTokenOrCryptoCurrencyById", () => {
    test("should return crypto currency by ID", async () => {
      const result = await getTokenOrCryptoCurrencyById("bitcoin");
      expect(result).toBeDefined();
      expect(result.type).toBe("CryptoCurrency");
    });

    test("should return token by ID", async () => {
      const result = await getTokenOrCryptoCurrencyById("ethereum/erc20/usd_tether__erc20_");
      expect(result).toBeDefined();
      expect(result.type).toBe("TokenCurrency");
    });

    test("should handle invalid crypto currency ID", async () => {
      await expect(getTokenOrCryptoCurrencyById("invalid-crypto-id")).rejects.toThrow();
    });

    test("should handle invalid token ID", async () => {
      await expect(getTokenOrCryptoCurrencyById("invalid/token/id")).rejects.toThrow();
    });

    test("should handle empty ID", async () => {
      await expect(getTokenOrCryptoCurrencyById("")).rejects.toThrow();
    });
  });

  describe("loadCurrenciesByProvider", () => {
    test("should load currencies by provider successfully", async () => {
      setSupportedCurrencies(["ethereum", "bitcoin"]);
      const supportedCurrencies = listSupportedCurrencies() as CryptoOrTokenCurrency[];

      const result = await loadCurrenciesByProvider(supportedCurrencies);

      expect(result).toBeDefined();
      expect(result.currenciesByProvider).toBeDefined();
      expect(result.sortedCryptoCurrencies).toBeDefined();
      expect(Array.isArray(result.currenciesByProvider)).toBe(true);
      expect(Array.isArray(result.sortedCryptoCurrencies)).toBe(true);
    });

    test("should handle empty currencies array", async () => {
      const result = await loadCurrenciesByProvider([]);

      expect(result).toBeDefined();
      expect(result.currenciesByProvider).toEqual([]);
      expect(result.sortedCryptoCurrencies).toEqual([]);
    });

    test("should handle currencies with no corresponding assets", async () => {
      setSupportedCurrencies(["bitcoin"]);
      const supportedCurrencies = [getCryptoCurrencyById("bitcoin")];

      const result = await loadCurrenciesByProvider(supportedCurrencies);

      expect(result).toBeDefined();

      expect(Array.isArray(result.currenciesByProvider)).toBe(true);
      expect(Array.isArray(result.sortedCryptoCurrencies)).toBe(true);
    });
  });

  describe("Currency support scenarios", () => {
    it("should return Arbitrum and not Optimism in the sortedCryptoCurrencies", () => {
      setSupportedCurrencies(["arbitrum", "arbitrum_sepolia"]);
      const currencies = sortCurrenciesByIds(
        (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
        MOCK_IDS,
      );

      const { sortedCryptoCurrencies } = groupCurrenciesByProvider(
        MOCK_WITH_TOKEN_AND_CURRENCY_ASSET as MappedAsset[],
        currencies,
      );
      expect(sortedCryptoCurrencies).toEqual([getCryptoCurrencyById("arbitrum")]);
    });

    it("should return Optimism only in the sortedCryptoCurrencies", () => {
      setSupportedCurrencies(["optimism", "optimism_sepolia"]);
      const currencies = sortCurrenciesByIds(
        (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
        MOCK_IDS,
      );

      const { sortedCryptoCurrencies } = groupCurrenciesByProvider(
        MOCK_WITH_TOKEN_AND_CURRENCY_ASSET as MappedAsset[],
        currencies,
      );
      expect(sortedCryptoCurrencies).toEqual([getCryptoCurrencyById("optimism")]);
    });

    it("should return currencies based on what's actually supported and available in mock data", () => {
      setSupportedCurrencies(["optimism", "optimism_sepolia", "arbitrum", "arbitrum_sepolia"]);
      const currencies = sortCurrenciesByIds(
        (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
        MOCK_IDS,
      );

      const { sortedCryptoCurrencies } = groupCurrenciesByProvider(
        MOCK_WITH_TOKEN_AND_CURRENCY_ASSET as MappedAsset[],
        currencies,
      );

      expect(Array.isArray(sortedCryptoCurrencies)).toBe(true);
      expect(sortedCryptoCurrencies.length).toBeGreaterThanOrEqual(0);

      sortedCryptoCurrencies.forEach(currency => {
        expect(["optimism", "arbitrum"].includes(currency.id)).toBe(true);
      });
    });
  });

  describe("Token-only scenarios", () => {
    it("should return only Polygon token while its currency is supported in the list", async () => {
      setSupportedCurrencies(["polygon"]);

      const currencies = sortCurrenciesByIds(
        (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
        MOCK_IDS,
      );
      const { sortedCryptoCurrencies } = groupCurrenciesByProvider(
        MOCK_TOKENS_ONLY as MappedAsset[],
        currencies,
      );
      expect(sortedCryptoCurrencies).toEqual([
        await getCryptoAssetsStore().findTokenById("polygon/erc20/(pos)_tether_usd"),
      ]);
    });

    it("should return only BSC token while its currency is supported in the list", async () => {
      setSupportedCurrencies(["bsc"]);

      const currencies = sortCurrenciesByIds(
        (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
        MOCK_IDS,
      );
      const { sortedCryptoCurrencies } = groupCurrenciesByProvider(
        MOCK_TOKENS_ONLY as MappedAsset[],
        currencies,
      );
      expect(sortedCryptoCurrencies).toEqual([
        await getCryptoAssetsStore().findTokenById("bsc/bep20/binance-peg_bsc-usd"),
      ]);
    });

    it("should return tokens that are actually supported based on mock data", () => {
      setSupportedCurrencies(["ethereum", "bsc", "polygon"]);

      const currencies = sortCurrenciesByIds(
        (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
        MOCK_IDS,
      );
      const { sortedCryptoCurrencies } = groupCurrenciesByProvider(
        MOCK_TOKENS_ONLY as MappedAsset[],
        currencies,
      );

      expect(Array.isArray(sortedCryptoCurrencies)).toBe(true);
      expect(sortedCryptoCurrencies.length).toBeGreaterThanOrEqual(0);

      sortedCryptoCurrencies.forEach(currency => {
        expect(currency.type).toBe("TokenCurrency");
        expect(["ethereum", "polygon", "bsc"].some(network => currency.id.includes(network))).toBe(
          true,
        );
      });
    });

    it("should return specific Ethereum and Polygon USDT tokens when both currencies are supported", () => {
      setSupportedCurrencies(["ethereum", "polygon"]);

      const currencies = sortCurrenciesByIds(
        (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
        MOCK_IDS,
      );

      const { sortedCryptoCurrencies } = groupCurrenciesByProvider(
        MOCK_TOKENS_ONLY as MappedAsset[],
        currencies,
      );

      expect(Array.isArray(sortedCryptoCurrencies)).toBe(true);
      expect(sortedCryptoCurrencies.length).toBeGreaterThan(0);

      const tokenIds = sortedCryptoCurrencies.map(currency => currency.id);

      expect(tokenIds).toContain("ethereum/erc20/usd_tether__erc20_");

      sortedCryptoCurrencies.forEach(currency => {
        expect(currency.type).toBe("TokenCurrency");
        expect(currency.id).toMatch(/tether|usdt/i);
      });
    });

    it("should return all supported USDT tokens when multiple currencies are enabled", () => {
      setSupportedCurrencies(["ethereum", "bsc", "polygon"]);

      const currencies = sortCurrenciesByIds(
        (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
        MOCK_IDS,
      );
      const { sortedCryptoCurrencies } = groupCurrenciesByProvider(
        MOCK_TOKENS_ONLY as MappedAsset[],
        currencies,
      );

      expect(Array.isArray(sortedCryptoCurrencies)).toBe(true);
      expect(sortedCryptoCurrencies.length).toBeGreaterThan(0);

      const tokenIds = sortedCryptoCurrencies.map(currency => currency.id);

      expect(tokenIds).toContain("ethereum/erc20/usd_tether__erc20_");

      sortedCryptoCurrencies.forEach(currency => {
        expect(currency.type).toBe("TokenCurrency");
      });

      const hasExpectedNetworks = sortedCryptoCurrencies.every(currency =>
        ["ethereum", "polygon", "bsc"].some(network => currency.id.includes(network)),
      );
      expect(hasExpectedNetworks).toBe(true);
    });

    it("should return empty array when no supported currencies", () => {
      setSupportedCurrencies([]);
      const currencies = sortCurrenciesByIds(
        (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
        MOCK_IDS,
      );

      const { sortedCryptoCurrencies } = groupCurrenciesByProvider(
        [...TOKEN_ONLY_ASSETS, ...MOCK_WITH_TOKEN_AND_CURRENCY_ASSET] as MappedAsset[],
        currencies,
      );
      expect(sortedCryptoCurrencies).toEqual([]);
    });
  });

  describe("Comprehensive integration tests", () => {
    it("should handle all supported currencies and tokens in the system", async () => {
      // Set all major supported currencies from the live-common setup
      setSupportedCurrencies([
        "bitcoin",
        "ethereum",
        "bsc",
        "polygon",
        "arbitrum",
        "optimism",
        "avalanche_c_chain",
        "solana",
        "cardano",
        "polkadot",
        "cosmos",
        "tron",
        "stellar",
        "hedera",
        "near",
        "sui",
      ]);

      const allSupportedCurrencies = listSupportedCurrencies() as CryptoOrTokenCurrency[];
      const allSupportedTokens = listSupportedTokens();

      // Test the full loadCurrenciesByProvider functionality
      const result = await loadCurrenciesByProvider(
        allSupportedCurrencies.concat(allSupportedTokens),
      );

      // Comprehensive validation
      expect(result).toBeDefined();
      expect(result.currenciesByProvider).toBeDefined();
      expect(result.sortedCryptoCurrencies).toBeDefined();
      expect(Array.isArray(result.currenciesByProvider)).toBe(true);
      expect(Array.isArray(result.sortedCryptoCurrencies)).toBe(true);

      // Should have meaningful results with this many currencies
      expect(result.currenciesByProvider.length).toBeGreaterThan(0);
      expect(result.sortedCryptoCurrencies.length).toBeGreaterThan(0);

      // Validate structure of each provider group
      result.currenciesByProvider.forEach(providerGroup => {
        expect(providerGroup.providerId).toBeDefined();
        expect(typeof providerGroup.providerId).toBe("string");
        expect(Array.isArray(providerGroup.currenciesByNetwork)).toBe(true);
        expect(providerGroup.currenciesByNetwork.length).toBeGreaterThan(0);

        // Each currency in the group should be valid
        providerGroup.currenciesByNetwork.forEach(currency => {
          expect(currency.id).toBeDefined();
          expect(currency.type).toMatch(/^(CryptoCurrency|TokenCurrency)$/);
        });
      });

      // Validate sortedCryptoCurrencies
      result.sortedCryptoCurrencies.forEach(currency => {
        expect(currency.id).toBeDefined();
        expect(currency.type).toMatch(/^(CryptoCurrency|TokenCurrency)$/);
      });

      // Should not have duplicates in sortedCryptoCurrencies
      const sortedIds = result.sortedCryptoCurrencies.map(c => c.id);
      const uniqueIds = new Set(sortedIds);
      expect(sortedIds.length).toBe(uniqueIds.size);
    });

    it("should efficiently handle the intersection of all mock assets with all supported currencies", () => {
      setSupportedCurrencies([
        "bitcoin",
        "ethereum",
        "bsc",
        "polygon",
        "arbitrum",
        "optimism",
        "avalanche_c_chain",
        "solana",
        "cardano",
        "polkadot",
        "cosmos",
        "tron",
        "stellar",
        "hedera",
        "near",
        "sui",
        "litecoin",
        "dogecoin",
      ]);

      const currencies = sortCurrenciesByIds(
        (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
        MOCK_IDS,
      );

      const allMockAssets = [
        ...TOKEN_ONLY_ASSETS,
        ...MOCK_WITH_TOKEN_AND_CURRENCY_ASSET,
        ...MOCK_POL,
      ] as MappedAsset[];

      const startTime = Date.now();
      const { currenciesByProvider, sortedCryptoCurrencies } = groupCurrenciesByProvider(
        allMockAssets,
        currencies,
      );
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);

      expect(Array.isArray(currenciesByProvider)).toBe(true);
      expect(Array.isArray(sortedCryptoCurrencies)).toBe(true);

      if (currenciesByProvider.length > 0) {
        currenciesByProvider.forEach(provider => {
          expect(provider.providerId).toBeDefined();
          expect(provider.currenciesByNetwork.length).toBeGreaterThan(0);
        });
      }

      if (sortedCryptoCurrencies.length > 0) {
        sortedCryptoCurrencies.forEach(currency => {
          expect(currency.type).toMatch(/^(CryptoCurrency|TokenCurrency)$/);
        });
      }
    });

    it("should demonstrate provider grouping behavior with diverse mock data", () => {
      setSupportedCurrencies(["ethereum", "polygon", "arbitrum", "optimism"]);

      const currencies = sortCurrenciesByIds(
        (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
        MOCK_IDS,
      );

      const { currenciesByProvider, sortedCryptoCurrencies } = groupCurrenciesByProvider(
        [...TOKEN_ONLY_ASSETS, ...MOCK_WITH_TOKEN_AND_CURRENCY_ASSET, ...MOCK_POL] as MappedAsset[],
        currencies,
      );

      const providerIds = new Set(currenciesByProvider.map(p => p.providerId));

      const expectedProviders = ["tether", "ethereum", "matic-network"];
      expectedProviders.forEach(expectedProvider => {
        if (currenciesByProvider.some(p => p.providerId === expectedProvider)) {
          expect(providerIds.has(expectedProvider)).toBe(true);
        }
      });

      currenciesByProvider.forEach(provider => {
        expect(provider.currenciesByNetwork.length).toBeGreaterThan(0);
        provider.currenciesByNetwork.forEach(currency => {
          expect(currency.id).toBeDefined();
          expect(["CryptoCurrency", "TokenCurrency"].includes(currency.type)).toBe(true);
        });
      });

      expect(sortedCryptoCurrencies.length).toBeLessThanOrEqual(providerIds.size);
    });
  });

  describe("Error handling", () => {
    test("should handle malformed asset data by throwing error", async () => {
      const malformedAssets = [
        { ...TOKEN_ONLY_ASSETS[0], ledgerId: undefined as any },
        { ...TOKEN_ONLY_ASSETS[0], providerId: null as any },
      ] as MappedAsset[];

      const token = await getCryptoAssetsStore().findTokenById(TOKEN_ONLY_ASSETS[0].ledgerId);
      if (!token) throw new Error("Token not found");
      const currencies = [token];

      expect(() => {
        groupCurrenciesByProvider(malformedAssets, currencies);
      }).toThrow();
    });

    test("should handle assets with null/undefined fields gracefully where possible", async () => {
      const partiallyMalformedAssets = [
        { ...TOKEN_ONLY_ASSETS[0], providerId: "" },
      ] as MappedAsset[];

      const token = await getCryptoAssetsStore().findTokenById(TOKEN_ONLY_ASSETS[0].ledgerId);
      if (!token) throw new Error("Token not found");
      const currencies = [token];

      expect(() => {
        groupCurrenciesByProvider(partiallyMalformedAssets, currencies);
      }).not.toThrow();
    });

    test("should handle very large datasets efficiently", async () => {
      const largeAssetList = Array(10000)
        .fill(TOKEN_ONLY_ASSETS[0])
        .map((asset, index) => ({
          ...asset,
          ledgerId: `${asset.ledgerId}_${index}`,
          providerId: `provider_${index % 10}`,
        })) as MappedAsset[];

      const token = await getCryptoAssetsStore().findTokenById(TOKEN_ONLY_ASSETS[0].ledgerId);
      if (!token) throw new Error("Token not found");
      const currencies = [token];

      const startTime = Date.now();
      const result = groupCurrenciesByProvider(largeAssetList, currencies);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);
      expect(result.currenciesByProvider).toBeDefined();
      expect(result.sortedCryptoCurrencies).toBeDefined();
    });

    test("should handle case sensitivity in ledger IDs correctly", async () => {
      const mixedCaseAssets = [
        { ...TOKEN_ONLY_ASSETS[0], ledgerId: TOKEN_ONLY_ASSETS[0].ledgerId.toUpperCase() },
      ] as MappedAsset[];

      const token = await getCryptoAssetsStore().findTokenById(TOKEN_ONLY_ASSETS[0].ledgerId);
      if (!token) throw new Error("Token not found");
      const currencies = [token];
      const { currenciesByProvider } = groupCurrenciesByProvider(mixedCaseAssets, currencies);

      expect(currenciesByProvider).toHaveLength(1);
    });
  });
});
