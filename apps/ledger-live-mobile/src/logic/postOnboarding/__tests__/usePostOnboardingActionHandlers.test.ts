import { usePostOnboardingActionHandlers } from "../usePostOnboardingActionHandlers";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { renderHook, act } from "@tests/test-renderer";
import { useOpenReceiveDrawer } from "LLM/features/Receive";

jest.mock("LLM/features/Receive", () => ({
  useOpenReceiveDrawer: jest.fn(),
}));

const mockUseOpenReceiveDrawer = useOpenReceiveDrawer as jest.MockedFunction<
  typeof useOpenReceiveDrawer
>;

describe("usePostOnboardingActionHandlers", () => {
  const mockHandleOpenReceiveDrawer = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return assetsTransfer handler when modular drawer is enabled", () => {
    mockUseOpenReceiveDrawer.mockReturnValue({
      handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
      isModularDrawerEnabled: true,
    });

    const { result } = renderHook(() => usePostOnboardingActionHandlers());

    expect(result.current).toHaveProperty(PostOnboardingActionId.assetsTransfer);
    expect(typeof result.current[PostOnboardingActionId.assetsTransfer]).toBe("function");
  });

  it("should open receive drawer when assetsTransfer action is triggered with modular drawer enabled", () => {
    mockUseOpenReceiveDrawer.mockReturnValue({
      handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
      isModularDrawerEnabled: true,
    });

    const { result } = renderHook(() => usePostOnboardingActionHandlers());

    act(() => {
      const assetsTransferHandler = result.current[PostOnboardingActionId.assetsTransfer];
      assetsTransferHandler?.();
    });

    expect(mockHandleOpenReceiveDrawer).toHaveBeenCalledTimes(1);
  });

  it("should not open receive drawer when assetsTransfer action is triggered with modular drawer disabled", () => {
    mockUseOpenReceiveDrawer.mockReturnValue({
      handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
      isModularDrawerEnabled: false,
    });

    const { result } = renderHook(() => usePostOnboardingActionHandlers());

    act(() => {
      const assetsTransferHandler = result.current[PostOnboardingActionId.assetsTransfer];
      assetsTransferHandler?.();
    });

    expect(mockHandleOpenReceiveDrawer).not.toHaveBeenCalled();
  });

  it("should initialize useOpenReceiveDrawer with post-onboarding source screen", () => {
    mockUseOpenReceiveDrawer.mockReturnValue({
      handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
      isModularDrawerEnabled: true,
    });

    renderHook(() => usePostOnboardingActionHandlers());

    expect(mockUseOpenReceiveDrawer).toHaveBeenCalledWith({
      sourceScreenName: "post-onboarding",
    });
  });

  it("should not return handlers for unsupported PostOnboardingActionId values", () => {
    mockUseOpenReceiveDrawer.mockReturnValue({
      handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
      isModularDrawerEnabled: true,
    });

    const { result } = renderHook(() => usePostOnboardingActionHandlers());

    expect(result.current[PostOnboardingActionId.buyCrypto]).toBeUndefined();
    expect(result.current[PostOnboardingActionId.customImage]).toBeUndefined();
  });
});
