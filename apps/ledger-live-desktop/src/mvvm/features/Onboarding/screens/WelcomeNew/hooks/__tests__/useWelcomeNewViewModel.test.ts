import { renderHook, act } from "tests/testSetup";
import { useNavigate } from "react-router";
import { useWelcomeNewViewModel } from "../useWelcomeNewViewModel";
import { INITIAL_STATE } from "~/renderer/reducers/settings";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
}));

jest.mock("~/renderer/terms", () => ({
  acceptTerms: jest.fn(),
}));

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

jest.mock("LLD/features/AnalyticsOptInPrompt/hooks/useCommonLogic", () => ({
  useAnalyticsOptInPrompt: jest.fn(() => ({
    analyticsOptInPromptProps: {},
    isFeatureFlagsAnalyticsPrefDisplayed: false,
    openAnalyticsOptInPrompt: jest.fn(),
    onSubmit: jest.fn(),
  })),
}));

jest.mock("LLD/features/LedgerSyncEntryPoints/hooks/useActivationDrawer", () => ({
  useActivationDrawer: jest.fn(() => ({
    openDrawer: jest.fn(),
    closeDrawer: jest.fn(),
  })),
}));

const mockedUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;

describe("useWelcomeNewViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
  });

  describe("navigation effect when onboarding is completed", () => {
    it('should navigate to "/" when shouldUseLazyOnboarding is true and onboarding completed', () => {
      renderHook(() => useWelcomeNewViewModel(), {
        initialState: {
          settings: {
            ...INITIAL_STATE,
            hasCompletedOnboarding: true,
            overriddenFeatureFlags: {
              lwdWallet40: {
                enabled: true,
                params: { lazyOnboarding: true },
              },
            },
          },
        },
      });

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it('should navigate to "/onboarding/select-device" when shouldUseLazyOnboarding is false and onboarding completed', () => {
      renderHook(() => useWelcomeNewViewModel(), {
        initialState: {
          settings: {
            ...INITIAL_STATE,
            hasCompletedOnboarding: true,
          },
        },
      });

      expect(mockNavigate).toHaveBeenCalledWith("/onboarding/select-device");
    });
  });

  describe("handleGetStarted with lazy onboarding", () => {
    it('should set hasCompletedOnboarding to true and navigate to "/" when lazy onboarding is enabled', () => {
      const { result, store } = renderHook(() => useWelcomeNewViewModel(), {
        initialState: {
          settings: {
            ...INITIAL_STATE,
            hasCompletedOnboarding: false,
            overriddenFeatureFlags: {
              lwdWallet40: {
                enabled: true,
                params: { lazyOnboarding: true },
              },
            },
          },
        },
      });

      act(() => {
        result.current.handleGetStarted();
      });

      expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it('should navigate to "/onboarding/select-device" when lazy onboarding is disabled', () => {
      const { result } = renderHook(() => useWelcomeNewViewModel(), {
        initialState: {
          settings: {
            ...INITIAL_STATE,
            hasCompletedOnboarding: false,
          },
        },
      });

      act(() => {
        result.current.handleGetStarted();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/onboarding/select-device");
    });
  });
});
