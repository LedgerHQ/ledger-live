import { renderHook, act } from "@tests/test-renderer";
import { mockBtcCryptoCurrency } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { NavigatorName, ScreenName } from "~/const";
import { useAssetDetailNavigation } from "../useAssetDetailNavigation";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe("useAssetDetailNavigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("openFromAsset", () => {
    it("routes to AssetDetail", () => {
      const { result } = renderHook(() => useAssetDetailNavigation());

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

    it("forwards marketId via marketState (e.g. BNB placeholder)", () => {
      const { result } = renderHook(() => useAssetDetailNavigation());

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
  });

  describe("openFromMarket", () => {
    it("routes to AssetDetail with the market id and marketState", () => {
      const { result } = renderHook(() => useAssetDetailNavigation());

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
      const { result } = renderHook(() => useAssetDetailNavigation());

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
  });
});
