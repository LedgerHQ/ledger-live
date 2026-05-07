import { renderHook } from "@tests/test-renderer";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { useBorrowWebViewViewModel } from "../useBorrowWebViewViewModel";

const mockUseDeeplinkCustomHandlers = jest.fn();

jest.mock("~/components/WebPlatformPlayer/CustomHandlers", () => ({
  useDeeplinkCustomHandlers: () => mockUseDeeplinkCustomHandlers(),
}));

describe("useBorrowWebViewViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("merges deeplink handlers with provided custom handlers", () => {
    const deeplinkHandler = jest.fn();
    const appHandler = jest.fn();
    const deeplinkHandlers = {
      openAccount: deeplinkHandler,
    } as unknown as WalletAPICustomHandlers;
    const providedHandlers = {
      openReceiveFunds: appHandler,
    } as unknown as WalletAPICustomHandlers;
    mockUseDeeplinkCustomHandlers.mockReturnValue(deeplinkHandlers);

    const { result } = renderHook(() =>
      useBorrowWebViewViewModel({
        customHandlers: providedHandlers,
      }),
    );

    expect(result.current.mergedCustomHandlers).toMatchObject({
      ...deeplinkHandlers,
      ...providedHandlers,
    });
  });

  it("lets custom handlers override deeplink handlers on same key", () => {
    const deeplinkHandler = jest.fn();
    const overridingHandler = jest.fn();
    const deeplinkHandlers = {
      openAccount: deeplinkHandler,
    } as unknown as WalletAPICustomHandlers;
    const providedHandlers = {
      openAccount: overridingHandler,
    } as unknown as WalletAPICustomHandlers;
    mockUseDeeplinkCustomHandlers.mockReturnValue(deeplinkHandlers);

    const { result } = renderHook(() =>
      useBorrowWebViewViewModel({
        customHandlers: providedHandlers,
      }),
    );

    const mergedHandlers = result.current.mergedCustomHandlers as unknown as Record<string, unknown>;

    expect(mergedHandlers.openAccount).toBe(overridingHandler);
  });
});
