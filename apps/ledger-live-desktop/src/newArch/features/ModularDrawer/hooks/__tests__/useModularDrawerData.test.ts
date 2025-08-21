import { renderHook } from "@testing-library/react";
import { useModularDrawerData } from "../useModularDrawerData";
import { useAssetsData } from "../useAssetsData";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { AssetsDataWithPagination } from "../../data/state-manager/api";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { res as mockData } from "../../__mocks__/useModularDrawerData.mock";

jest.mock("../useAssetsData");

const mockUseAssetsData = jest.mocked(useAssetsData);

const mockApiResponse: AssetsDataWithPagination = {
  ...mockData,
  pagination: {
    nextCursor: undefined,
  },
};

const mockCurrencies = [
  { id: "bitcoin", name: "Bitcoin", ticker: "BTC" },
  { id: "ethereum", name: "Ethereum", ticker: "ETH" },
  { id: "solana", name: "Solana", ticker: "SOL" },
];

const expectedAssetsSorted = [
  {
    id: "bitcoin",
    ticker: "BTC",
    name: "Bitcoin",
    assetsIds: {
      bitcoin: "bitcoin",
    },
  },
  {
    id: "ethereum",
    ticker: "ETH",
    name: "Ethereum",
    assetsIds: {
      ethereum: "ethereum",
      base: "base",
      arbitrum: "arbitrum",
      mantle: "mantle",
      optimism: "optimism",
      blast: "blast",
      linea: "linea",
      scroll: "scroll",
      zksync: "zksync",
      boba: "boba",
    },
  },
  {
    id: "ripple",
    ticker: "XRP",
    name: "Ripple",
    assetsIds: {
      ripple: "ripple",
    },
  },
  {
    id: "ethereum/erc20/usd_tether__erc20_",
    ticker: "USDT",
    name: "Tether USD",
    assetsIds: {
      ethereum: "ethereum/erc20/usd_tether__erc20_",
      solana: "solana/spl/es9vmfrzacermjfrf4h2fyd4kconky11mcce8benwnyb",
      bsc: "bsc/bep20/binance-peg_bsc-usd",
      ton: "ton/jetton/eqcxe6mutqjkfngfarotkot1lzbdiix1kcixrv7nw2id_sds",
      avalanche_c_chain: "avalanche_c_chain/erc20/tethertoken",
      tron: "tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t",
      aptos:
        "aptos/fungible_asset/tether_usd_0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b",
      arbitrum: "arbitrum/erc20/tether_usd",
      optimism: "optimism/erc20/tether_usd",
      fantom: "fantom/erc20/tether_usd",
      algorand: "algorand/asa/312769",
      celo: "celo/erc20/tether_usd_0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
      scroll: "scroll/erc20/tether_usd",
      neon_evm: "neon_evm/erc20/usdt",
      polygon_zk_evm: "polygon_zk_evm/erc20/tether_usd",
    },
  },
  {
    id: "bsc",
    ticker: "BNB",
    name: "Binance Smart Chain",
    assetsIds: {
      bsc: "bsc",
      binance_beacon_chain: "binance_beacon_chain",
      ethereum: "ethereum/erc20/bnb",
    },
  },
  {
    id: "solana",
    ticker: "SOL",
    name: "Solana",
    assetsIds: {
      solana: "solana",
    },
  },
  {
    id: "ethereum/erc20/usd__coin",
    ticker: "USDC",
    name: "USD Coin",
    assetsIds: {
      ethereum: "ethereum/erc20/usd__coin",
      solana: "solana/spl/epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v",
      bsc: "bsc/bep20/binance-peg_usd_coin",
      avalanche_c_chain: "avalanche_c_chain/erc20/usd_coin",
      tron: "tron/trc20/tekxitehnzsmse2xqrbj4w32run966rdz8",
      base: "base/erc20/usd_coin",
      polygon: "polygon/erc20/usd_coin",
      aptos:
        "aptos/fungible_asset/usdc_0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b",
      stellar: "stellar/asset/usdc:ga5zsejyb37jrc5avcia5mop4rhtm335x2kgx3ihojapp5re34k4kzvn",
      arbitrum: "arbitrum/erc20/usd_coin",
      hedera: "hedera/hts/usd_coin_0.0.456858",
      optimism: "optimism/erc20/usd_coin",
      cronos: "cronos/erc20/usd_coin",
      elrond: "elrond/esdt/555344432d633736663166",
      sui: "sui/coin/usdc_0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::usdc",
      algorand: "algorand/asa/31566704",
      celo: "celo/erc20/usdc_0xceba9300f2b948710d2653dd7b07f33a8b32118c",
      zksync: "zksync/erc20/usdc",
      telos_evm: "telos_evm/erc20/usd_coin",
      polygon_zk_evm: "polygon_zk_evm/erc20/usd_coin",
      sonic: "sonic/erc20/bridged_usdc_sonic_labs_0x29219dd400f2bf60e5a23d13be72b486d4038894",
    },
  },
  {
    id: "ethereum/erc20/steth",
    ticker: "stETH",
    name: "LIDO Staked ETH",
    assetsIds: {
      ethereum: "ethereum/erc20/steth",
    },
  },
  {
    id: "tron",
    ticker: "TRX",
    name: "Tron",
    assetsIds: {
      tron: "tron",
    },
  },
  {
    id: "dogecoin",
    ticker: "DOGE",
    name: "Dogecoin",
    assetsIds: {
      dogecoin: "dogecoin",
    },
  },
];

