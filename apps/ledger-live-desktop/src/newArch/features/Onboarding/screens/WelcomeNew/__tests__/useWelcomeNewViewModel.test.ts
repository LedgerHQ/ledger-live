/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "tests/testSetup";
import { useWelcomeNewViewModel } from "../hooks/useWelcomeNewViewModel";

// Mock dependencies
const mockHistoryPush = jest.fn();
const mockDispatch = jest.fn();
const mockOpenURL = jest.fn();
const mockAcceptTerms = jest.fn();

jest.mock("react-router-dom", () => ({
  useHistory: () => ({ push: mockHistoryPush }),
}));

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: unknown) => unknown) => {
    if (selector.toString().includes("hasCompletedOnboarding")) {
      return false;
    }
    if (selector.toString().includes("trustchain")) {
      return null;
    }
    return {};
  },
}));

jest.mock("~/renderer/linking", () => ({
  openURL: (...args: unknown[]) => mockOpenURL(...args),
}));

jest.mock("~/renderer/terms", () => ({
  acceptTerms: (...args: unknown[]) => mockAcceptTerms(...args),
}));

jest.mock("~/renderer/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: (url: string) => url,
}));

jest.mock("LLD/features/AnalyticsOptInPrompt/hooks/useCommonLogic", () => ({
  useAnalyticsOptInPrompt: () => ({
    analyticsOptInPromptProps: {},
    isFeatureFlagsAnalyticsPrefDisplayed: false,
    openAnalyticsOptInPrompt: jest.fn(),
    onSubmit: jest.fn(),
  }),
}));

jest.mock("LLD/features/LedgerSyncEntryPoints/hooks/useActivationDrawer", () => ({
  useActivationDrawer: () => ({
    openDrawer: jest.fn(),
    closeDrawer: jest.fn(),
  }),
}));

describe("useWelcomeNewViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should provide all necessary properties and handlers", () => {
    const { result } = renderHook(() => useWelcomeNewViewModel());

    expect(result.current).toHaveProperty("t");
    expect(result.current).toHaveProperty("accessSettings");
    expect(result.current).toHaveProperty("openTermsAndConditions");
    expect(result.current).toHaveProperty("openPrivacyPolicy");
    expect(result.current).toHaveProperty("handleGetStarted");
    expect(result.current).toHaveProperty("handleBuyNew");
    expect(result.current).toHaveProperty("handleSetupLedgerSync");
    expect(result.current).toHaveProperty("skipOnboarding");
    expect(result.current).toHaveProperty("isFeatureFlagsSettingsButtonDisplayed");
    expect(result.current).toHaveProperty("handleOpenFeatureFlagsDrawer");
  });

  it("should handle get started action", () => {
    const { result } = renderHook(() => useWelcomeNewViewModel());

    act(() => {
      result.current.handleGetStarted();
    });

    expect(mockAcceptTerms).toHaveBeenCalled();
    expect(mockHistoryPush).toHaveBeenCalledWith("/onboarding/select-device");
  });

  it("should handle buy new action", () => {
    const { result } = renderHook(() => useWelcomeNewViewModel());

    act(() => {
      result.current.handleBuyNew();
    });

    expect(mockOpenURL).toHaveBeenCalled();
  });

  it("should handle setup ledger sync action", () => {
    const { result } = renderHook(() => useWelcomeNewViewModel());

    act(() => {
      result.current.handleSetupLedgerSync();
    });

    expect(mockAcceptTerms).toHaveBeenCalled();
    // Note: openDrawer is mocked inside useActivationDrawer hook
  });

  it("should handle skip onboarding (dev only)", () => {
    const { result } = renderHook(() => useWelcomeNewViewModel());

    act(() => {
      result.current.skipOnboarding();
    });

    expect(mockDispatch).toHaveBeenCalled();
    expect(mockHistoryPush).toHaveBeenCalledWith("/settings");
  });

  it("should handle feature flags easter egg", () => {
    const { result } = renderHook(() => useWelcomeNewViewModel());

    // Initially should not display feature flags button
    expect(result.current.isFeatureFlagsSettingsButtonDisplayed).toBe(false);

    // Simulate clicking the easter egg multiple times
    act(() => {
      // Click logo multiple times
      for (let i = 0; i < 4; i++) {
        result.current.handleOpenFeatureFlagsDrawer("1");
      }
      // Click progress bars multiple times
      for (let i = 0; i < 6; i++) {
        result.current.handleOpenFeatureFlagsDrawer("2");
      }
    });

    expect(result.current.isFeatureFlagsSettingsButtonDisplayed).toBe(true);
  });

  it("should open terms and conditions", () => {
    const { result } = renderHook(() => useWelcomeNewViewModel());

    act(() => {
      result.current.openTermsAndConditions();
    });

    expect(mockOpenURL).toHaveBeenCalled();
  });

  it("should open privacy policy", () => {
    const { result } = renderHook(() => useWelcomeNewViewModel());

    act(() => {
      result.current.openPrivacyPolicy();
    });

    expect(mockOpenURL).toHaveBeenCalled();
  });
});
