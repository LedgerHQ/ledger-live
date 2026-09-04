import { CompleteExchangeUiRequest } from "@ledgerhq/live-common/wallet-api/Exchange/server";
import { StackActions, useNavigation } from "@react-navigation/native";
import BigNumber from "bignumber.js";
import { renderHook } from "@tests/test-renderer";
import { useCustomExchangeHandlers } from "~/components/WebPTXPlayer/CustomHandlers";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
import { openSwapTransactionStatusDrawer } from "~/reducers/swapTransactionStatusDrawer";
import { useSwapCustomHandlers } from "../index";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: jest.fn(),
}));

jest.mock("~/components/WebPTXPlayer/CustomHandlers", () => ({
  useCustomExchangeHandlers: jest.fn(() => ({})),
}));

jest.mock("~/e2e/bridge/client", () => ({
  sendSwapLiveAppReady: jest.fn(),
}));

jest.mock("../getFee", () => ({
  getFee: jest.fn(() => jest.fn()),
}));

jest.mock("../getTransactionByHash", () => ({
  getTransactionByHash: jest.fn(() => jest.fn()),
}));

jest.mock("../saveSwapToHistory", () => ({
  saveSwapToHistory: jest.fn(() => jest.fn()),
}));

const mockParentDispatch = jest.fn();
const mockDispatch = jest.fn();
const mockNavigate = jest.fn();
const mockGetParent = jest.fn();

/** BaseNavigator with a transient swap screen (`routeName`) pushed over Main. */
function mockBaseNavigatorFocusedOn(routeName: string) {
  mockGetParent.mockReturnValue({
    dispatch: mockParentDispatch,
    getState: () => ({ index: 1, routes: [{ name: NavigatorName.Main }, { name: routeName }] }),
  });
}

/** BaseNavigator sitting on Main, i.e. the user is on the Swap tab itself. */
function mockBaseNavigatorOnSwapTab() {
  mockGetParent.mockReturnValue({
    dispatch: mockParentDispatch,
    getState: () => ({ index: 0, routes: [{ name: NavigatorName.Main }] }),
  });
}

const MOCK_EXCHANGE_PARAMS = {
  provider: "lifi",
  swapId: "swap-123",
  transaction: { recipient: "0xabc", amount: BigNumber(1) },
  exchange: { toCurrency: { id: "ethereum" }, fromCurrency: { id: "bitcoin" } },
  amountExpectedTo: 2,
  isEmbeddedSwap: false,
  sponsored: false,
} as unknown as CompleteExchangeUiRequest;

const MOCK_MANIFEST = { id: "swap" } as never;
const MOCK_ACCOUNTS = [] as never[];
const MOCK_DISPATCH = jest.fn() as never;

