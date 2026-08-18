/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { renderHook } from "@tests/test-renderer";
import { useCurrencySettings } from "LLM/hooks/useCurrencySettings";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";

setCryptoAssetsStore({
  findTokenById: async () => undefined,
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "",
});

describe("useCurrencySettings", () => {
  describe("for ethereum currency", () => {
    it("should return defined settings", () => {
      const ethereum = getCryptoCurrencyById("ethereum");
      const { result } = renderHook(() => useCurrencySettings(ethereum));
      expect(result.current).toBeDefined();
    });

    it("should return confirmationsNb as a number", () => {
      const ethereum = getCryptoCurrencyById("ethereum");
      const { result } = renderHook(() => useCurrencySettings(ethereum));
      expect(typeof result.current.confirmationsNb).toBe("number");
    });
  });

  describe("for bitcoin currency", () => {
    it("should return defined settings", () => {
      const bitcoin = getCryptoCurrencyById("bitcoin");
      const { result } = renderHook(() => useCurrencySettings(bitcoin));
      expect(result.current).toBeDefined();
    });

    it("should return confirmationsNb as a number", () => {
      const bitcoin = getCryptoCurrencyById("bitcoin");
      const { result } = renderHook(() => useCurrencySettings(bitcoin));
      expect(typeof result.current.confirmationsNb).toBe("number");
    });
  });
});
