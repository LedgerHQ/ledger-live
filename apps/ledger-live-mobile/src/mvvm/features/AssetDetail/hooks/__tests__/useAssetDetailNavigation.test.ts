import { renderHook, withFlagOverrides, act } from "@tests/test-renderer";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { NavigatorName, ScreenName } from "~/const";
import { useAssetDetailNavigation } from "../useAssetDetailNavigation";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const withAggregatedAssets = (enabled: boolean) =>
  withFlagOverrides({
    lwmWallet40: { enabled: true, params: { aggregatedAssets: enabled } },
  });

describe("useAssetDetailNavigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("openFromAsset", () => {
    it("routes to AssetDetail when aggregatedAssets is enabled", () => {
      const { result } = renderHook(() => useAssetDetailNavigation(), {
        overrideInitialState: withAggregatedAssets(true),
      });

      act(() => {
        result.current.openFromAsset({
          currency: mockBtcCryptoCurrency,
          source: "wallet",
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.AssetDetail, {
        screen: ScreenName.AssetDetail,
        params: { currencyId: mockBtcCryptoCurrency.id, source: "wallet" },
      });
    });

    it("forwards marketId via marketState when aggregatedAssets is enabled (e.g. BNB placeholder)", () => {
      const { result } = renderHook(() => useAssetDetailNavigation(), {
        overrideInitialState: withAggregatedAssets(true),
      });

      act(() => {
        result.current.openFromAsset({
          currency: mockBtcCryptoCurrency,
          source: "wallet",
          isPlaceholder: true,
          marketId: "binancecoin",
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.AssetDetail, {
        screen: ScreenName.AssetDetail,
        params: {
          currencyId: mockBtcCryptoCurrency.id,
          source: "wallet",
          marketState: { id: "binancecoin", ledgerIds: [mockBtcCryptoCurrency.id] },
        },
      });
    });

    it("routes to MarketDetail for placeholder assets when aggregatedAssets is disabled", () => {
      const { result } = renderHook(() => useAssetDetailNavigation(), {
        overrideInitialState: withAggregatedAssets(false),
      });

      act(() => {
        result.current.openFromAsset({
          currency: mockEthCryptoCurrency,
          source: "wallet",
          isPlaceholder: true,
          marketId: "ethereum",
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith(ScreenName.MarketDetail, {
        currencyId: "ethereum",
      });
    });

    it("prefers the placeholder marketId over currency.id for the legacy MarketDetail route", () => {
      const { result } = renderHook(() => useAssetDetailNavigation(), {
        overrideInitialState: withAggregatedAssets(false),
      });

      act(() => {
        result.current.openFromAsset({
          currency: mockBtcCryptoCurrency,
          source: "wallet",
          isPlaceholder: true,
          marketId: "binancecoin",
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith(ScreenName.MarketDetail, {
        currencyId: "binancecoin",
      });
    });

    it("routes to legacy Asset for non-placeholder assets when aggregatedAssets is disabled", () => {
      const { result } = renderHook(() => useAssetDetailNavigation(), {
        overrideInitialState: withAggregatedAssets(false),
      });

      act(() => {
        result.current.openFromAsset({
          currency: mockBtcCryptoCurrency,
          source: "wallet",
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
        screen: ScreenName.Asset,
        params: { currency: mockBtcCryptoCurrency },
      });
    });
  });

  describe("openFromMarket", () => {
    it("routes to AssetDetail with the market id and marketState when aggregatedAssets is enabled", () => {
      const { result } = renderHook(() => useAssetDetailNavigation(), {
        overrideInitialState: withAggregatedAssets(true),
      });

      act(() => {
        result.current.openFromMarket({
          marketCurrencyId: "binancecoin",
          ledgerCurrencyIds: ["bsc"],
          source: "market",
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.AssetDetail, {
        screen: ScreenName.AssetDetail,
        params: {
          currencyId: "binancecoin",
          source: "market",
          marketState: { id: "binancecoin", ledgerIds: ["bsc"] },
        },
      });
    });

    it("still passes the market id when no ledger ids are available", () => {
      const { result } = renderHook(() => useAssetDetailNavigation(), {
        overrideInitialState: withAggregatedAssets(true),
      });

      act(() => {
        result.current.openFromMarket({
          marketCurrencyId: "unsupported-asset",
          source: "market",
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.AssetDetail, {
        screen: ScreenName.AssetDetail,
        params: {
          currencyId: "unsupported-asset",
          source: "market",
          marketState: { id: "unsupported-asset", ledgerIds: undefined },
        },
      });
    });

    it("routes to MarketDetail when aggregatedAssets is disabled", () => {
      const { result } = renderHook(() => useAssetDetailNavigation(), {
        overrideInitialState: withAggregatedAssets(false),
      });

      act(() => {
        result.current.openFromMarket({
          marketCurrencyId: "bitcoin",
          ledgerCurrencyIds: [mockBtcCryptoCurrency.id],
          source: "market",
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith(ScreenName.MarketDetail, {
        currencyId: "bitcoin",
      });
    });
  });
});
