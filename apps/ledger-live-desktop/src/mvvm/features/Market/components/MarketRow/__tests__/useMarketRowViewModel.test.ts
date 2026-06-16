import { renderHook, act } from "tests/testSetup";
import { MOCK_MARKET_CURRENCY_DATA } from "@ledgerhq/live-common/market/utils/fixtures";
import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { useMarketRowViewModel } from "../useMarketRowViewModel";
import { useMarketActions } from "LLD/features/Market/hooks/useMarketActions";

const mockNavigate = jest.fn();
const mockOnBuy = jest.fn();
const mockOnSell = jest.fn();
const mockOnSwap = jest.fn();
const mockOnStake = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("LLD/features/Market/hooks/useMarketActions", () => ({
  Page: { Market: "Page Market", MarketCoin: "Page Market Coin" },
  useMarketActions: jest.fn(),
}));

jest.mock("~/renderer/hooks/useGetStakeLabelLocaleBased", () => ({
  useGetStakeLabelLocaleBased: () => "Earn",
}));

const mockShouldDisplayAggregatedAssets = jest.fn(() => true);
jest.mock("@features/platform-feature-flags", () => ({
  ...jest.requireActual("@features/platform-feature-flags"),
  useWalletFeaturesConfig: () => ({
    shouldDisplayAggregatedAssets: mockShouldDisplayAggregatedAssets(),
    shouldDisplayAssetSection: true,
    shouldDisplayWallet40MainNav: true,
  }),
}));

const mockedUseMarketActions = jest.mocked(useMarketActions);

const bitcoinCurrency = MOCK_MARKET_CURRENCY_DATA[0];

const allActionsAvailable = {
  onBuy: mockOnBuy,
  onSell: mockOnSell,
  onSwap: mockOnSwap,
  onStake: mockOnStake,
  availableOnBuy: true,
  availableOnSell: true,
  availableOnSwap: true,
  availableOnStake: true,
};

function renderViewModel(overrides: Partial<Parameters<typeof useMarketRowViewModel>[0]> = {}) {
  return renderHook(() =>
    useMarketRowViewModel({
      size: 56,
      start: 112,
      currency: bitcoinCurrency,
      counterCurrency: "usd",
      locale: "en",
      range: "24h",
      isStarred: false,
      toggleStar: jest.fn(),
      ...overrides,
    }),
  );
}

describe("useMarketRowViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShouldDisplayAggregatedAssets.mockReturnValue(true);
    mockedUseMarketActions.mockReturnValue(allActionsAvailable);
  });

  it("should build the absolute-positioning style from size and start", () => {
    const { result } = renderViewModel({ size: 56, start: 112 });

    expect(result.current.style).toEqual({
      height: "56px",
      transform: "translateY(112px)",
    });
  });

  it("should keep a stable style reference across re-renders with same size/start", () => {
    const { result, rerender } = renderViewModel();

    const firstStyle = result.current.style;
    rerender();
    expect(result.current.style).toBe(firstStyle);
  });

  it("should select priceChangePercentage based on range", () => {
    const { result } = renderViewModel({ range: "24h" });

    expect(result.current.priceChangePercentage).toBe(
      bitcoinCurrency.priceChangePercentage[KeysPriceChange.day],
    );
  });

  it("should format price, volume and market cap as non-empty strings", () => {
    const { result } = renderViewModel();

    expect(typeof result.current.formattedPrice).toBe("string");
    expect(result.current.formattedPrice.length).toBeGreaterThan(0);
    expect(result.current.formattedVolume.length).toBeGreaterThan(0);
    expect(result.current.formattedMarketCap.length).toBeGreaterThan(0);
  });

  it("should navigate to /asset/ when shouldDisplayAggregatedAssets is true", () => {
    mockShouldDisplayAggregatedAssets.mockReturnValue(true);
    const { result } = renderViewModel();

    act(() => result.current.onCurrencyClick());

    expect(mockNavigate).toHaveBeenCalledWith(`/asset/${bitcoinCurrency.id}`, {
      state: bitcoinCurrency,
    });
  });

  it("should navigate to /market/ when shouldDisplayAggregatedAssets is false", () => {
    mockShouldDisplayAggregatedAssets.mockReturnValue(false);
    const { result } = renderViewModel();

    act(() => result.current.onCurrencyClick());

    expect(mockNavigate).toHaveBeenCalledWith(`/market/${bitcoinCurrency.id}`, {
      state: bitcoinCurrency,
    });
  });

  it("should route buySellAction to onBuy when buy is available", () => {
    const { result } = renderViewModel();

    expect(result.current.buySellAction.available).toBe(true);
    expect(result.current.buySellAction.onClick).toBe(mockOnBuy);
  });

  it("should route buySellAction to onSell when only sell is available", () => {
    mockedUseMarketActions.mockReturnValue({ ...allActionsAvailable, availableOnBuy: false });
    const { result } = renderViewModel();

    expect(result.current.buySellAction.available).toBe(true);
    expect(result.current.buySellAction.onClick).toBe(mockOnSell);
  });

  it("should mark buySellAction unavailable when neither buy nor sell is available", () => {
    mockedUseMarketActions.mockReturnValue({
      ...allActionsAvailable,
      availableOnBuy: false,
      availableOnSell: false,
    });
    const { result } = renderViewModel();

    expect(result.current.buySellAction.available).toBe(false);
  });

  it("should expose swap and earn actions reflecting availability and label", () => {
    const { result } = renderViewModel();

    expect(result.current.swapAction).toEqual({ available: true, onClick: mockOnSwap });
    expect(result.current.earnAction).toEqual({
      available: true,
      onClick: mockOnStake,
      label: "Earn",
    });
  });

  it("should defer the favourite toggle until the menu closes", () => {
    const toggleStar = jest.fn();
    const { result } = renderViewModel({ toggleStar, isStarred: false });

    // Selecting the favourite item should not toggle immediately.
    act(() => result.current.onFavouriteSelect());
    expect(toggleStar).not.toHaveBeenCalled();

    // Toggling fires once the menu finishes closing.
    act(() => result.current.onMenuOpenChange(false));
    expect(toggleStar).toHaveBeenCalledWith(bitcoinCurrency.id, false);
  });

  it("should not toggle the favourite when the menu closes without a pending selection", () => {
    const toggleStar = jest.fn();
    const { result } = renderViewModel({ toggleStar });

    act(() => result.current.onMenuOpenChange(false));
    expect(toggleStar).not.toHaveBeenCalled();
  });

  it("should not toggle the favourite while the menu is still open", () => {
    const toggleStar = jest.fn();
    const { result } = renderViewModel({ toggleStar });

    act(() => result.current.onFavouriteSelect());
    act(() => result.current.onMenuOpenChange(true));
    expect(toggleStar).not.toHaveBeenCalled();
  });
});
