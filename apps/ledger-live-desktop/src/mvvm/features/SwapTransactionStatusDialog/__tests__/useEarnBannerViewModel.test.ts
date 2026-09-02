import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  mockEthCryptoCurrency,
  usdcToken,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { track, trackPage } from "~/renderer/analytics/segment";
import {
  openSwapTransactionStatusDialog,
  selectIsSwapTransactionStatusDialogOpen,
} from "../swapTransactionStatusDialog";
import { useEarnBannerViewModel } from "../hooks/useEarnBannerViewModel";

const mockNavigate = jest.fn();
const mockUseInterestRatesByCurrencies = jest.fn().mockReturnValue({});
const mockUseAssetsData = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("@features/platform-aggregated-assets", () => ({
  ...jest.requireActual("@features/platform-aggregated-assets"),
  useAssetsData: (...args: unknown[]) => mockUseAssetsData(...args),
  useInterestRatesByCurrencies: (...args: unknown[]) => mockUseInterestRatesByCurrencies(...args),
}));

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = mockEthCryptoCurrency;
const provider = "lifi";
const positiveApy = { value: 0.05, type: "APY" as const };

const defaultProps = {
  sendCurrency: bitcoin,
  receiveCurrency: ethereum,
  provider,
};

function renderEarnBanner(
  props: Parameters<typeof useEarnBannerViewModel>[0] = defaultProps,
  flag: { enabled?: boolean; params?: { promotedTokens?: string[] } } = { enabled: true },
) {
  return renderHook(() => useEarnBannerViewModel(props), {
    initialState: withFlagOverrides({ ptxEarnTransactionSuccessBanner: flag }),
  });
}

describe("useEarnBannerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInterestRatesByCurrencies.mockReturnValue({
      [ethereum.id]: positiveApy,
      [usdcToken.id]: positiveApy,
    });
  });

  it("should be visible when the flag is enabled, the ticker is promoted, and APY is greater than 0", () => {
    const { result } = renderEarnBanner();

    expect(result.current.isVisible).toBe(true);
    expect(result.current.title).toBe("Earn up to 5.00% APY");
    expect(result.current.description).toBe("Explore Earn opportunities");
    expect(result.current.buttonLabel).toBe("Explore");
    expect(trackPage).toHaveBeenCalledWith("swap earn promoter", null, {
      page: "swapTransactionSuccess",
      flow: "swap",
      sourceCurrency: "BTC",
      targetCurrency: "ETH",
      targetCurrencyID: ethereum.id,
      provider,
      promotedToken: "ETH",
    });
  });

  it("should be hidden when the feature flag is disabled", () => {
    const { result } = renderEarnBanner(defaultProps, { enabled: false });

    expect(result.current.isVisible).toBe(false);
    expect(result.current.title).toBeUndefined();
    expect(trackPage).not.toHaveBeenCalled();
    expect(mockUseAssetsData).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
  });

  it("should be visible for a promoted token ticker", () => {
    const { result } = renderEarnBanner({
      ...defaultProps,
      receiveCurrency: usdcToken,
    });

    expect(result.current.isVisible).toBe(true);
    expect(result.current.title).toBe("Earn up to 5.00% APY");
  });

  it("should be hidden when the receive ticker is not promoted", () => {
    const { result } = renderEarnBanner({
      ...defaultProps,
      receiveCurrency: bitcoin,
    });

    expect(result.current.isVisible).toBe(false);
    expect(result.current.title).toBeUndefined();
    expect(trackPage).not.toHaveBeenCalled();
  });

  it("should be visible when the flag params promote a non-default ticker", () => {
    mockUseInterestRatesByCurrencies.mockReturnValue({
      [bitcoin.id]: positiveApy,
    });

    const { result } = renderEarnBanner(
      { ...defaultProps, receiveCurrency: bitcoin },
      { enabled: true, params: { promotedTokens: ["BTC"] } },
    );

    expect(result.current.isVisible).toBe(true);
  });

  it("should be hidden when the flag params list is empty", () => {
    const { result } = renderEarnBanner(defaultProps, {
      enabled: true,
      params: { promotedTokens: [] },
    });

    expect(result.current.isVisible).toBe(false);
    expect(result.current.title).toBeUndefined();
  });

  it("should be hidden when APY is 0", () => {
    mockUseInterestRatesByCurrencies.mockReturnValue({
      [ethereum.id]: { value: 0, type: "APY" },
    });

    const { result } = renderEarnBanner();

    expect(result.current.isVisible).toBe(false);
    expect(result.current.title).toBeUndefined();
    expect(trackPage).not.toHaveBeenCalled();
  });

  it("should be hidden when no interest rate is available", () => {
    mockUseInterestRatesByCurrencies.mockReturnValue({});

    const { result } = renderEarnBanner();

    expect(result.current.isVisible).toBe(false);
    expect(result.current.title).toBeUndefined();
  });

  it("should close the dialog and navigate to /earn when onExplore is called", () => {
    const { result, store } = renderEarnBanner();

    act(() => {
      store.dispatch(openSwapTransactionStatusDialog({ swapId: "swap-1", provider }));
    });
    expect(selectIsSwapTransactionStatusDialogOpen(store.getState())).toBe(true);

    act(() => {
      result.current.onExplore();
    });

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "earn_promoter",
      page: "swapTransactionSuccess",
      flow: "swap",
      sourceCurrency: "BTC",
      targetCurrency: "ETH",
      targetCurrencyID: ethereum.id,
      provider,
      promotedToken: "ETH",
    });
    expect(selectIsSwapTransactionStatusDialogOpen(store.getState())).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith("/earn");
  });
});
