import { usePostOnboardingActionHandlers } from "../usePostOnboardingActionHandlers";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { renderHook, act } from "@tests/test-renderer";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { navigateToPortfolioWalletTab } from "~/navigation/navigateToPortfolioWalletTab";
import { productTourDeeplinkNonceSelector } from "~/reducers/appstate";

jest.mock("LLM/features/Receive", () => ({
  useOpenReceiveDrawer: jest.fn(),
}));

jest.mock("~/navigation/navigateToPortfolioWalletTab", () => ({
  navigateToPortfolioWalletTab: jest.fn(),
}));

const mockUseOpenReceiveDrawer = jest.mocked(useOpenReceiveDrawer);
const mockNavigateToPortfolioWalletTab = jest.mocked(navigateToPortfolioWalletTab);

describe("usePostOnboardingActionHandlers", () => {
  const mockHandleOpenReceiveDrawer = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("with modular drawer", () => {
    beforeEach(() => {
      mockUseOpenReceiveDrawer.mockReturnValue({
        handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
      });
    });

    it("should provide an assetsTransfer handler", () => {
      const { result } = renderHook(() => usePostOnboardingActionHandlers());

      expect(result.current).toHaveProperty(PostOnboardingActionId.assetsTransfer);
      expect(typeof result.current[PostOnboardingActionId.assetsTransfer]).toBe("function");
    });

    it("should open the receive drawer when the assetsTransfer handler is invoked", () => {
      const { result } = renderHook(() => usePostOnboardingActionHandlers());

      act(() => {
        const assetsTransferHandler = result.current[PostOnboardingActionId.assetsTransfer];
        assetsTransferHandler?.();
      });

      expect(mockHandleOpenReceiveDrawer).toHaveBeenCalledTimes(1);
    });
  });

  it("should initialize useOpenReceiveDrawer with the correct source screen name", () => {
    mockUseOpenReceiveDrawer.mockReturnValue({
      handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
    });

    renderHook(() => usePostOnboardingActionHandlers());

    expect(mockUseOpenReceiveDrawer).toHaveBeenCalledWith({
      sourceScreenName: "post-onboarding",
    });
  });

  it("should not provide handlers for unimplemented action IDs", () => {
    mockUseOpenReceiveDrawer.mockReturnValue({
      handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
    });

    const { result } = renderHook(() => usePostOnboardingActionHandlers());

    expect(result.current[PostOnboardingActionId.buyCrypto]).toBeUndefined();
    expect(result.current[PostOnboardingActionId.customImage]).toBeUndefined();
  });

  it("should provide a discoverWallet handler", () => {
    mockUseOpenReceiveDrawer.mockReturnValue({
      handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
    });

    const { result } = renderHook(() => usePostOnboardingActionHandlers());

    expect(result.current).toHaveProperty(PostOnboardingActionId.discoverWallet);
    expect(typeof result.current[PostOnboardingActionId.discoverWallet]).toBe("function");
  });

  it("should tick product tour deeplink and navigate to portfolio wallet tab when discoverWallet is invoked", () => {
    mockUseOpenReceiveDrawer.mockReturnValue({
      handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
    });

    const { result, store } = renderHook(() => usePostOnboardingActionHandlers());

    expect(productTourDeeplinkNonceSelector(store.getState())).toBe(0);

    act(() => {
      result.current[PostOnboardingActionId.discoverWallet]?.();
    });

    expect(productTourDeeplinkNonceSelector(store.getState())).toBe(1);
    expect(mockNavigateToPortfolioWalletTab).toHaveBeenCalledTimes(1);
  });
});
