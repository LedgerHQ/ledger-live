/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useWelcomeViewModel } from "../useWelcomeViewModel";

// Mock dependencies
const mockHistoryPush = jest.fn();
const mockDispatch = jest.fn();
const mockOpenURL = jest.fn();
const mockAcceptTerms = jest.fn();
const mockOpenAnalyticsOptInPrompt = jest.fn();
const mockOpenDrawer = jest.fn();
const mockCloseDrawer = jest.fn();

jest.mock("react-router-dom", () => ({
  useHistory: () => ({ push: mockHistoryPush }),
}));

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => {
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
  openURL: mockOpenURL,
}));

jest.mock("~/renderer/terms", () => ({
  acceptTerms: mockAcceptTerms,
}));

jest.mock("~/renderer/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: (url: string) => url,
}));

jest.mock("LLD/features/AnalyticsOptInPrompt/hooks/useCommonLogic", () => ({
  useAnalyticsOptInPrompt: () => ({
    analyticsOptInPromptProps: {},
    isFeatureFlagsAnalyticsPrefDisplayed: false,
    openAnalyticsOptInPrompt: mockOpenAnalyticsOptInPrompt,
    onSubmit: jest.fn(),
  }),
}));

jest.mock("LLD/features/LedgerSyncEntryPoints/hooks/useActivationDrawer", () => ({
  useActivationDrawer: () => ({
    openDrawer: mockOpenDrawer,
    closeDrawer: mockCloseDrawer,
  }),
}));

describe("useWelcomeViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should provide all necessary properties and handlers", () => {
    const { result } = renderHook(() => useWelcomeViewModel());

    expect(result.current).toHaveProperty("t");
    expect(result.current).toHaveProperty("history");
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
    const { result } = renderHook(() => useWelcomeViewModel());

    act(() => {
      result.current.handleGetStarted();
    });

    expect(mockAcceptTerms).toHaveBeenCalled();
    expect(mockHistoryPush).toHaveBeenCalledWith("/onboarding/select-device");
  });

  it("should handle buy new action", () => {
    const { result } = renderHook(() => useWelcomeViewModel());

    act(() => {
      result.current.handleBuyNew();
    });

    expect(mockOpenURL).toHaveBeenCalled();
  });

  it("should handle setup ledger sync action", () => {
    const { result } = renderHook(() => useWelcomeViewModel());

    act(() => {
      result.current.handleSetupLedgerSync();
    });

    expect(mockAcceptTerms).toHaveBeenCalled();
    expect(mockOpenDrawer).toHaveBeenCalled();
  });

  it("should handle skip onboarding (dev only)", () => {
    const { result } = renderHook(() => useWelcomeViewModel());

    act(() => {
      result.current.skipOnboarding();
    });

    expect(mockDispatch).toHaveBeenCalled();
    expect(mockHistoryPush).toHaveBeenCalledWith("/settings");
  });

  it("should handle feature flags easter egg", () => {
    const { result } = renderHook(() => useWelcomeViewModel());

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
    const { result } = renderHook(() => useWelcomeViewModel());

    act(() => {
      result.current.openTermsAndConditions();
    });

    expect(mockOpenURL).toHaveBeenCalled();
  });

  it("should open privacy policy", () => {
    const { result } = renderHook(() => useWelcomeViewModel());

    act(() => {
      result.current.openPrivacyPolicy();
    });

    expect(mockOpenURL).toHaveBeenCalled();
  });
});
