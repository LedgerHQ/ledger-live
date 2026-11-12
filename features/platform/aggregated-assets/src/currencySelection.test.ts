import {
  selectAssetCurrencyIds,
  selectCurrency,
  selectCurrencyForMetaId,
} from "./currencySelection";
import {
  mockAssetsDataWithPagination,
  mockArbitrumTokenAssetsData,
  mockBitcoinAssetsData,
  mockUsdcAssetsData,
} from "@domain/api-aggregated-assets/mock";
import type { AssetsDataWithPagination } from "@domain/api-aggregated-assets";
import { AggregatedAssetIdSchema } from "@domain/entity-aggregated-asset";

const assetId = (raw: string) => AggregatedAssetIdSchema.parse(raw);

describe("currencySelection", () => {
  describe("selectCurrency", () => {
    it("should return the correct currency", () => {
      const result = selectCurrency(mockAssetsDataWithPagination);
      expect(result).toBeDefined();

      expect(result).toMatchObject({
        type: "CryptoCurrency",
        id: "injective",
        name: "Injective",
        ticker: "INJ",
      });
    });
  });

  describe("selectCurrencyForMetaId", () => {
    it("should return undefined when meta-currency has no assetsIds", () => {
      const data: AssetsDataWithPagination = {
        ...mockAssetsDataWithPagination,
        cryptoAssets: {
          [assetId("unknown")]: {
            id: assetId("unknown"),
            ticker: "UNK",
            name: "Unknown",
            assetsIds: {},
          },
        },
      };

      const result = selectCurrencyForMetaId(assetId("unknown"), data);
      expect(result).toBeUndefined();
    });

    it("should return undefined when meta-currency does not exist in data", () => {
      const result = selectCurrencyForMetaId(assetId("nonexistent"), mockAssetsDataWithPagination);
      expect(result).toBeUndefined();
    });

    it("should return exact match when currency.id equals metaCurrencyId", () => {
      const data = { ...mockBitcoinAssetsData, pagination: {} } as AssetsDataWithPagination;
      const result = selectCurrencyForMetaId(assetId("bitcoin"), data);

      expect(result).toBeDefined();
      expect(result!.id).toBe("bitcoin");
      expect(result!.type).toBe("CryptoCurrency");
    });

    it("should prefer CryptoCurrency type over TokenCurrency", () => {
      const result = selectCurrencyForMetaId(
        assetId("urn:crypto:meta-currency:injective_protocol"),
        mockAssetsDataWithPagination,
      );

      expect(result).toBeDefined();
      expect(result!.type).toBe("CryptoCurrency");
      expect(result!.id).toBe("injective");
    });

    it("should fall back to first available currency when no CryptoCurrency exists", () => {
      const data = { ...mockUsdcAssetsData, pagination: {} } as AssetsDataWithPagination;
      const result = selectCurrencyForMetaId(assetId("usdc"), data);

      expect(result).toBeDefined();
      expect(result!.type).toBe("TokenCurrency");
    });

    it("prefers the ERC-20 token over a same-named L2 chain when their tickers differ", () => {
      const data = { ...mockArbitrumTokenAssetsData, pagination: {} } as AssetsDataWithPagination;
      const result = selectCurrencyForMetaId(assetId("arbitrum"), data);

      expect(result).toBeDefined();
      expect(result!.id).toBe("ethereum/erc20/arbitrum");
      expect(result!.ticker).toBe("ARB");
      expect(result!.type).toBe("TokenCurrency");
    });
  });

  describe("selectAssetCurrencyIds", () => {
    const usdcOnEthereum = "ethereum/erc20/usd__coin";
    const usdcOnSolana = "solana/spl/epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v";
    const usdcData = {
      ...mockAssetsDataWithPagination,
      cryptoAssets: {
        "urn:crypto:meta-currency:usd_coin": {
          id: assetId("urn:crypto:meta-currency:usd_coin"),
          ticker: "USDC",
          name: "USDC",
          assetsIds: { ethereum: usdcOnEthereum, solana: usdcOnSolana },
        },
        "urn:crypto:meta-currency:arc_native_usdc": {
          id: assetId("urn:crypto:meta-currency:arc_native_usdc"),
          ticker: "USDC",
          name: "USDC",
          assetsIds: { arc: "arc" },
        },
      },
      currenciesOrder: {
        ...mockAssetsDataWithPagination.currenciesOrder,
        metaCurrencyIds: [
          assetId("urn:crypto:meta-currency:usd_coin"),
          assetId("urn:crypto:meta-currency:arc_native_usdc"),
        ],
      },
    } as AssetsDataWithPagination;

    it("returns only the ids of the asset group that holds the currency", () => {
      expect(selectAssetCurrencyIds(usdcData, usdcOnSolana)).toEqual([
        usdcOnEthereum,
        usdcOnSolana,
      ]);
      expect(selectAssetCurrencyIds(usdcData, "arc")).toEqual(["arc"]);
    });

    it("drops a native coin whose ticker differs from the asset group", () => {
      const arbitrumData = { ...mockArbitrumTokenAssetsData, pagination: {} };

      expect(selectAssetCurrencyIds(arbitrumData, "ethereum/erc20/arbitrum")).toEqual([
        "ethereum/erc20/arbitrum",
      ]);
    });

    it("uses the only group when no group holds the currency", () => {
      const ethereumOnBaseData = {
        ...usdcData,
        cryptoAssets: {
          ethereum: {
            id: assetId("ethereum"),
            ticker: "ETH",
            name: "Ethereum",
            assetsIds: { base: "base" },
          },
        },
      } as AssetsDataWithPagination;

      expect(selectAssetCurrencyIds(ethereumOnBaseData, "ethereum")).toEqual(["base"]);
    });

    it("returns no ids when several groups exist and none holds the currency", () => {
      expect(selectAssetCurrencyIds(usdcData, "algorand/asa/31566704")).toEqual([]);
    });
  });
});
