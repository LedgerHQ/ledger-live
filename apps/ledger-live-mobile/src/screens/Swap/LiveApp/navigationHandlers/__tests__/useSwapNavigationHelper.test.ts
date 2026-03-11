import { act, renderHook } from "@testing-library/react-native";
import { SwapWebviewAllowedPageNames } from "~/components/Web3AppWebview/types";
import { useSwapNavigationHelper } from "../useSwapNavigationHelper";
import { useIsSwapTab } from "../useIsSwapTab";

jest.mock("../useIsSwapTab", () => ({
  useIsSwapTab: jest.fn(),
}));

const mockedUseIsSwapTab = jest.mocked(useIsSwapTab);

describe("useSwapNavigationHelper", () => {
  const setParams = jest.fn();
  const navigation = {
    setParams,
  } as never;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseIsSwapTab.mockReturnValue({
      isSwapTabScreen: true,
      swapTabScreen: null,
    });
  });

  it("should mark query-param quotes list as back-navigable", () => {
    const { result } = renderHook(() => useSwapNavigationHelper({ navigation }));

    act(() => {
      result.current({
        url: "https://swap.live.app/?tab=QUOTES_LIST",
        canGoBack: false,
      });
    });

    expect(setParams).toHaveBeenCalledWith({
      swapNavigationParams: {
        tab: "QUOTES_LIST",
        page: SwapWebviewAllowedPageNames.QuotesList,
        canGoBack: true,
      },
    });
  });

  it("should preserve legacy quotes routes as back-navigable", () => {
    const { result } = renderHook(() => useSwapNavigationHelper({ navigation }));

    act(() => {
      result.current({
        url: "https://swap.live.app/quotes?tab=QUOTES_LIST",
        canGoBack: false,
      });
    });

    expect(setParams).toHaveBeenCalledWith({
      swapNavigationParams: {
        tab: "QUOTES_LIST",
        page: SwapWebviewAllowedPageNames.QuotesList,
        canGoBack: true,
      },
    });
  });

  it("should force unknown error pages to disable back navigation", () => {
    const { result } = renderHook(() => useSwapNavigationHelper({ navigation }));

    act(() => {
      result.current({
        url: "https://swap.live.app/unknown-error",
        canGoBack: true,
      });
    });

    expect(setParams).toHaveBeenCalledWith({
      swapNavigationParams: {
        tab: null,
        page: SwapWebviewAllowedPageNames.UnknownError,
        canGoBack: false,
      },
    });
  });

  it("should preserve completed two-step approval state", () => {
    const { result } = renderHook(() => useSwapNavigationHelper({ navigation }));

    act(() => {
      result.current({
        url: "https://swap.live.app/multi-step-transaction?transactionStatus=complete",
        canGoBack: true,
      });
    });

    expect(setParams).toHaveBeenCalledWith({
      swapNavigationParams: {
        tab: null,
        page: SwapWebviewAllowedPageNames.TwoStepApproval,
        canGoBack: true,
        isTransactionComplete: true,
      },
    });
  });
});
