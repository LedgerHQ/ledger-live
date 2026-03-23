import { renderHook, act } from "tests/testSetup";
import { useNavigate } from "react-router";
import { useWelcomeViewModel } from "../useWelcomeViewModel";
import { AFTER_ONBOARDING_STATE, INITIAL_STATE } from "~/renderer/reducers/settings";

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

describe("useWelcomeViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
  });

  describe("navigation effect when onboarding is completed", () => {
    it('should navigate to "/" when lazy onboarding and no onboarded/seen device', () => {
      renderHook(() => useWelcomeViewModel(), {
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

    it('should navigate to "/onboarding/select-device" when lazy onboarding but user has a seen device', () => {
      renderHook(() => useWelcomeViewModel(), {
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
            lastSeenDevice: AFTER_ONBOARDING_STATE.lastSeenDevice,
          },
        },
      });

      expect(mockNavigate).toHaveBeenCalledWith("/onboarding/select-device");
    });

    it('should navigate to "/onboarding/select-device" when shouldUseLazyOnboarding is false and onboarding completed', () => {
      renderHook(() => useWelcomeViewModel(), {
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
      const { result, store } = renderHook(() => useWelcomeViewModel(), {
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
      const { result } = renderHook(() => useWelcomeViewModel(), {
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
