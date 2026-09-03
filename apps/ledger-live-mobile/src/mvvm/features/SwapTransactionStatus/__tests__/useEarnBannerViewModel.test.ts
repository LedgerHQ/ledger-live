import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  mockEthCryptoCurrency,
  usdcToken,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { screen, track } from "~/analytics";
import { NavigatorName } from "~/const";
import { openSwapTransactionStatusDrawer } from "~/reducers/swapTransactionStatusDrawer";
import { useEarnBannerViewModel } from "../hooks/useEarnBannerViewModel";

const mockNavigate = jest.fn();
const mockUseInterestRatesByCurrencies = jest.fn().mockReturnValue({});
const mockUseAssetsData = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
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
    overrideInitialState: withFlagOverrides({
      ptxEarnTransactionSuccessBanner: flag,
    }),
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
    expect(screen).toHaveBeenCalledWith("swap earn promoter", null, {
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
    expect(screen).not.toHaveBeenCalled();
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
    expect(screen).not.toHaveBeenCalled();
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
    expect(screen).not.toHaveBeenCalled();
  });

  it("should be hidden when no interest rate is available", () => {
    mockUseInterestRatesByCurrencies.mockReturnValue({});

    const { result } = renderEarnBanner();

    expect(result.current.isVisible).toBe(false);
    expect(result.current.title).toBeUndefined();
  });

  it("should close the drawer and navigate to Earn when onExplore is called", () => {
    const { result, store } = renderEarnBanner();

    act(() => {
      store.dispatch(openSwapTransactionStatusDrawer({ swapId: "swap-1", provider }));
    });
    expect(store.getState().swapTransactionStatusDrawer.isOpen).toBe(true);

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
    expect(store.getState().swapTransactionStatusDrawer.isOpen).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Main, {
      screen: NavigatorName.Earn,
    });
  });
});
