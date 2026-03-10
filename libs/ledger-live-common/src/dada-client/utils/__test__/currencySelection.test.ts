import { selectCurrency, selectCurrencyForMetaId } from "../currencySelection";
import {
  mockAssetsDataWithPagination,
  mockBitcoinAssetsData,
  mockUsdcAssetsData,
} from "../../__mocks__/assets.mock";
import type { AssetsDataWithPagination } from "../../state-manager/types";

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
          unknown: { id: "unknown", ticker: "UNK", name: "Unknown", assetsIds: {} },
        },
      };

      const result = selectCurrencyForMetaId("unknown", data);
      expect(result).toBeUndefined();
    });

    it("should return undefined when meta-currency does not exist in data", () => {
      const result = selectCurrencyForMetaId("nonexistent", mockAssetsDataWithPagination);
      expect(result).toBeUndefined();
    });

    it("should return exact match when currency.id equals metaCurrencyId", () => {
      const data = { ...mockBitcoinAssetsData, pagination: {} } as AssetsDataWithPagination;
      const result = selectCurrencyForMetaId("bitcoin", data);

      expect(result).toBeDefined();
      expect(result!.id).toBe("bitcoin");
      expect(result!.type).toBe("CryptoCurrency");
    });

    it("should prefer CryptoCurrency type over TokenCurrency", () => {
      const result = selectCurrencyForMetaId(
        "urn:crypto:meta-currency:injective_protocol",
        mockAssetsDataWithPagination,
      );

      expect(result).toBeDefined();
      expect(result!.type).toBe("CryptoCurrency");
      expect(result!.id).toBe("injective");
    });

    it("should fall back to first available currency when no CryptoCurrency exists", () => {
      const data = { ...mockUsdcAssetsData, pagination: {} } as AssetsDataWithPagination;
      const result = selectCurrencyForMetaId("usdc", data);

      expect(result).toBeDefined();
      expect(result!.type).toBe("TokenCurrency");
    });
  });
});