const expectedCurrenciesByProvider = [
  {
    providerId: "bitcoin",
    nbCurrenciesByNetwork: 1,
  },
  {
    providerId: "ethereum",
    nbCurrenciesByNetwork: 9,
  },
  {
    providerId: "ripple",
    nbCurrenciesByNetwork: 1,
  },
  {
    providerId: "ethereum/erc20/usd_tether__erc20_",
    nbCurrenciesByNetwork: 6,
  },
  {
    providerId: "bsc",
    nbCurrenciesByNetwork: 3,
  },
  {
    providerId: "solana",
    nbCurrenciesByNetwork: 1,
  },
  {
    providerId: "ethereum/erc20/usd__coin",
    nbCurrenciesByNetwork: 8,
  },
  {
    providerId: "ethereum/erc20/steth",
    nbCurrenciesByNetwork: 1,
  },
  {
    providerId: "tron",
    nbCurrenciesByNetwork: 1,
  },
  {
    providerId: "dogecoin",
    nbCurrenciesByNetwork: 1,
  },
];

describe("useModularDrawerData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when data is successfully loaded", () => {
    beforeEach(() => {
      mockUseAssetsData.mockReturnValue({
        data: mockApiResponse,
        error: undefined,
        isLoading: false,
        isSuccess: true,
        hasMore: false,
        cursor: undefined,
        loadNext: jest.fn(),
      });
    });

    it("should return the correct data structure", () => {
      const { result } = renderHook(() =>
        useModularDrawerData({
          currencies: mockCurrencies,
          searchedValue: undefined,
        }),
      );

      expect(result.current.data).toEqual(mockApiResponse);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.error).toBeUndefined();
      expect(result.current.loadingStatus).toBe(LoadingStatus.Success);
    });

    it("should process assets data correctly", () => {
      const { result } = renderHook(() =>
        useModularDrawerData({
          currencies: mockCurrencies,
          searchedValue: undefined,
        }),
      );

      const { assetsSorted, currenciesByProvider, sortedCryptoCurrencies } = result.current;

      expect(assetsSorted).toBeDefined();
      expect(assetsSorted).toHaveLength(10);
      const assets = assetsSorted?.map(assetData => assetData.asset);
      expect(assets).toEqual(expectedAssetsSorted);

      expect(currenciesByProvider).toBeDefined();
      expect(currenciesByProvider).toHaveLength(10);
      for (let i = 0; i < currenciesByProvider.length; i++) {
        const currencyByProvider = currenciesByProvider[i];
        const expectedCurrencyByProvider = expectedCurrenciesByProvider[i];
        expect(currencyByProvider.providerId).toBe(expectedCurrencyByProvider.providerId);
        expect(currencyByProvider.currenciesByNetwork).toHaveLength(
          expectedCurrencyByProvider.nbCurrenciesByNetwork,
        );
      }

      expect(sortedCryptoCurrencies).toBeDefined();
      expect(Array.isArray(sortedCryptoCurrencies)).toBe(true);
      expect(sortedCryptoCurrencies[0].id).toBe("bitcoin");
    });

    it("should handle search functionality", () => {
      const searchValue = "bitcoin";

      renderHook(() =>
        useModularDrawerData({
          currencies: mockCurrencies,
          searchedValue: searchValue,
        }),
      );

      expect(mockUseAssetsData).toHaveBeenCalledWith({
        search: searchValue,
        currencyIds: expect.any(Array),
      });
    });

    it("should pass correct currency IDs to useAssetsData", () => {
      renderHook(() =>
        useModularDrawerData({
          currencies: mockCurrencies,
          searchedValue: undefined,
        }),
      );

      expect(mockUseAssetsData).toHaveBeenCalledWith({
        search: undefined,
        currencyIds: ["bitcoin", "ethereum", "solana"],
      });
    });
  });

  describe("when data is loading", () => {
    beforeEach(() => {
      mockUseAssetsData.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: true,
        isSuccess: false,
        hasMore: false,
        cursor: undefined,
        loadNext: jest.fn(),
      });
    });

    it("should return loading state", () => {
      const { result } = renderHook(() =>
        useModularDrawerData({
          currencies: mockCurrencies,
          searchedValue: undefined,
        }),
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.loadingStatus).toBe(LoadingStatus.Pending);
      expect(result.current.assetsSorted).toBeUndefined();
      expect(result.current.currenciesByProvider).toEqual([]);
      expect(result.current.sortedCryptoCurrencies).toEqual([]);
    });
  });

  describe("when there is an error", () => {
    const mockError: FetchBaseQueryError = {
      status: 500,
      data: "Internal server error",
    };

    beforeEach(() => {
      mockUseAssetsData.mockReturnValue({
        data: undefined,
        error: mockError,
        isLoading: false,
        isSuccess: false,
        hasMore: false,
        cursor: undefined,
        loadNext: jest.fn(),
      });
    });

    it("should return error state", () => {
      const { result } = renderHook(() =>
        useModularDrawerData({
          currencies: mockCurrencies,
          searchedValue: undefined,
        }),
      );

      expect(result.current.error).toEqual(mockError);
      expect(result.current.loadingStatus).toBe(LoadingStatus.Error);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.assetsSorted).toBeUndefined();
      expect(result.current.currenciesByProvider).toEqual([]);
      expect(result.current.sortedCryptoCurrencies).toEqual([]);
    });
  });
});
