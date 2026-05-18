import { act } from "@testing-library/react-native";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { NavigatorName, ScreenName } from "~/const";
import { Asset } from "~/types/asset";
import { usePortfolioSectionActions } from "../usePortfolioSectionActions";

const mockNavigate = jest.fn();
const mockTrack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("~/analytics", () => ({
  useAnalytics: () => ({ track: mockTrack }),
}));

const btcAsset: Asset = {
  currency: mockBtcCryptoCurrency,
  accounts: [],
  amount: 100000,
};

const ethPlaceholderAsset: Asset = {
  currency: mockEthCryptoCurrency,
  accounts: [],
  amount: 0,
  isPlaceholder: true,
  marketId: "ethereum",
};

describe("usePortfolioSectionActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("onItemPress", () => {
    it("navigates to AssetDetail when aggregatedAssets is enabled", () => {
      const { result } = renderHook(() => usePortfolioSectionActions(false, "crypto"), {
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { aggregatedAssets: true } },
        }),
      });

      act(() => {
        result.current.onItemPress(btcAsset);
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.AssetDetail, {
        screen: ScreenName.AssetDetail,
        params: { currencyId: mockBtcCryptoCurrency.id, source: "portfolio" },
      });
    });

    it("navigates to MarketDetail for placeholder assets when aggregatedAssets is disabled", () => {
      const { result } = renderHook(() => usePortfolioSectionActions(false, "crypto"), {
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { aggregatedAssets: false } },
        }),
      });

      act(() => {
        result.current.onItemPress(ethPlaceholderAsset);
      });

      expect(mockNavigate).toHaveBeenCalledWith(ScreenName.MarketDetail, {
        currencyId: "ethereum",
      });
    });

    it("navigates to Accounts > Asset for non-placeholder assets when aggregatedAssets is disabled", () => {
      const { result } = renderHook(() => usePortfolioSectionActions(false, "crypto"), {
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { aggregatedAssets: false } },
        }),
      });

      act(() => {
        result.current.onItemPress(btcAsset);
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
        screen: ScreenName.Asset,
        params: { currency: mockBtcCryptoCurrency },
      });
    });

    it("fires asset_clicked analytics with asset name and page", () => {
      const { result } = renderHook(() => usePortfolioSectionActions(false, "crypto"), {
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { aggregatedAssets: true } },
        }),
      });

      act(() => {
        result.current.onItemPress(btcAsset);
      });

      expect(mockTrack).toHaveBeenCalledWith("asset_clicked", {
        asset: mockBtcCryptoCurrency.name,
        page: "Wallet",
      });
    });
  });

  describe("onPressShowAll", () => {
    it("navigates to Crypto screen when assetSection is enabled and not readOnly", () => {
      const { result } = renderHook(() => usePortfolioSectionActions(false, "crypto"), {
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { assetSection: true } },
        }),
      });

      act(() => {
        result.current.onPressShowAll();
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
        screen: ScreenName.Crypto,
        params: { sourceScreenName: ScreenName.Portfolio, variant: "crypto" },
      });
    });

    it("navigates to Assets screen when assetSection is disabled", () => {
      const { result } = renderHook(() => usePortfolioSectionActions(false, "crypto"), {
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { assetSection: false } },
        }),
      });

      act(() => {
        result.current.onPressShowAll();
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
        screen: ScreenName.Assets,
      });
    });

    it("navigates to Assets screen when isReadOnly is true regardless of assetSection", () => {
      const { result } = renderHook(() => usePortfolioSectionActions(true, "crypto"), {
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { assetSection: true } },
        }),
      });

      act(() => {
        result.current.onPressShowAll();
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
        screen: ScreenName.Assets,
      });
    });

    it("fires button_clicked analytics with stable type for stablecoin variant", () => {
      const { result } = renderHook(() => usePortfolioSectionActions(false, "stablecoin"));

      act(() => {
        result.current.onPressShowAll();
      });

      expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
        button: "asset_list",
        type: "stable",
        page: "Wallet",
      });
    });

    it("fires button_clicked analytics with crypto type for crypto variant", () => {
      const { result } = renderHook(() => usePortfolioSectionActions(false, "crypto"));

      act(() => {
        result.current.onPressShowAll();
      });

      expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
        button: "asset_list",
        type: "crypto",
        page: "Wallet",
      });
    });
  });
});
