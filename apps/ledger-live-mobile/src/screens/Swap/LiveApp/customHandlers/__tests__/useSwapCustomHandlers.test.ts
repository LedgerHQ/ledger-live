import { CompleteExchangeUiRequest } from "@ledgerhq/live-common/wallet-api/Exchange/server";
import { StackActions, useNavigation } from "@react-navigation/native";
import BigNumber from "bignumber.js";
import { renderHook } from "@tests/test-renderer";
import { useCustomExchangeHandlers } from "~/components/WebPTXPlayer/CustomHandlers";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
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
    it("dispatches StackActions.replace to parent when parent navigator is found", () => {
      mockGetParent.mockReturnValue({ dispatch: mockParentDispatch });

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

    it("calls resetWebview after navigation when parent is found", () => {
      mockGetParent.mockReturnValue({ dispatch: mockParentDispatch });

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
    it("navigates to SwapHistory when swapRedirectToHistory handler is called", () => {
      const { result } = render();

      const handler = (result.current as Record<string, unknown>)["custom.swapRedirectToHistory"];
      expect(typeof handler).toBe("function");

      (handler as () => void)();

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SwapSubScreens, {
        screen: ScreenName.SwapHistory,
      });
    });

    it("resets the webview when swapRedirectToHistory handler is called", () => {
      const { result } = render();

      const handler = (result.current as Record<string, unknown>)["custom.swapRedirectToHistory"];
      expect(typeof handler).toBe("function");

      (handler as () => void)();

      expect(mockResetWebview).toHaveBeenCalledTimes(1);
    });

    it("passes swapId to SwapHistory when swapRedirectToHistory handler is called with params", () => {
      const { result } = render();

      const handler = (result.current as Record<string, unknown>)["custom.swapRedirectToHistory"];
      expect(typeof handler).toBe("function");

      (handler as (request: unknown) => void)({
        params: {
          swapId: "swap-123",
        },
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SwapSubScreens, {
        screen: ScreenName.SwapHistory,
        params: {
          swapId: "swap-123",
        },
      });
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
