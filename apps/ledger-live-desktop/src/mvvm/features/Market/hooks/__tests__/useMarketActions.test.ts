import { renderHook, act, waitFor } from "tests/testSetup";
import { server } from "tests/server";
import { http, HttpResponse } from "msw";
import { useMarketActions, Page } from "../useMarketActions";
import { MOCK_MARKET_CURRENCY_DATA } from "@ledgerhq/live-common/market/utils/fixtures";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { DADA_API, EMPTY_DADA_RESPONSE } from "./shared";

const mockNavigateToSwap = jest.fn();
const mockNavigateToBuy = jest.fn();
const mockStartStakeFlow = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useLocation: () => ({ pathname: "/market" }),
}));

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog");
jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index");

jest.mock("../useSwapNavigation", () => ({
  useSwapNavigation: () => ({ navigateToSwap: mockNavigateToSwap }),
}));

jest.mock("../useBuyNavigation", () => ({
  useBuyNavigation: () => ({ navigateToBuy: mockNavigateToBuy }),
}));

jest.mock("~/renderer/screens/stake", () => () => mockStartStakeFlow);

jest.mock("~/renderer/screens/exchange/Swap2/utils", () => ({
  useGetSwapTrackingProperties: () => ({ swapVersion: "2" }),
}));

jest.mock("LLD/hooks/useStake", () => ({
  useStake: () => ({
    getCanStakeCurrency: (id: string) => id === "bitcoin",
    enabledCurrencies: ["bitcoin"],
    partnerSupportedAssets: [],
    getCanStakeUsingPlatformApp: () => false,
    getCanStakeUsingLedgerLive: () => false,
    getRouteToPlatformApp: () => null,
  }),
}));

const mockEvent = {
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
} as unknown as React.SyntheticEvent<HTMLButtonElement>;

const mockCurrency = MOCK_MARKET_CURRENCY_DATA[0];

const renderMarketActionsHook = (currency = mockCurrency, page = Page.Market) =>
  renderHook(() => useMarketActions({ currency, page }));

describe("useMarketActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(useRampCatalog).mockReturnValue({
      isCurrencyAvailable: () => true,
    } as unknown as ReturnType<typeof useRampCatalog>);

    jest.mocked(useFetchCurrencyAll).mockReturnValue({
      data: ["bitcoin", "ethereum"],
    } as unknown as ReturnType<typeof useFetchCurrencyAll>);
  });

  it("should return availableOnBuy=true when currency is supported and buy is available", () => {
    const { result } = renderMarketActionsHook();

    expect(result.current.availableOnBuy).toBe(true);
  });

  it("should return availableOnBuy=false when currency ledgerIds are deactivated", () => {
    const deactivatedCurrency = { ...mockCurrency, ledgerIds: ["arbitrum"] };

    const { result } = renderMarketActionsHook(deactivatedCurrency);

    expect(result.current.availableOnBuy).toBe(false);
  });

  it("should return availableOnSwap=true when currency ledgerId is in the swap set", () => {
    const { result } = renderMarketActionsHook();

    expect(result.current.availableOnSwap).toBe(true);
  });

  it("should return availableOnSwap=false when currency is not in swap set", () => {
    jest.mocked(useFetchCurrencyAll).mockReturnValue({
      data: ["solana"],
    } as unknown as ReturnType<typeof useFetchCurrencyAll>);

    const { result } = renderMarketActionsHook();

    expect(result.current.availableOnSwap).toBe(false);
  });

  it("should return availableOnStake=true when getCanStakeCurrency returns true", () => {
    const { result } = renderMarketActionsHook();

    expect(result.current.availableOnStake).toBe(true);
  });

  it("onBuy should call getLedgerCurrency and navigateToBuy", async () => {
    const { result } = renderMarketActionsHook();

    await act(async () => {
      await result.current.onBuy(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockNavigateToBuy).toHaveBeenCalledWith(
      expect.objectContaining({ id: "bitcoin" }),
      mockCurrency.ticker,
    );
  });

  it("onSwap should call getLedgerCurrency and navigateToSwap", async () => {
    const { result } = renderMarketActionsHook();

    await act(async () => {
      await result.current.onSwap(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();

    expect(mockNavigateToSwap).toHaveBeenCalledWith(expect.objectContaining({ id: "bitcoin" }));
  });

  it("onSwap should return early if ledgerCurrency.id is falsy", async () => {
    server.use(http.get(DADA_API, () => HttpResponse.json(EMPTY_DADA_RESPONSE)));

    const { result } = renderMarketActionsHook();

    await act(async () => {
      await result.current.onSwap(mockEvent);
    });

    expect(mockNavigateToSwap).not.toHaveBeenCalled();
  });

  it("onStake should call getLedgerCurrency, track, and startStakeFlow", async () => {
    const { result } = renderMarketActionsHook();

    await act(async () => {
      await result.current.onStake(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();

    expect(mockStartStakeFlow).toHaveBeenCalledWith(
      expect.objectContaining({
        currencies: ["bitcoin"],
        source: Page.Market,
        returnTo: "/market",
      }),
    );
  });

  it("onStake should use currency ticker when getLedgerCurrency returns null", async () => {
    server.use(http.get(DADA_API, () => HttpResponse.json(EMPTY_DADA_RESPONSE)));

    const { result } = renderMarketActionsHook();

    await act(async () => {
      await result.current.onStake(mockEvent);
    });

    await waitFor(() => {
      expect(mockStartStakeFlow).toHaveBeenCalledWith(
        expect.objectContaining({ currencies: undefined }),
      );
    });
  });
});
