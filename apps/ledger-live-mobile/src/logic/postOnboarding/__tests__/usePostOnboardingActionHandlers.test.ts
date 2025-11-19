import { usePostOnboardingActionHandlers } from "../usePostOnboardingActionHandlers";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { renderHook, act } from "@tests/test-renderer";
import { useOpenReceiveDrawer } from "LLM/features/Receive";

jest.mock("LLM/features/Receive", () => ({
  useOpenReceiveDrawer: jest.fn(),
}));

const mockUseOpenReceiveDrawer = jest.mocked(useOpenReceiveDrawer);

describe("usePostOnboardingActionHandlers", () => {
  const mockHandleOpenReceiveDrawer = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when modular drawer is enabled", () => {
    beforeEach(() => {
      mockUseOpenReceiveDrawer.mockReturnValue({
        handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
        isModularDrawerEnabled: true,
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

  describe("when modular drawer is disabled", () => {
    beforeEach(() => {
      mockUseOpenReceiveDrawer.mockReturnValue({
        handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
        isModularDrawerEnabled: false,
      });
    });

    it("should not provide an assetsTransfer handler", () => {
      const { result } = renderHook(() => usePostOnboardingActionHandlers());

      expect(result.current[PostOnboardingActionId.assetsTransfer]).toBeUndefined();
    });

    it("should not invoke handleOpenReceiveDrawer when attempting to call undefined handler", () => {
      const { result } = renderHook(() => usePostOnboardingActionHandlers());

      act(() => {
        const assetsTransferHandler = result.current[PostOnboardingActionId.assetsTransfer];
        assetsTransferHandler?.();
      });

      expect(mockHandleOpenReceiveDrawer).not.toHaveBeenCalled();
    });
  });

  it("should initialize useOpenReceiveDrawer with the correct source screen name", () => {
    mockUseOpenReceiveDrawer.mockReturnValue({
      handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
      isModularDrawerEnabled: true,
    });

    renderHook(() => usePostOnboardingActionHandlers());

    expect(mockUseOpenReceiveDrawer).toHaveBeenCalledWith({
      sourceScreenName: "post-onboarding",
    });
  });

  it("should not provide handlers for unimplemented action IDs", () => {
    mockUseOpenReceiveDrawer.mockReturnValue({
      handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
      isModularDrawerEnabled: true,
    });

    const { result } = renderHook(() => usePostOnboardingActionHandlers());

    expect(result.current[PostOnboardingActionId.buyCrypto]).toBeUndefined();
    expect(result.current[PostOnboardingActionId.customImage]).toBeUndefined();
  });
});
