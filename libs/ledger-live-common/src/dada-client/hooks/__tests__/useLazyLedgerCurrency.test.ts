/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { useLazyLedgerCurrency } from "../useLazyLedgerCurrency";
import { assetsDataApi } from "../../state-manager/api";
import useEnv from "../../../hooks/useEnv";
import {
  mockAssetsData,
  mockBitcoinAssetsData,
  mockUsdcAssetsData,
} from "../../__mocks__/assets.mock";

jest.mock("../../../hooks/useEnv");

jest.mock("../../state-manager/api", () => ({
  assetsDataApi: {
    useLazyGetAssetDataQuery: jest.fn(),
  },
}));

const mockUseEnv = jest.mocked(useEnv);
const mockUseLazyGetAssetDataQuery = jest.mocked(assetsDataApi.useLazyGetAssetDataQuery);

describe("useLazyLedgerCurrency", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEnv.mockReturnValue(false);
  });

  describe("getLedgerCurrency", () => {
    it("should return undefined when currency is null", async () => {
      const mockTrigger = jest.fn();
      mockUseLazyGetAssetDataQuery.mockReturnValue([mockTrigger, {} as any, {} as any]);

      const { result } = renderHook(() =>
        useLazyLedgerCurrency({ product: "lld", version: "1.0.0" }, null),
      );

      const ledgerCurrency = await result.current.getLedgerCurrency();

      expect(ledgerCurrency).toBeUndefined();
      expect(mockTrigger).not.toHaveBeenCalled();
    });

    it("should return undefined when currency has no ledgerIds", async () => {
      const mockTrigger = jest.fn();
      mockUseLazyGetAssetDataQuery.mockReturnValue([mockTrigger, {} as any, {} as any]);

      const currency = { id: "test" };
      const { result } = renderHook(() =>
        useLazyLedgerCurrency({ product: "lld", version: "1.0.0" }, currency),
      );

      const ledgerCurrency = await result.current.getLedgerCurrency();

      expect(ledgerCurrency).toBeUndefined();
      expect(mockTrigger).not.toHaveBeenCalled();
    });

    it("should return undefined when currency has empty ledgerIds", async () => {
      const mockTrigger = jest.fn();
      mockUseLazyGetAssetDataQuery.mockReturnValue([mockTrigger, {} as any, {} as any]);

      const currency = { id: "test", ledgerIds: [] };
      const { result } = renderHook(() =>
        useLazyLedgerCurrency({ product: "lld", version: "1.0.0" }, currency),
      );

      const ledgerCurrency = await result.current.getLedgerCurrency();

      expect(ledgerCurrency).toBeUndefined();
      expect(mockTrigger).not.toHaveBeenCalled();
    });

    it("should return the CryptoCurrency when available (Injective example)", async () => {
      const mockResult = mockAssetsData;

      const mockTrigger = jest.fn().mockReturnValue({
        unwrap: jest.fn().mockResolvedValue(mockResult),
      });
      mockUseLazyGetAssetDataQuery.mockReturnValue([mockTrigger, {} as any, {} as any]);

      const currency = {
        id: "injective",
        ledgerIds: ["injective", "bsc/bep20/injective_protocol", "ethereum/erc20/injective_token"],
      };
      const { result } = renderHook(() =>
        useLazyLedgerCurrency({ product: "lld", version: "1.0.0" }, currency),
      );

      const ledgerCurrency = await result.current.getLedgerCurrency();

      expect(ledgerCurrency).toMatchObject({
        type: "CryptoCurrency",
        id: "injective",
        name: "Injective",
        ticker: "INJ",
      });
      expect(mockTrigger).toHaveBeenCalledWith(
        {
          currencyIds: [
            "injective",
            "bsc/bep20/injective_protocol",
            "ethereum/erc20/injective_token",
          ],
          product: "lld",
          version: "1.0.0",
          isStaging: false,
          includeTestNetworks: false,
        },
        true,
      );
    });

    it("should return the currency matching metaCurrencyId when available", async () => {
      const mockTrigger = jest.fn().mockReturnValue({
        unwrap: jest.fn().mockResolvedValue(mockBitcoinAssetsData),
      });
      mockUseLazyGetAssetDataQuery.mockReturnValue([mockTrigger, {} as any, {} as any]);

      const currency = { id: "bitcoin", ledgerIds: ["bitcoin"] };
      const { result } = renderHook(() =>
        useLazyLedgerCurrency({ product: "lld", version: "1.0.0" }, currency),
      );

      const ledgerCurrency = await result.current.getLedgerCurrency();

      // Should return the currency matching metaCurrencyId (bitcoin)
      expect(ledgerCurrency).toMatchObject({
        type: "CryptoCurrency",
        id: "bitcoin",
        name: "Bitcoin",
        ticker: "BTC",
      });
    });

    it("should return first TokenCurrency when no CryptoCurrency available", async () => {
      const mockTrigger = jest.fn().mockReturnValue({
        unwrap: jest.fn().mockResolvedValue(mockUsdcAssetsData),
      });
      mockUseLazyGetAssetDataQuery.mockReturnValue([mockTrigger, {} as any, {} as any]);

      const currency = { id: "usdc", ledgerIds: ["ethereum/erc20/usd_coin"] };
      const { result } = renderHook(() =>
        useLazyLedgerCurrency({ product: "lld", version: "1.0.0" }, currency),
      );

      const ledgerCurrency = await result.current.getLedgerCurrency();

      // Should return the first TokenCurrency since no CryptoCurrency exists
      expect(ledgerCurrency?.type).toBe("TokenCurrency");
      expect(ledgerCurrency?.ticker).toBe("USDC");
    });
  });

  describe("getLedgerCurrencies", () => {
    it("should return all cryptoOrTokenCurrencies for valid currency IDs", async () => {
      const mockResult = {
        cryptoOrTokenCurrencies: {
          bitcoin: {
            type: "CryptoCurrency",
            id: "bitcoin",
            name: "Bitcoin",
            ticker: "BTC",
          },
          ethereum: {
            type: "CryptoCurrency",
            id: "ethereum",
            name: "Ethereum",
            ticker: "ETH",
          },
        },
      };

      const mockTrigger = jest.fn().mockReturnValue({
        unwrap: jest.fn().mockResolvedValue(mockResult),
      });
      mockUseLazyGetAssetDataQuery.mockReturnValue([mockTrigger, {} as any, {} as any]);

      const { result } = renderHook(() =>
        useLazyLedgerCurrency({ product: "lld", version: "1.0.0" }),
      );

      const currencies = await result.current.getLedgerCurrencies(["bitcoin", "ethereum"]);

      expect(mockTrigger).toHaveBeenCalledWith(
        {
          currencyIds: ["bitcoin", "ethereum"],
          product: "lld",
          version: "1.0.0",
          isStaging: false,
          includeTestNetworks: false,
        },
        true,
      );
      expect(currencies).toHaveLength(2);
      expect(currencies).toEqual([
        {
          type: "CryptoCurrency",
          id: "bitcoin",
          name: "Bitcoin",
          ticker: "BTC",
        },
        {
          type: "CryptoCurrency",
          id: "ethereum",
          name: "Ethereum",
          ticker: "ETH",
        },
      ]);
    });

    it("should return undefined when API call fails", async () => {
      const mockTrigger = jest.fn().mockReturnValue({
        unwrap: jest.fn().mockRejectedValue(new Error("API Error")),
      });
      mockUseLazyGetAssetDataQuery.mockReturnValue([mockTrigger, {} as any, {} as any]);

      const { result } = renderHook(() =>
        useLazyLedgerCurrency({ product: "lld", version: "1.0.0" }),
      );

      const currencies = await result.current.getLedgerCurrencies(["bitcoin"]);

      expect(currencies).toBeUndefined();
    });

    it("should return mix of CryptoCurrencies and TokenCurrencies", async () => {
      const mockResult = {
        cryptoOrTokenCurrencies: {
          bitcoin: {
            type: "CryptoCurrency",
            id: "bitcoin",
            name: "Bitcoin",
            ticker: "BTC",
          },
          "ethereum/erc20/usd_coin": {
            type: "TokenCurrency",
            id: "ethereum/erc20/usd_coin",
            name: "USD Coin",
            ticker: "USDC",
          },
        },
      };

      const mockTrigger = jest.fn().mockReturnValue({
        unwrap: jest.fn().mockResolvedValue(mockResult),
      });
      mockUseLazyGetAssetDataQuery.mockReturnValue([mockTrigger, {} as any, {} as any]);

      const { result } = renderHook(() =>
        useLazyLedgerCurrency({ product: "lld", version: "1.0.0" }),
      );

      const currencies = await result.current.getLedgerCurrencies([
        "bitcoin",
        "ethereum/erc20/usd_coin",
      ]);

      expect(currencies).toHaveLength(2);
      expect(currencies?.[0].type).toBe("CryptoCurrency");
      expect(currencies?.[1].type).toBe("TokenCurrency");
    });
  });
});