describe("useSwapCustomHandlers", () => {
  let capturedOnCompleteResult: (
    params: CompleteExchangeUiRequest,
    hash: string,
  ) => void = () => {};
  let capturedOnCompleteError: (error: Error) => void = () => {};
  let capturedHandleLoaderDrawer: () => void = () => {};
  let mockResetWebview: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockResetWebview = jest.fn();

    jest.mocked(useNavigation).mockReturnValue({
      dispatch: mockDispatch,
      navigate: mockNavigate,
      getParent: mockGetParent,
    } as never);

    jest
      .mocked(useCustomExchangeHandlers)
      .mockImplementation(({ onCompleteResult, onCompleteError, handleLoaderDrawer }) => {
        capturedOnCompleteResult = onCompleteResult as (
          params: CompleteExchangeUiRequest,
          hash: string,
        ) => void;
        capturedOnCompleteError = onCompleteError as (error: Error) => void;
        capturedHandleLoaderDrawer = handleLoaderDrawer as () => void;
        return {};
      });
  });

  function render() {
    return renderHook(() =>
      useSwapCustomHandlers(MOCK_MANIFEST, MOCK_ACCOUNTS, MOCK_DISPATCH, mockResetWebview),
    );
  }

  describe("navigateToSwapPendingOperation (via onCompleteResult)", () => {
    it("dispatches StackActions.replace to parent when a transient swap screen is focused", () => {
      mockBaseNavigatorFocusedOn(NavigatorName.PlatformExchange);

      render();

      capturedOnCompleteResult(MOCK_EXCHANGE_PARAMS, "hash-abc");

      expect(mockGetParent).toHaveBeenCalledWith(BASE_NAVIGATOR_ID);
      expect(mockParentDispatch).toHaveBeenCalledWith(
        StackActions.replace(NavigatorName.SwapSubScreens, {
          screen: ScreenName.SwapPendingOperation,
          params: {
            swapOperation: {
              provider: "lifi",
              swapId: "swap-123",
              status: "pending",
              receiverAccountId: "0xabc",
              toCurrency: { id: "ethereum" },
              fromCurrency: { id: "bitcoin" },
              operationId: "hash-abc",
              fromAmount: BigNumber(1),
              toAmount: BigNumber(2),
            },
            isEmbeddedSwap: false,
            sponsored: false,
          },
        }),
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("calls navigation.navigate directly when parent navigator is not found", () => {
      mockGetParent.mockReturnValue(undefined);

      render();

      capturedOnCompleteResult(MOCK_EXCHANGE_PARAMS, "hash-xyz");

      expect(mockGetParent).toHaveBeenCalledWith(BASE_NAVIGATOR_ID);
      expect(mockParentDispatch).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SwapSubScreens, {
        screen: ScreenName.SwapPendingOperation,
        params: {
          swapOperation: {
            provider: "lifi",
            swapId: "swap-123",
            status: "pending",
            receiverAccountId: "0xabc",
            toCurrency: { id: "ethereum" },
            fromCurrency: { id: "bitcoin" },
            operationId: "hash-xyz",
            fromAmount: BigNumber(1),
            toAmount: BigNumber(2),
          },
          isEmbeddedSwap: false,
          sponsored: false,
        },
      });
    });

    it("pushes instead of replacing when the Swap tab (Main) is the focused base route", () => {
      mockBaseNavigatorOnSwapTab();

      render();

      capturedOnCompleteResult(MOCK_EXCHANGE_PARAMS, "hash-abc");

      expect(mockParentDispatch).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SwapSubScreens, {
        screen: ScreenName.SwapPendingOperation,
        params: expect.objectContaining({ isEmbeddedSwap: false }),
      });
    });

    it("calls resetWebview after navigation when parent is found", () => {
      mockBaseNavigatorFocusedOn(NavigatorName.PlatformExchange);

      render();

      capturedOnCompleteResult(MOCK_EXCHANGE_PARAMS, "hash-abc");

      expect(mockResetWebview).toHaveBeenCalledTimes(1);
    });

    it("calls resetWebview after navigation when parent is not found", () => {
      mockGetParent.mockReturnValue(undefined);

      render();

      capturedOnCompleteResult(MOCK_EXCHANGE_PARAMS, "hash-xyz");

      expect(mockResetWebview).toHaveBeenCalledTimes(1);
    });
  });

  describe("navigateToSwapCustomError (via onCompleteError)", () => {
    it("navigates to SwapCustomError with the error", () => {
      render();

      const error = new Error("swap failed");
      capturedOnCompleteError(error);

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SwapSubScreens, {
        screen: ScreenName.SwapCustomError,
        params: { error },
      });
    });
  });

  describe("handleShowLoadingDrawer (via handleLoaderDrawer)", () => {
    it("navigates to SwapLoading", () => {
      render();

      capturedHandleLoaderDrawer();

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SwapSubScreens, {
        screen: ScreenName.SwapLoading,
      });
    });
  });

  describe("navigateToSwapHistory", () => {
    function callHandler(request?: unknown) {
      const { result } = render();
      const handler = (result.current as Record<string, unknown>)["custom.swapRedirectToHistory"];
      expect(typeof handler).toBe("function");
      (handler as (request?: unknown) => void)(request);
    }

    it("pushes SwapHistory over the Swap tab instead of replacing Main", () => {
      mockBaseNavigatorOnSwapTab();

      callHandler();

      expect(mockGetParent).toHaveBeenCalledWith(BASE_NAVIGATOR_ID);
      expect(mockParentDispatch).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SwapSubScreens, {
        screen: ScreenName.SwapHistory,
      });
    });

    it("replaces a transient swap screen when one is focused", () => {
      mockBaseNavigatorFocusedOn(NavigatorName.SwapSubScreens);

      callHandler();

      expect(mockParentDispatch).toHaveBeenCalledWith(
        StackActions.replace(NavigatorName.SwapSubScreens, {
          screen: ScreenName.SwapHistory,
        }),
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("calls navigation.navigate when parent navigator is not found", () => {
      mockGetParent.mockReturnValue(undefined);

      callHandler();

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SwapSubScreens, {
        screen: ScreenName.SwapHistory,
      });
    });

    it("resets the webview so the Swap tab is not left on the page it redirected from", () => {
      mockBaseNavigatorOnSwapTab();

      callHandler();

      expect(mockResetWebview).toHaveBeenCalledTimes(1);
      // Without a swapId there is nothing to open, so the status drawer stays closed.
      expect(MOCK_DISPATCH).not.toHaveBeenCalledWith(
        openSwapTransactionStatusDrawer(expect.anything()),
      );
    });

    it("passes swapId to SwapHistory and opens the status drawer when called with params", () => {
      mockBaseNavigatorOnSwapTab();

      callHandler({ params: { swapId: "swap-123", provider: "lifi" } });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SwapSubScreens, {
        screen: ScreenName.SwapHistory,
        params: { swapId: "swap-123" },
      });
      // The status drawer opens directly with the forwarded swapId/provider so it
      // does not depend on the swap operation being synced into local history first.
      expect(MOCK_DISPATCH).toHaveBeenCalledWith(
        openSwapTransactionStatusDrawer({ swapId: "swap-123", provider: "lifi" }),
      );
    });
  });

  describe("returned handlers shape", () => {
    it("includes custom.getFee, custom.getTransactionByHash, custom.saveSwapToHistory, custom.swapRedirectToHistory", () => {
      const { result } = render();

      const handlers = result.current as Record<string, unknown>;
      expect(typeof handlers["custom.getFee"]).toBe("function");
      expect(typeof handlers["custom.getTransactionByHash"]).toBe("function");
      expect(typeof handlers["custom.saveSwapToHistory"]).toBe("function");
      expect(typeof handlers["custom.swapRedirectToHistory"]).toBe("function");
    });
  });
});
